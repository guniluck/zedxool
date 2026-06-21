const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const db = require('./config/database');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// ===== SECURITY MIDDLEWARE =====
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// ===== BODY PARSER & LOGGING =====
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(morgan('combined'));

// ===== HEALTH CHECK =====
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ===== API ROUTES =====
app.use('/api/v1', routes);

// ===== 404 HANDLER =====
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ===== ERROR HANDLER =====
app.use(errorHandler);

// ===== DATABASE & SERVER START =====
const PORT = process.env.PORT || 5000;

db.sync({ alter: false }).then(() => {
  app.listen(PORT, () => {
    console.log(`\n🚀 Server running on port ${PORT}`);
    console.log(`📚 Margaret Mwachiyeya Secondary School Management System`);
    console.log(`🌍 API: http://localhost:${PORT}/api/v1`);
  });
}).catch(err => {
  console.error('❌ Database connection failed:', err);
  process.exit(1);
});

module.exports = app;
