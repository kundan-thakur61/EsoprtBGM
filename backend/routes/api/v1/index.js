const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');

// Import route modules
const authRoutes = require('./auth');
const userRoutes = require('./users');
const teamRoutes = require('./teams');
const tournamentRoutes = require('./tournaments');
const matchRoutes = require('./matches');
const paymentRoutes = require('./payments');
const notificationRoutes = require('./notifications');
const statsRoutes = require('./stats');
const adminRoutes = require('./admin');

// Import middleware
const { apiLimiter } = require('../../../middleware/security/rateLimiter');
const { authenticate, optionalAuth } = require('../../../middleware/auth/authMiddleware');
const logger = require('../../../utils/logger/logger');

const router = express.Router();

// API-wide middleware
router.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "ws:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

router.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
    
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'Cache-Control'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
}));

// Request logging middleware
router.use((req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info('API Request', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id
    });
  });
  
  next();
});

// Apply rate limiting
router.use(apiLimiter);

// Health check endpoint (no auth required)
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
    version: process.env.API_VERSION || '1.0.0'
  });
});

// API Documentation
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Esports Platform API v1',
    version: '1.0.0',
    documentation: '/api/v1/docs',
    endpoints: {
      auth: '/api/v1/auth',
      users: '/api/v1/users',
      teams: '/api/v1/teams',
      tournaments: '/api/v1/tournaments',
      matches: '/api/v1/matches',
      payments: '/api/v1/payments',
      notifications: '/api/v1/notifications',
      stats: '/api/v1/stats',
      admin: '/api/v1/admin'
    }
  });
});

// Mount route modules
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/teams', teamRoutes);
router.use('/tournaments', tournamentRoutes);
router.use('/matches', matchRoutes);
router.use('/payments', paymentRoutes);
router.use('/notifications', notificationRoutes);
router.use('/stats', statsRoutes);
router.use('/admin', adminRoutes);

// 404 handler for API routes
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    availableEndpoints: [
      '/api/v1/auth',
      '/api/v1/users',
      '/api/v1/teams',
      '/api/v1/tournaments',
      '/api/v1/matches',
      '/api/v1/payments',
      '/api/v1/notifications',
      '/api/v1/stats',
      '/api/v1/admin'
    ]
  });
});

module.exports = router;