// backend/routes/system.js
const express = require('express');
const router = express.Router();

// System health check
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.version
  });
});

// System status endpoint
router.get('/status', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'operational',
    services: {
      database: 'connected',
      cache: 'active',
      storage: 'available'
    },
    timestamp: new Date().toISOString()
  });
});

// System info (basic)
router.get('/info', (req, res) => {
  res.json({
    success: true,
    data: {
      name: 'Esports Platform',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      node_version: process.version,
      platform: process.platform,
      arch: process.arch
    }
  });
});

// Ping endpoint
router.get('/ping', (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'pong',
    timestamp: Date.now()
  });
});

// System metrics (basic)
router.get('/metrics', (req, res) => {
  const used = process.memoryUsage();
  const metrics = {
    memory: {
      rss: Math.round(used.rss / 1024 / 1024 * 100) / 100,
      heapTotal: Math.round(used.heapTotal / 1024 / 1024 * 100) / 100,
      heapUsed: Math.round(used.heapUsed / 1024 / 1024 * 100) / 100,
      external: Math.round(used.external / 1024 / 1024 * 100) / 100
    },
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  };

  res.json({
    success: true,
    data: { metrics }
  });
});

// System configuration (public info only)
router.get('/config', (req, res) => {
  res.json({
    success: true,
    data: {
      supportedGames: ['valorant', 'csgo', 'lol', 'dota2', 'pubg', 'fortnite', 'apex'],
      maxTournamentSize: 1024,
      allowRegistration: true,
      maintenanceMode: false,
      features: {
        tournaments: true,
        payments: true,
        teams: true,
        chat: true
      }
    }
  });
});

module.exports = router;
