const initSqlJs = require('./sql-asm.js');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const isVercel = Boolean(process.env.VERCEL);
const DATA_DIR = isVercel ? path.join('/tmp', 'data') : path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'studio_finance.db');

let db = null;
let SQL = null;

// Helper to convert sql.js exec result to array of objects
function rowsToObjects(res) {
  if (!res || res.length === 0) return [];
  const { columns, values } = res[0];
  return values.map(row => {
    const obj = {};
    columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj;
  });
}

function saveDb() {
  if (!db) return;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE, buffer);
  } catch (err) {
    console.error('Error saving SQLite database to file:', err);
  }
}

async function initDb() {
  if (db) return db;

  if (isVercel && !fs.existsSync(DB_FILE)) {
    const bundledDb = path.join(__dirname, '..', 'data', 'studio_finance.db');
    if (fs.existsSync(bundledDb)) {
      try {
        if (!fs.existsSync(DATA_DIR)) {
          fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        fs.copyFileSync(bundledDb, DB_FILE);
      } catch (_) {}
    }
  }

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  SQL = await initSqlJs();

  if (fs.existsSync(DB_FILE)) {
    try {
      const fileBuffer = fs.readFileSync(DB_FILE);
      db = new SQL.Database(fileBuffer);
      console.log('Loaded existing SQLite database from:', DB_FILE);
    } catch (err) {
      console.warn('Could not read existing db file, creating new database:', err.message);
      db = new SQL.Database();
    }
  } else {
    db = new SQL.Database();
    console.log('Created fresh SQLite database in memory, will persist to:', DB_FILE);
  }

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY,
      business_name TEXT NOT NULL,
      passport_base_qty INTEGER NOT NULL DEFAULT 4,
      passport_base_price REAL NOT NULL DEFAULT 200,
      passport_reprint_price REAL NOT NULL DEFAULT 100,
      photostat_price_per_copy REAL NOT NULL DEFAULT 4,
      staff_salary_monthly REAL NOT NULL DEFAULT 15600,
      rent_daily_rate REAL NOT NULL DEFAULT 600,
      electricity_monthly REAL NOT NULL DEFAULT 1500,
      currency_symbol TEXT NOT NULL DEFAULT '₹',
      currency_code TEXT NOT NULL DEFAULT 'INR',
      rent_default_applicable INTEGER NOT NULL DEFAULT 1,
      app_password TEXT NOT NULL DEFAULT '4567',
      is_password_set INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      type TEXT NOT NULL, -- 'income' | 'expense'
      category TEXT NOT NULL, -- 'passport' | 'photostat' | 'other_income' | 'staff_salary' | 'rent' | 'electricity' | 'supplies' | 'maintenance' | 'other'
      description TEXT,
      quantity INTEGER DEFAULT 1,
      rate REAL DEFAULT 0,
      amount REAL NOT NULL,
      is_recurring INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
    CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
    CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);

    CREATE TABLE IF NOT EXISTS rent_records (
      date TEXT PRIMARY KEY,
      applicable INTEGER NOT NULL DEFAULT 1,
      daily_rate REAL NOT NULL DEFAULT 600,
      notes TEXT,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS monthly_summaries (
      year_month TEXT PRIMARY KEY,
      total_income REAL DEFAULT 0,
      passport_income REAL DEFAULT 0,
      photostat_income REAL DEFAULT 0,
      other_income REAL DEFAULT 0,
      total_expenses REAL DEFAULT 0,
      salary_expense REAL DEFAULT 0,
      rent_expense REAL DEFAULT 0,
      electricity_expense REAL DEFAULT 0,
      other_expenses REAL DEFAULT 0,
      net_profit REAL DEFAULT 0,
      profit_margin REAL DEFAULT 0,
      updated_at TEXT NOT NULL
    );
  `);

  // Migration for existing database
  try {
    db.run(`ALTER TABLE settings ADD COLUMN app_password TEXT NOT NULL DEFAULT '4567'`);
  } catch (_) {}
  try {
    db.run(`ALTER TABLE settings ADD COLUMN is_password_set INTEGER NOT NULL DEFAULT 1`);
  } catch (_) {}

  // Ensure default settings exist
  const existingSettings = query('SELECT * FROM settings WHERE id = 1');
  if (existingSettings.length === 0) {
    const now = new Date().toISOString();
    run(
      `INSERT INTO settings (
        id, business_name, passport_base_qty, passport_base_price, passport_reprint_price,
        photostat_price_per_copy, staff_salary_monthly, rent_daily_rate, electricity_monthly,
        currency_symbol, currency_code, rent_default_applicable, app_password, is_password_set, created_at, updated_at
      ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'Modern Photo & Photostat Studio',
        4,
        200,
        100,
        4,
        15600,
        600,
        1500,
        '₹',
        'INR',
        1,
        '4567',
        1,
        now,
        now,
      ]
    );
    console.log('Initialized default studio settings in database.');
  }

  saveDb();
  return db;
}

function sanitizeParams(params = []) {
  if (!Array.isArray(params)) return params;
  return params.map(p => (p === undefined ? null : p));
}

// Database helper functions
function query(sql, params = []) {
  if (!db) throw new Error('Database not initialized. Call initDb() first.');
  const stmt = db.prepare(sql);
  const cleanParams = sanitizeParams(params);
  if (cleanParams && cleanParams.length > 0) {
    stmt.bind(cleanParams);
  }
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

function queryOne(sql, params = []) {
  const rows = query(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

function run(sql, params = []) {
  if (!db) throw new Error('Database not initialized. Call initDb() first.');
  const cleanParams = sanitizeParams(params);
  if (cleanParams && cleanParams.length > 0) {
    db.run(sql, cleanParams);
  } else {
    db.run(sql);
  }
  saveDb();
  return { success: true };
}

// Transaction execution helper
function runInTransaction(callback) {
  if (!db) throw new Error('Database not initialized. Call initDb() first.');
  const result = callback();
  saveDb();
  return result;
}

module.exports = {
  initDb,
  query,
  queryOne,
  run,
  runInTransaction,
  saveDb,
};
