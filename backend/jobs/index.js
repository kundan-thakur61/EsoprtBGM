// backend/jobs/index.js
const cron = require('node-cron');
const { logger } = require('../config/logger');

function startCronJobs() {
  // Example: Clean up expired sessions every hour
  cron.schedule('0 * * * *', () => {
    logger.info('Running hourly cleanup job');
    // Add your cleanup logic here
  });

  // Example: Generate daily reports at midnight
  cron.schedule('0 0 * * *', () => {
    logger.info('Running daily report generation');
    // Add your report generation logic here
  });

  logger.info('Cron jobs scheduled');
}

module.exports = { startCronJobs };
