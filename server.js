const App = require('./app');

// Load environment variables first
require('dotenv').config();

// Import logger (fix the path)
const { logger } = require('./backend/config/logger');

// Validate required environment variables
const requiredEnvVars = [
  'MONGODB_URI',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingEnvVars.length > 0) {
  logger.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

// Set NODE_ENV if not specified
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
}

// Get port from environment
const PORT = process.env.PORT || 5000;

// Initialize and start the application
async function startServer() {
  try {
    // Connect to database first
    const connectDatabase = require('./backend/config/database');
    await connectDatabase();
    logger.info('Database connected successfully');

    // Create App instance and get Express app
    const appInstance = new App();
    const expressApp = appInstance.app; // Fix: Access the .app property

    // Create HTTP server
    const http = require('http');
    const server = http.createServer(expressApp);

    // Setup WebSocket if enabled
    if (process.env.ENABLE_WEBSOCKETS === 'true') {
      try {
        const setupWebSocket = require('./backend/config/websocket');
        setupWebSocket(server);
        logger.info('WebSocket server initialized');
      } catch (error) {
        logger.warn('WebSocket setup failed:', error.message);
      }
    }

    // Setup scheduled jobs if enabled
    if (process.env.ENABLE_CRON_JOBS === 'true') {
      try {
        const { startCronJobs } = require('./backend/jobs');
        startCronJobs();
        logger.info('Cron jobs started');
      } catch (error) {
        logger.warn('Cron jobs setup failed:', error.message);
      }
    }

    // Start the server
    server.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📝 Environment: ${process.env.NODE_ENV}`);
      logger.info(`🌐 API Base URL: http://localhost:${PORT}/api/v1`);
    });

    // Log memory usage in development
    if (process.env.NODE_ENV === 'development') {
      setInterval(() => {
        const memUsage = process.memoryUsage();
        logger.debug('Memory Usage:', {
          rss: `${Math.round(memUsage.rss / 1024 / 1024)} MB`,
          heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)} MB`,
          heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)} MB`,
          external: `${Math.round(memUsage.external / 1024 / 1024)} MB`
        });
      }, 60000); // Every minute
    }

    return server;

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  logger.error('Unhandled Rejection:', error);
  process.exit(1);
});

// Start the server
startServer();
