require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 1000, standardHeaders: true });
app.use('/api', limiter);

// Health check (no DB needed)
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Init DB then mount routes
const { initSchema } = require('./db/schema');

initSchema().then(() => {
  // Require routes AFTER dotenv + DB are ready
  const authRouter       = require('./routes/auth');
  const dsaRouter        = require('./routes/dsa');
  const applicationsRouter = require('./routes/applications');
  const logsRouter       = require('./routes/logs');
  const { projectsRouter, networkRouter, goalsRouter, timersRouter, auditRouter } = require('./routes/misc');

  app.use('/api/auth',         authRouter);
  app.use('/api/dsa',          dsaRouter);
  app.use('/api/applications', applicationsRouter);
  app.use('/api/logs',         logsRouter);
  app.use('/api/projects',     projectsRouter);
  app.use('/api/network',      networkRouter);
  app.use('/api/goals',        goalsRouter);
  app.use('/api/timers',       timersRouter);
  app.use('/api/audit',        auditRouter);

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../client/dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '../client/dist/index.html'));
    });
  }

  // Global JSON error handler
  app.use((err, req, res, next) => {
    console.error('Server error:', err.message);
    res.status(500).json({ error: err.message || 'Internal server error' });
  });

  app.listen(PORT, () => {
    console.log(`\n🚀 ExecOS running on http://localhost:${PORT}`);
    console.log(`   JWT_SECRET loaded: ${process.env.JWT_SECRET ? 'YES ✓' : 'NO ✗ (using fallback)'}`);
    console.log(`   Mode: ${process.env.NODE_ENV || 'development'}`);
  });

}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
