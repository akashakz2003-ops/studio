const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDb } = require('./db');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

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
    console.error('Failed to initialize database:', err);
    res.status(500).json({ success: false, error: 'Database initialization failed: ' + err.message });
  }
});

// API endpoints (mounted on both /api and root / for Vercel serverless compatibility)
app.use('/api', apiRoutes);
app.use(apiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend build if exists
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDistPath));

// Fallback for SPA routing (Express 5 compatible)
app.use((req, res, next) => {
  if (req.method !== 'GET') return next();
  if (req.path.startsWith('/api') || req.path.startsWith('/auth') || req.path.startsWith('/settings') || req.path.startsWith('/daily-sales') || req.path.startsWith('/transactions') || req.path.startsWith('/expenses') || req.path.startsWith('/rent-days') || req.path.startsWith('/reports') || req.path.startsWith('/export') || req.path.startsWith('/dashboard')) return next();
  const indexHtml = path.join(clientDistPath, 'index.html');
  res.sendFile(indexHtml, err => {
    if (err) {
      res.status(200).send('Studio Financial Management API server is running on port ' + PORT);
    }
  });
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
