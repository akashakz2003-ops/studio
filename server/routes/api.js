const express = require('express');
const router = express.Router();
const { query, queryOne, run, runInTransaction } = require('../db');
const { v4: uuidv4 } = require('uuid');

// Helper to get formatted date strings
function getTodayDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getMonthString(dateStr) {
  return dateStr.substring(0, 7); // YYYY-MM
}

function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

const DEFAULT_SETTINGS = {
  id: 1,
  business_name: 'Modern Photo & Photostat Studio',
  passport_base_qty: 4,
  passport_base_price: 200,
  passport_reprint_price: 100,
  photostat_price_per_copy: 4,
  staff_salary_monthly: 15600,
  rent_daily_rate: 600,
  electricity_monthly: 1500,
  currency_symbol: '₹',
  currency_code: 'INR',
  rent_default_applicable: 1,
  is_password_set: false,
};

function getSafeSettings() {
  try {
    const s = queryOne('SELECT * FROM settings WHERE id = 1');
    if (s) {
      const { app_password, ...safe } = s;
      safe.is_password_set = false;
      return { ...DEFAULT_SETTINGS, ...safe };
    }
  } catch (_) {}
  return { ...DEFAULT_SETTINGS };
}

// -------------------------------------------------------------
// AUTHENTICATION & SECURITY ENDPOINTS
// -------------------------------------------------------------
router.get('/auth/status', (req, res) => {
  try {
    const settings = queryOne('SELECT business_name, is_password_set FROM settings WHERE id = 1');
    res.json({
      success: true,
      isPasswordRequired: false,
      isPasswordSet: false,
      businessName: settings?.business_name || 'Photo & Photostat Studio',
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/auth/setup-password', (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Password not required',
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/auth/login', (req, res) => {
  try {
    const settings = queryOne('SELECT business_name FROM settings WHERE id = 1');
    res.json({
      success: true,
      message: 'Unlocked',
      businessName: settings?.business_name,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/auth/change-password', (req, res) => {
  try {
    res.json({ success: true, message: 'Password disabled' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// SETTINGS ENDPOINTS
// -------------------------------------------------------------
router.get('/settings', (req, res) => {
  try {
    const safeSettings = getSafeSettings();
    return res.json({ success: true, data: safeSettings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/settings', (req, res) => {
  try {
    const {
      business_name,
      passport_base_qty,
      passport_base_price,
      passport_reprint_price,
      photostat_price_per_copy,
      staff_salary_monthly,
      rent_daily_rate,
      electricity_monthly,
      currency_symbol,
      currency_code,
      rent_default_applicable,
    } = req.body;

    const now = new Date().toISOString();

    run(
      `UPDATE settings SET
        business_name = COALESCE(?, business_name),
        passport_base_qty = COALESCE(?, passport_base_qty),
        passport_base_price = COALESCE(?, passport_base_price),
        passport_reprint_price = COALESCE(?, passport_reprint_price),
        photostat_price_per_copy = COALESCE(?, photostat_price_per_copy),
        staff_salary_monthly = COALESCE(?, staff_salary_monthly),
        rent_daily_rate = COALESCE(?, rent_daily_rate),
        electricity_monthly = COALESCE(?, electricity_monthly),
        currency_symbol = COALESCE(?, currency_symbol),
        currency_code = COALESCE(?, currency_code),
        rent_default_applicable = COALESCE(?, rent_default_applicable),
        updated_at = ?
      WHERE id = 1`,
      [
        business_name !== undefined ? business_name : null,
        passport_base_qty !== undefined ? Number(passport_base_qty) : null,
        passport_base_price !== undefined ? Number(passport_base_price) : null,
        passport_reprint_price !== undefined ? Number(passport_reprint_price) : null,
        photostat_price_per_copy !== undefined ? Number(photostat_price_per_copy) : null,
        staff_salary_monthly !== undefined ? Number(staff_salary_monthly) : null,
        rent_daily_rate !== undefined ? Number(rent_daily_rate) : null,
        electricity_monthly !== undefined ? Number(electricity_monthly) : null,
        currency_symbol !== undefined ? currency_symbol : null,
        currency_code !== undefined ? currency_code : null,
        rent_default_applicable !== undefined ? Number(rent_default_applicable) : null,
        now,
      ]
    );

    const updated = queryOne('SELECT * FROM settings WHERE id = 1');
    if (updated) {
      const { app_password: _, ...safeUpdated } = updated;
      safeUpdated.is_password_set = false;
      return res.json({ success: true, data: safeUpdated });
    }
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// RENT DAYS TRACKING ENDPOINTS
// -------------------------------------------------------------
router.get('/rent-days', (req, res) => {
  try {
    const settings = getSafeSettings();
    const month = req.query.month || getMonthString(getTodayDateString()); // YYYY-MM
    const [yearStr, monthStr] = month.split('-');
    const year = parseInt(yearStr, 10);
    const m = parseInt(monthStr, 10);
    const numDays = getDaysInMonth(year, m);

    // Get explicit rent records for this month
    const existingRecords = query(
      `SELECT * FROM rent_records WHERE date LIKE ? ORDER BY date ASC`,
      [`${month}%`]
    );
    const recordMap = {};
    existingRecords.forEach(r => {
      recordMap[r.date] = r;
    });

    const daysList = [];
    let totalRentDays = 0;

    for (let day = 1; day <= numDays; day++) {
      const dateStr = `${month}-${String(day).padStart(2, '0')}`;
      const rec = recordMap[dateStr];
      const applicable = rec ? rec.applicable : settings.rent_default_applicable;
      const dailyRate = rec ? rec.daily_rate : settings.rent_daily_rate;

      if (applicable === 1) {
        totalRentDays++;
      }

      daysList.push({
        date: dateStr,
        day,
        applicable: applicable === 1 ? 1 : 0,
        dailyRate,
        isCustom: !!rec,
        notes: rec ? rec.notes : '',
      });
    }

    const totalRentAmount = totalRentDays * settings.rent_daily_rate;

    res.json({
      success: true,
      month,
      dailyRate: settings.rent_daily_rate,
      totalDaysInMonth: numDays,
      totalRentDays,
      totalRentAmount,
      days: daysList,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/rent-days/toggle', (req, res) => {
  try {
    const { date, applicable, notes } = req.body;
    if (!date) {
      return res.status(400).json({ success: false, error: 'Date is required' });
    }

    const settings = getSafeSettings();
    const now = new Date().toISOString();
    const appVal = applicable ? 1 : 0;

    // Check if record exists
    const existing = queryOne('SELECT * FROM rent_records WHERE date = ?', [date]);
    if (existing) {
      run(
        `UPDATE rent_records SET applicable = ?, daily_rate = ?, notes = ?, updated_at = ? WHERE date = ?`,
        [appVal, settings.rent_daily_rate, notes || existing.notes || '', now, date]
      );
    } else {
      run(
        `INSERT INTO rent_records (date, applicable, daily_rate, notes, updated_at) VALUES (?, ?, ?, ?, ?)`,
        [date, appVal, settings.rent_daily_rate, notes || '', now]
      );
    }

    res.json({ success: true, date, applicable: appVal });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/rent-days/bulk', (req, res) => {
  try {
    const { month, action } = req.body;
    if (!month) {
      return res.status(400).json({ success: false, error: 'Month (YYYY-MM) is required' });
    }

    const settings = getSafeSettings();
    const [yearStr, monthStr] = month.split('-');
    const year = parseInt(yearStr, 10);
    const m = parseInt(monthStr, 10);
    const numDays = getDaysInMonth(year, m);
    const now = new Date().toISOString();

    runInTransaction(() => {
      for (let day = 1; day <= numDays; day++) {
        const dateStr = `${month}-${String(day).padStart(2, '0')}`;
        const dayOfWeek = new Date(year, m - 1, day).getDay(); // 0 is Sunday

        let applicable = 1;
        if (action === 'all_no') {
          applicable = 0;
        } else if (action === 'exclude_sundays') {
          applicable = dayOfWeek === 0 ? 0 : 1;
        } else {
          // 'all_yes'
          applicable = 1;
        }

        const existing = queryOne('SELECT * FROM rent_records WHERE date = ?', [dateStr]);
        if (existing) {
          run(
            `UPDATE rent_records SET applicable = ?, daily_rate = ?, updated_at = ? WHERE date = ?`,
            [applicable, settings.rent_daily_rate, now, dateStr]
          );
        } else {
          run(
            `INSERT INTO rent_records (date, applicable, daily_rate, notes, updated_at) VALUES (?, ?, ?, ?, ?)`,
            [dateStr, applicable, settings.rent_daily_rate, '', now]
          );
        }
      }
    });

    res.json({ success: true, message: `Bulk updated rent days for ${month}` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// DAILY SALES SCREEN HELPERS
// -------------------------------------------------------------
router.get('/daily-sales', (req, res) => {
  try {
    const date = req.query.date || getTodayDateString();
    const settings = getSafeSettings();

    // Get all income transactions for this date
    const transactions = query(
      `SELECT * FROM transactions WHERE date = ? AND type = 'income' ORDER BY created_at DESC`,
      [date]
    );

    let passportRevenue = 0;
    let photostatRevenue = 0;
    let otherRevenue = 0;

    transactions.forEach(t => {
      if (t.category === 'passport') {
        passportRevenue += t.amount;
      } else if (t.category === 'photostat') {
        photostatRevenue += t.amount;
      } else {
        otherRevenue += t.amount;
      }
    });

    const totalRevenue = passportRevenue + photostatRevenue + otherRevenue;

    // Also get daily rent status for this date
    const rentRec = queryOne('SELECT * FROM rent_records WHERE date = ?', [date]);
    const rentApplicable = rentRec ? rentRec.applicable === 1 : settings.rent_default_applicable === 1;
    const dailyRent = rentApplicable ? settings.rent_daily_rate : 0;

    // Get any direct manual expenses for this date
    const manualExpenses = query(
      `SELECT * FROM transactions WHERE date = ? AND type = 'expense' ORDER BY created_at DESC`,
      [date]
    );
    const manualExpenseTotal = manualExpenses.reduce((sum, item) => sum + item.amount, 0);
    const totalDailyExpenses = dailyRent + manualExpenseTotal;
    const dailyProfit = totalRevenue - totalDailyExpenses;

    res.json({
      success: true,
      date,
      passportRevenue,
      photostatRevenue,
      otherRevenue,
      totalRevenue,
      rentApplicable,
      dailyRent,
      manualExpenseTotal,
      totalDailyExpenses,
      dailyProfit,
      transactions,
      manualExpenses,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Quick multi-entry or single entry endpoint for Daily Sales
router.post('/daily-sales/quick-entry', (req, res) => {
  try {
    const {
      date = getTodayDateString(),
      passportQty = 0,
      passportType = 'new', // 'new' or 'reprint'
      photostatCopies = 0,
      otherAmount = 0,
      otherDescription = '',
    } = req.body;

    const settings = getSafeSettings();
    const createdTransactions = [];
    const now = new Date().toISOString();

    runInTransaction(() => {
      // 1. Passport Photos Entry
      const pQty = parseInt(passportQty, 10);
      if (pQty > 0) {
        let amount = 0;
        let rate = 0;
        let desc = '';

        if (passportType === 'reprint') {
          rate = settings.passport_reprint_price;
          amount = pQty * rate;
          desc = `Passport photos (from digital / reprint) - ${pQty} photos`;
        } else {
          // Newly taken: 4 photos = ₹200 (₹50 per unit photo)
          const unitRate = settings.passport_base_price / settings.passport_base_qty;
          amount = Math.round(pQty * unitRate);
          rate = unitRate;
          desc = `Passport photos (new) - ${pQty} photos`;
        }

        const id = uuidv4();
        run(
          `INSERT INTO transactions (id, date, type, category, description, quantity, rate, amount, is_recurring, created_at, updated_at)
           VALUES (?, ?, 'income', 'passport', ?, ?, ?, ?, 0, ?, ?)`,
          [id, date, desc, pQty, rate, amount, now, now]
        );
        createdTransactions.push({ id, category: 'passport', quantity: pQty, rate, amount, description: desc });
      }

      // 2. Photostat Copies Entry
      const copies = parseInt(photostatCopies, 10);
      if (copies > 0) {
        const rate = settings.photostat_price_per_copy;
        const amount = copies * rate;
        const desc = `Photostat copies - ${copies} copies`;
        const id = uuidv4();
        run(
          `INSERT INTO transactions (id, date, type, category, description, quantity, rate, amount, is_recurring, created_at, updated_at)
           VALUES (?, ?, 'income', 'photostat', ?, ?, ?, ?, 0, ?, ?)`,
          [id, date, desc, copies, rate, amount, now, now]
        );
        createdTransactions.push({ id, category: 'photostat', quantity: copies, rate, amount, description: desc });
      }

      // 3. Other Income Entry
      const oAmount = parseFloat(otherAmount);
      if (oAmount > 0) {
        const desc = otherDescription.trim() || 'Other studio income';
        const id = uuidv4();
        run(
          `INSERT INTO transactions (id, date, type, category, description, quantity, rate, amount, is_recurring, created_at, updated_at)
           VALUES (?, ?, 'income', 'other_income', ?, 1, ?, ?, 0, ?, ?)`,
          [id, date, desc, oAmount, oAmount, now, now]
        );
        createdTransactions.push({ id, category: 'other_income', quantity: 1, rate: oAmount, amount: oAmount, description: desc });
      }
    });

    res.json({
      success: true,
      message: 'Daily entries saved successfully',
      date,
      createdTransactions,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// TRANSACTIONS CRUD ENDPOINTS
// -------------------------------------------------------------
router.get('/transactions', (req, res) => {
  try {
    const {
      startDate,
      endDate,
      type, // 'income' | 'expense' | 'all'
      category,
      search,
      page = 1,
      limit = 50,
    } = req.query;

    let sql = 'SELECT * FROM transactions WHERE 1=1';
    const params = [];

    if (startDate) {
      sql += ' AND date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND date <= ?';
      params.push(endDate);
    }
    if (type && type !== 'all') {
      sql += ' AND type = ?';
      params.push(type);
    }
    if (category && category !== 'all') {
      sql += ' AND category = ?';
      params.push(category);
    }
    if (search && search.trim()) {
      sql += ' AND (description LIKE ? OR category LIKE ?)';
      params.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    // Count query
    const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as count');
    const countRow = queryOne(countSql, params);
    const total = countRow ? countRow.count : 0;

    // Ordering and pagination
    sql += ' ORDER BY date DESC, created_at DESC';
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const offset = (pageNum - 1) * limitNum;
    sql += ` LIMIT ${limitNum} OFFSET ${offset}`;

    const transactions = query(sql, params);

    res.json({
      success: true,
      data: transactions,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/transactions', (req, res) => {
  try {
    const {
      date = getTodayDateString(),
      type = 'income',
      category = 'other_income',
      description = '',
      quantity = 1,
      rate = 0,
      amount,
    } = req.body;

    if (amount === undefined || amount === null || isNaN(amount) || Number(amount) < 0) {
      return res.status(400).json({ success: false, error: 'Valid non-negative amount is required' });
    }

    const id = uuidv4();
    const now = new Date().toISOString();
    const numQty = parseInt(quantity, 10) || 1;
    const numRate = parseFloat(rate) || 0;
    const numAmount = parseFloat(amount);

    run(
      `INSERT INTO transactions (id, date, type, category, description, quantity, rate, amount, is_recurring, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
      [id, date, type, category, description.trim(), numQty, numRate, numAmount, now, now]
    );

    const created = queryOne('SELECT * FROM transactions WHERE id = ?', [id]);
    res.json({ success: true, data: created });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/transactions/:id', (req, res) => {
  try {
    const { id } = req.params;
    const existing = queryOne('SELECT * FROM transactions WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Transaction not found' });
    }

    const {
      date,
      type,
      category,
      description,
      quantity,
      rate,
      amount,
    } = req.body;

    if (amount !== undefined && (isNaN(amount) || Number(amount) < 0)) {
      return res.status(400).json({ success: false, error: 'Amount cannot be negative' });
    }

    const now = new Date().toISOString();

    run(
      `UPDATE transactions SET
        date = COALESCE(?, date),
        type = COALESCE(?, type),
        category = COALESCE(?, category),
        description = COALESCE(?, description),
        quantity = COALESCE(?, quantity),
        rate = COALESCE(?, rate),
        amount = COALESCE(?, amount),
        updated_at = ?
       WHERE id = ?`,
      [
        date !== undefined ? date : null,
        type !== undefined ? type : null,
        category !== undefined ? category : null,
        description !== undefined ? description.trim() : null,
        quantity !== undefined ? parseInt(quantity, 10) : null,
        rate !== undefined ? parseFloat(rate) : null,
        amount !== undefined ? parseFloat(amount) : null,
        now,
        id,
      ]
    );

    const updated = queryOne('SELECT * FROM transactions WHERE id = ?', [id]);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/transactions/:id', (req, res) => {
  try {
    const { id } = req.params;
    const existing = queryOne('SELECT * FROM transactions WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Transaction not found' });
    }

    run('DELETE FROM transactions WHERE id = ?', [id]);
    res.json({ success: true, message: 'Transaction deleted successfully', id });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// EXPENSES SUMMARY & ENTRY ENDPOINT
// -------------------------------------------------------------
router.get('/expenses', (req, res) => {
  try {
    const month = req.query.month || getMonthString(getTodayDateString());
    const settings = getSafeSettings();

    // 1. Manual expenses in this month
    const manualExpenses = query(
      `SELECT * FROM transactions WHERE date LIKE ? AND type = 'expense' ORDER BY date DESC, created_at DESC`,
      [`${month}%`]
    );

    // Group manual expenses by category
    const categoryTotals = {
      staff_salary: 0,
      rent: 0,
      electricity: 0,
      supplies: 0,
      maintenance: 0,
      other: 0,
    };

    manualExpenses.forEach(e => {
      const cat = categoryTotals[e.category] !== undefined ? e.category : 'other';
      categoryTotals[cat] += e.amount;
    });

    // 2. Rent Calculation for month
    const [yearStr, monthStr] = month.split('-');
    const year = parseInt(yearStr, 10);
    const m = parseInt(monthStr, 10);
    const numDays = getDaysInMonth(year, m);

    const rentRecords = query(
      `SELECT * FROM rent_records WHERE date LIKE ?`,
      [`${month}%`]
    );
    const recordMap = {};
    rentRecords.forEach(r => { recordMap[r.date] = r; });

    let rentDaysCount = 0;
    for (let day = 1; day <= numDays; day++) {
      const dateStr = `${month}-${String(day).padStart(2, '0')}`;
      const rec = recordMap[dateStr];
      const applicable = rec ? rec.applicable === 1 : settings.rent_default_applicable === 1;
      if (applicable) rentDaysCount++;
    }

    const calculatedRentTotal = rentDaysCount * settings.rent_daily_rate;

    // Recurring expenses
    const recurringSalary = settings.staff_salary_monthly;
    const recurringElectricity = settings.electricity_monthly;

    // Total monthly expenses:
    // We include recurring salary, recurring electricity, and calculated rent,
    // PLUS any additional/manual expenses recorded in categories supplies, maintenance, and other.
    // If user added manual salary or rent entries, they are accounted for or separate.
    const suppliesTotal = categoryTotals.supplies;
    const maintenanceTotal = categoryTotals.maintenance;
    const otherExpenseTotal = categoryTotals.other;

    const totalMonthlyExpenses =
      recurringSalary +
      calculatedRentTotal +
      recurringElectricity +
      suppliesTotal +
      maintenanceTotal +
      otherExpenseTotal;

    res.json({
      success: true,
      month,
      recurring: {
        staffSalary: recurringSalary,
        electricity: recurringElectricity,
        rentDaysCount,
        rentDailyRate: settings.rent_daily_rate,
        rentTotal: calculatedRentTotal,
      },
      categoryTotals: {
        staffSalary: recurringSalary,
        rent: calculatedRentTotal,
        electricity: recurringElectricity,
        supplies: suppliesTotal,
        maintenance: maintenanceTotal,
        other: otherExpenseTotal,
      },
      totalMonthlyExpenses,
      manualExpenses,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// DASHBOARD STATS AGGREGATION
// -------------------------------------------------------------
router.get('/dashboard/stats', (req, res) => {
  try {
    const today = req.query.date || getTodayDateString();
    const month = req.query.month || getMonthString(today);
    const settings = getSafeSettings();

    // 1. Today's Revenue
    const todayIncomes = query(
      `SELECT category, amount FROM transactions WHERE date = ? AND type = 'income'`,
      [today]
    );
    let todayPassport = 0;
    let todayPhotostat = 0;
    let todayOther = 0;
    todayIncomes.forEach(t => {
      if (t.category === 'passport') todayPassport += t.amount;
      else if (t.category === 'photostat') todayPhotostat += t.amount;
      else todayOther += t.amount;
    });
    const todayRevenue = todayPassport + todayPhotostat + todayOther;

    // 2. Today's Expenses
    const todayRentRec = queryOne('SELECT * FROM rent_records WHERE date = ?', [today]);
    const todayRentApp = todayRentRec ? todayRentRec.applicable === 1 : settings.rent_default_applicable === 1;
    const todayRent = todayRentApp ? settings.rent_daily_rate : 0;

    const todayManualExpenses = query(
      `SELECT amount FROM transactions WHERE date = ? AND type = 'expense'`,
      [today]
    );
    const todayManualExpTotal = todayManualExpenses.reduce((sum, e) => sum + e.amount, 0);
    const todayExpenses = todayRent + todayManualExpTotal;
    const todayNetProfit = todayRevenue - todayExpenses;

    // 3. This Month's Revenue
    const monthIncomes = query(
      `SELECT category, amount FROM transactions WHERE date LIKE ? AND type = 'income'`,
      [`${month}%`]
    );
    let monthPassport = 0;
    let monthPhotostat = 0;
    let monthOther = 0;
    monthIncomes.forEach(t => {
      if (t.category === 'passport') monthPassport += t.amount;
      else if (t.category === 'photostat') monthPhotostat += t.amount;
      else monthOther += t.amount;
    });
    const monthRevenue = monthPassport + monthPhotostat + monthOther;

    // 4. This Month's Expenses
    const [yearStr, monthStr] = month.split('-');
    const year = parseInt(yearStr, 10);
    const m = parseInt(monthStr, 10);
    const numDays = getDaysInMonth(year, m);

    const monthRentRecords = query(`SELECT * FROM rent_records WHERE date LIKE ?`, [`${month}%`]);
    const rentMap = {};
    monthRentRecords.forEach(r => { rentMap[r.date] = r; });

    let monthRentDays = 0;
    for (let day = 1; day <= numDays; day++) {
      const dateStr = `${month}-${String(day).padStart(2, '0')}`;
      const rec = rentMap[dateStr];
      const app = rec ? rec.applicable === 1 : settings.rent_default_applicable === 1;
      if (app) monthRentDays++;
    }
    const monthRentTotal = monthRentDays * settings.rent_daily_rate;

    const monthManualExpenses = query(
      `SELECT category, amount FROM transactions WHERE date LIKE ? AND type = 'expense'`,
      [`${month}%`]
    );

    let monthSupplies = 0;
    let monthMaintenance = 0;
    let monthOtherExp = 0;
    monthManualExpenses.forEach(e => {
      if (e.category === 'supplies') monthSupplies += e.amount;
      else if (e.category === 'maintenance') monthMaintenance += e.amount;
      else if (e.category !== 'staff_salary' && e.category !== 'rent' && e.category !== 'electricity') {
        monthOtherExp += e.amount;
      }
    });

    const monthSalaryTotal = settings.staff_salary_monthly;
    const monthElectricityTotal = settings.electricity_monthly;
    const monthExpenses =
      monthSalaryTotal +
      monthRentTotal +
      monthElectricityTotal +
      monthSupplies +
      monthMaintenance +
      monthOtherExp;

    const monthNetProfit = monthRevenue - monthExpenses;
    const monthProfitMargin = monthRevenue > 0 ? ((monthNetProfit / monthRevenue) * 100).toFixed(1) : '0.0';

    // 5. Revenue Breakdown Percentages
    const pPhotoShare = monthRevenue > 0 ? Math.round((monthPassport / monthRevenue) * 100) : 0;
    const pPhotoStatShare = monthRevenue > 0 ? Math.round((monthPhotostat / monthRevenue) * 100) : 0;
    const pOtherShare = monthRevenue > 0 ? Math.max(0, 100 - pPhotoShare - pPhotoStatShare) : 0;

    // 6. Expense Breakdown Percentages
    const expTotal = monthExpenses || 1;
    const salaryShare = Math.round((monthSalaryTotal / expTotal) * 100);
    const rentShare = Math.round((monthRentTotal / expTotal) * 100);
    const electricityShare = Math.round((monthElectricityTotal / expTotal) * 100);
    const otherExpShare = Math.max(0, 100 - salaryShare - rentShare - electricityShare);

    // 7. Dynamic Smart Financial Insights (Strictly from actual data)
    const insights = [];
    insights.push(`Today's revenue is ₹${todayRevenue.toLocaleString('en-IN')}.`);
    insights.push(`This month you have generated ₹${monthRevenue.toLocaleString('en-IN')} in total revenue.`);

    if (monthPhotostat > 0) {
      insights.push(`Photostat contributed ₹${monthPhotostat.toLocaleString('en-IN')} (${pPhotoStatShare}%) this month.`);
    }
    if (monthPassport > 0) {
      insights.push(`Passport photos contributed ₹${monthPassport.toLocaleString('en-IN')} (${pPhotoShare}%) this month.`);
    }

    insights.push(`Your total expenses this month are ₹${monthExpenses.toLocaleString('en-IN')} (including ₹${monthRentTotal.toLocaleString('en-IN')} for ${monthRentDays} operating rent days).`);
    insights.push(`Your current net profit is ₹${monthNetProfit.toLocaleString('en-IN')} (Margin: ${monthProfitMargin}%).`);

    // 8. Recent 8 transactions
    const recentTransactions = query(
      `SELECT * FROM transactions ORDER BY date DESC, created_at DESC LIMIT 8`
    );

    res.json({
      success: true,
      today: {
        date: today,
        revenue: todayRevenue,
        expenses: todayExpenses,
        netProfit: todayNetProfit,
        passport: todayPassport,
        photostat: todayPhotostat,
        other: todayOther,
        rentApplicable: todayRentApp,
        dailyRent: todayRent,
      },
      thisMonth: {
        month,
        revenue: monthRevenue,
        expenses: monthExpenses,
        netProfit: monthNetProfit,
        profitMargin: parseFloat(monthProfitMargin),
      },
      revenueBreakdown: {
        passport: monthPassport,
        passportPercentage: pPhotoShare,
        photostat: monthPhotostat,
        photostatPercentage: pPhotoStatShare,
        other: monthOther,
        otherPercentage: pOtherShare,
        total: monthRevenue,
      },
      expenseBreakdown: {
        staffSalary: monthSalaryTotal,
        staffSalaryPercentage: salaryShare,
        rent: monthRentTotal,
        rentPercentage: rentShare,
        rentDays: monthRentDays,
        electricity: monthElectricityTotal,
        electricityPercentage: electricityShare,
        supplies: monthSupplies,
        maintenance: monthMaintenance,
        other: monthOtherExp,
        otherPercentage: otherExpShare,
        total: monthExpenses,
      },
      insights,
      recentTransactions,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// MONTHLY REPORT & CALENDAR BREAKDOWN
// -------------------------------------------------------------
router.get('/reports/monthly', (req, res) => {
  try {
    const month = req.query.month || getMonthString(getTodayDateString());
    const settings = getSafeSettings();

    const [yearStr, monthStr] = month.split('-');
    const year = parseInt(yearStr, 10);
    const m = parseInt(monthStr, 10);
    const numDays = getDaysInMonth(year, m);

    // Get all transactions for this month
    const allTransactions = query(
      `SELECT * FROM transactions WHERE date LIKE ? ORDER BY date ASC, created_at ASC`,
      [`${month}%`]
    );

    // Get all rent records for this month
    const rentRecords = query(
      `SELECT * FROM rent_records WHERE date LIKE ?`,
      [`${month}%`]
    );
    const rentMap = {};
    rentRecords.forEach(r => { rentMap[r.date] = r; });

    // Group transactions by date
    const dailyTxMap = {};
    allTransactions.forEach(t => {
      if (!dailyTxMap[t.date]) dailyTxMap[t.date] = [];
      dailyTxMap[t.date].push(t);
    });

    const dailySummaryList = [];
    let monthPassport = 0;
    let monthPhotostat = 0;
    let monthOtherIncome = 0;
    let monthManualExpenses = 0;
    let totalRentDays = 0;

    for (let day = 1; day <= numDays; day++) {
      const dateStr = `${month}-${String(day).padStart(2, '0')}`;
      const dayTxs = dailyTxMap[dateStr] || [];

      let dPassport = 0;
      let dPhotostat = 0;
      let dOther = 0;
      let dManualExp = 0;

      dayTxs.forEach(t => {
        if (t.type === 'income') {
          if (t.category === 'passport') dPassport += t.amount;
          else if (t.category === 'photostat') dPhotostat += t.amount;
          else dOther += t.amount;
        } else {
          dManualExp += t.amount;
        }
      });

      const rec = rentMap[dateStr];
      const rentApp = rec ? rec.applicable === 1 : settings.rent_default_applicable === 1;
      const dRent = rentApp ? settings.rent_daily_rate : 0;
      if (rentApp) totalRentDays++;

      const dRevenue = dPassport + dPhotostat + dOther;
      const dExpenses = dRent + dManualExp;
      const dProfit = dRevenue - dExpenses;

      monthPassport += dPassport;
      monthPhotostat += dPhotostat;
      monthOtherIncome += dOther;
      monthManualExpenses += dManualExp;

      const dateObj = new Date(year, m - 1, day);
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

      dailySummaryList.push({
        date: dateStr,
        day,
        dayName: dayNames[dateObj.getDay()],
        passport: dPassport,
        photostat: dPhotostat,
        other: dOther,
        revenue: dRevenue,
        rentApplicable: rentApp,
        dailyRent: dRent,
        manualExpenses: dManualExp,
        expenses: dExpenses,
        profit: dProfit,
        transactionsCount: dayTxs.length,
      });
    }

    const totalIncome = monthPassport + monthPhotostat + monthOtherIncome;
    const monthRentTotal = totalRentDays * settings.rent_daily_rate;
    const monthSalaryTotal = settings.staff_salary_monthly;
    const monthElectricityTotal = settings.electricity_monthly;

    const totalExpenses =
      monthSalaryTotal +
      monthRentTotal +
      monthElectricityTotal +
      monthManualExpenses;

    const netProfit = totalIncome - totalExpenses;
    const profitMargin = totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(1) : '0.0';

    res.json({
      success: true,
      month,
      settings: {
        businessName: settings.business_name,
        currencySymbol: settings.currency_symbol,
      },
      income: {
        passport: monthPassport,
        photostat: monthPhotostat,
        other: monthOtherIncome,
        total: totalIncome,
      },
      expenses: {
        staffSalary: monthSalaryTotal,
        rent: monthRentTotal,
        rentDays: totalRentDays,
        dailyRentRate: settings.rent_daily_rate,
        electricity: monthElectricityTotal,
        otherExpenses: monthManualExpenses,
        total: totalExpenses,
      },
      result: {
        grossRevenue: totalIncome,
        totalExpenses,
        netProfit,
        profitMargin: parseFloat(profitMargin),
      },
      dailyHistory: dailySummaryList,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// EXPORT ENDPOINT (CSV / Excel Compatible)
// -------------------------------------------------------------
router.get('/export', (req, res) => {
  try {
    const {
      startDate,
      endDate,
      type = 'all',
      format = 'csv',
    } = req.query;

    let sql = 'SELECT * FROM transactions WHERE 1=1';
    const params = [];

    if (startDate) {
      sql += ' AND date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND date <= ?';
      params.push(endDate);
    }
    if (type && type !== 'all') {
      sql += ' AND type = ?';
      params.push(type);
    }

    sql += ' ORDER BY date DESC, created_at DESC';
    const rows = query(sql, params);

    if (format === 'json') {
      return res.json({ success: true, count: rows.length, data: rows });
    }

    // Generate CSV
    const headers = ['Date', 'Type', 'Category', 'Description', 'Quantity', 'Rate (INR)', 'Amount (INR)'];
    const csvLines = [headers.join(',')];

    rows.forEach(r => {
      const escape = text => `"${String(text || '').replace(/"/g, '""')}"`;
      csvLines.push([
        escape(r.date),
        escape(r.type.toUpperCase()),
        escape(r.category),
        escape(r.description),
        r.quantity || 1,
        r.rate || 0,
        r.amount || 0,
      ].join(','));
    });

    const csvContent = '\uFEFF' + csvLines.join('\r\n'); // UTF-8 BOM for Excel rupee symbol support

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="studio_finance_${startDate || 'start'}_to_${endDate || 'end'}.csv"`);
    res.send(csvContent);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// SAMPLE DATA SEEDING (Optional feature for immediate testing)
// -------------------------------------------------------------
router.post('/seed-sample-data', (req, res) => {
  try {
    const today = getTodayDateString();
    const currentMonth = getMonthString(today);
    const settings = queryOne('SELECT * FROM settings WHERE id = 1');
    const now = new Date().toISOString();

    const sampleEntries = [
      // Today entries
      { date: today, type: 'income', category: 'passport', desc: 'Passport photos (new) - 8 photos', qty: 8, rate: 50, amount: 400 },
      { date: today, type: 'income', category: 'photostat', desc: 'Photostat copies - 50 copies', qty: 50, rate: 4, amount: 200 },
      { date: today, type: 'income', category: 'other_income', desc: 'A4 Document Lamination (2 sheets)', qty: 2, rate: 50, amount: 100 },
      // Previous days
      { date: `${currentMonth}-01`, type: 'income', category: 'passport', desc: 'Passport photos (new) - 12 photos', qty: 12, rate: 50, amount: 600 },
      { date: `${currentMonth}-01`, type: 'income', category: 'photostat', desc: 'Photostat copies - 120 copies', qty: 120, rate: 4, amount: 480 },
      { date: `${currentMonth}-02`, type: 'income', category: 'passport', desc: 'Passport photos (new) - 16 photos', qty: 16, rate: 50, amount: 800 },
      { date: `${currentMonth}-02`, type: 'income', category: 'photostat', desc: 'Photostat copies - 85 copies', qty: 85, rate: 4, amount: 340 },
      { date: `${currentMonth}-02`, type: 'income', category: 'other_income', desc: 'Custom Photo Frame (6x8)', qty: 1, rate: 250, amount: 250 },
      { date: `${currentMonth}-03`, type: 'income', category: 'passport', desc: 'Passport photos (reprint) - 4 photos', qty: 4, rate: 100, amount: 400 },
      { date: `${currentMonth}-03`, type: 'income', category: 'photostat', desc: 'Photostat copies - 60 copies', qty: 60, rate: 4, amount: 240 },
      { date: `${currentMonth}-03`, type: 'expense', category: 'supplies', desc: 'Glossy 4x6 Photo Paper Pack & Toner cartridge', qty: 1, rate: 1450, amount: 1450 },
      { date: `${currentMonth}-04`, type: 'income', category: 'passport', desc: 'Passport photos (new) - 8 photos', qty: 8, rate: 50, amount: 400 },
      { date: `${currentMonth}-04`, type: 'income', category: 'photostat', desc: 'Photostat copies - 200 copies', qty: 200, rate: 4, amount: 800 },
      { date: `${currentMonth}-05`, type: 'income', category: 'passport', desc: 'Passport photos (new) - 20 photos', qty: 20, rate: 50, amount: 1000 },
      { date: `${currentMonth}-05`, type: 'income', category: 'photostat', desc: 'Photostat copies - 90 copies', qty: 90, rate: 4, amount: 360 },
      { date: `${currentMonth}-05`, type: 'expense', category: 'maintenance', desc: 'Photostat printer roller cleaning & servicing', qty: 1, rate: 450, amount: 450 },
    ];

    runInTransaction(() => {
      sampleEntries.forEach(item => {
        const id = uuidv4();
        run(
          `INSERT INTO transactions (id, date, type, category, description, quantity, rate, amount, is_recurring, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
          [id, item.date, item.type, item.category, item.desc, item.qty, item.rate, item.amount, now, now]
        );
      });
    });

    res.json({ success: true, message: `Added ${sampleEntries.length} sample transactions for testing.` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
