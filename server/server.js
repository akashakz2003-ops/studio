const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { initDb } = require('./db');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Safe req.body guard
app.use((req, res, next) => {
  if (!req.body) req.body = {};
  next();
});

// Ensure database is initialized before handling any requests (crucial for Vercel serverless)
let dbInitPromise = null;
app.use(async (req, res, next) => {
  try {
    if (!dbInitPromise) {
      dbInitPromise = initDb();
    }
    await dbInitPromise;
    next();
  } catch (err) {
    dbInitPromise = null; // allow retry on next request
    console.error('Failed to initialize database:', err);
    res.status(500).json({ success: false, error: 'Database initialization failed: ' + err.message });
  }
});

// Health check endpoints
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API endpoints (mounted on both /api and root / for Vercel serverless compatibility)
app.use('/api', apiRoutes);
app.use(apiRoutes);

// Serve frontend build from public or client/dist
const publicPath = path.join(__dirname, '..', 'public');
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');

if (fs.existsSync(publicPath)) {
  app.use(express.static(publicPath));
} else if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
}

// Fallback for SPA routing (Express 5 compatible)
app.use((req, res, next) => {
  if (req.method !== 'GET') return next();
  if (req.path.startsWith('/api') || req.path.startsWith('/auth') || req.path.startsWith('/settings') || req.path.startsWith('/daily-sales') || req.path.startsWith('/transactions') || req.path.startsWith('/expenses') || req.path.startsWith('/rent-days') || req.path.startsWith('/reports') || req.path.startsWith('/export') || req.path.startsWith('/dashboard')) return next();
  
  const indexHtml = fs.existsSync(path.join(publicPath, 'index.html'))
    ? path.join(publicPath, 'index.html')
    : path.join(clientDistPath, 'index.html');

  if (fs.existsSync(indexHtml)) {
    return res.sendFile(indexHtml);
  }
  res.status(200).send('Studio Financial Management API server is running on port ' + PORT);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled API error:', err);
  res.status(500).json({ success: false, error: err.message || 'Internal server error' });
});

async function startServer() {
  try {
    await initDb();
    app.listen(PORT, () => {
      console.log(`===================================================`);
      console.log(`Studio Finance Server listening on http://localhost:${PORT}`);
      console.log(`API available at http://localhost:${PORT}/api`);
      console.log(`===================================================`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

// Only listen when executed directly via Node CLI
if (require.main === module) {
  startServer();
}

module.exports = app;
