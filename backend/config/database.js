// backend/config/database.js
const mongoose = require('mongoose');
const { logger } = require('./logger');

const connectDatabase = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/esports-platform';
    
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4 // Use IPv4, skip trying IPv6
    };

    // Connect to MongoDB
    const conn = await mongoose.connect(mongoURI, options);
    
    logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Connection event listeners
    mongoose.connection.on('connected', () => {
      logger.info('Mongoose connected to MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      logger.error('Mongoose connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('Mongoose disconnected from MongoDB');
    });

    // Handle application termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('Mongoose connection closed through app termination');
      process.exit(0);
    });

    return conn;
    
  } catch (error) {
    logger.error('Database connection failed:', error);
    
    // If in production, exit the process
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
    
    // In development, log warning and continue (for testing without DB)
    logger.warn('⚠️ Running without database connection in development mode');
    return null;
  }
};

module.exports = connectDatabase;
