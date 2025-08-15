const express = require('express');
const cors = require('cors');

// Import routes
const authRoutes = require('./backend/routes/api/v1/auth');
const userRoutes = require('./backend/routes/api/v1/users');
const tournamentRoutes = require('./backend/routes/api/v1/tournaments');
const matchRoutes = require('./backend/routes/api/v1/matches');
const teamRoutes = require('./backend/routes/api/v1/teams');
const paymentRoutes = require('./backend/routes/api/v1/payments');
const notificationRoutes = require('./backend/routes/api/v1/notifications');
const statsRoutes = require('./backend/routes/api/v1/stats');
const adminRoutes = require('./backend/routes/api/v1/admin');
const webhooksRoutes = require('./backend/routes/webhooks');
const systemRoutes = require('./backend/routes/system');

class App {
  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    // Basic middleware
    this.app.use(cors());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // Static files
    this.app.use('/uploads', express.static('uploads'));
  }

  setupRoutes() {
    // API routes
    this.app.use('/api/v1/auth', authRoutes);
    this.app.use('/api/v1/users', userRoutes);
    this.app.use('/api/v1/tournaments', tournamentRoutes);
    this.app.use('/api/v1/matches', matchRoutes);
    this.app.use('/api/v1/teams', teamRoutes);
    this.app.use('/api/v1/payments', paymentRoutes);
    this.app.use('/api/v1/notifications', notificationRoutes);
    this.app.use('/api/v1/stats', statsRoutes);
    this.app.use('/api/v1/admin', adminRoutes);
    this.app.use('/webhooks', webhooksRoutes);
    this.app.use('/system', systemRoutes);

    // Health check
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString()
      });
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        message: 'Route not found'
      });
    });

    // Simple error handler
    this.app.use((err, req, res, next) => {
      console.error('Error:', err);
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Server Error'
      });
    });
  }
}

module.exports = App;
