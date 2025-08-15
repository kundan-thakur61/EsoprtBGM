const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redisClient = require('../../config/redis');
const logger = require('../../utils/logger/logger');

class RateLimiterMiddleware {
  // Create a flexible rate limiter
  createLimiter = (options = {}) => {
    const {
      windowMs = 15 * 60 * 1000, // 15 minutes
      max = 100, // requests per windowMs
      message = 'Too many requests from this IP, please try again later',
      keyGenerator = (req) => req.ip,
      skipSuccessfulRequests = false,
      skipFailedRequests = false,
      store = null,
      onLimitReached = null
    } = options;

    const limiterOptions = {
      windowMs,
      max,
      message: {
        success: false,
        message,
        retryAfter: Math.ceil(windowMs / 1000)
      },
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator,
      skipSuccessfulRequests,
      skipFailedRequests,
      handler: (req, res, next, options) => {
        logger.warn('Rate limit reached', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          endpoint: req.originalUrl,
          limit: options.max,
          windowMs: options.windowMs
        });
        
        // Call the custom onLimitReached handler if provided
        if (onLimitReached) {
          onLimitReached(req, res, options);
        }
        
        res.status(options.statusCode).json(options.message);
      }
    };

    if (store || redisClient.client) {
      limiterOptions.store = store || new RedisStore({
        sendCommand: (...args) => redisClient.client.call(...args),
      });
    }

    return rateLimit(limiterOptions);
  };

  // Authentication endpoints limiter
  authLimiter = this.createLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per 15 minutes
    message: 'Too many authentication attempts, please try again later',
    keyGenerator: (req) => `auth:${req.ip}`,
    skipSuccessfulRequests: true
  });

  // Registration limiter
  registerLimiter = this.createLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 registrations per hour per IP
    message: 'Too many accounts created from this IP, please try again after an hour',
    keyGenerator: (req) => `register:${req.ip}`
  });

  // Password reset limiter
  passwordResetLimiter = this.createLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // 5 password reset attempts per hour
    message: 'Too many password reset attempts, please try again after an hour',
    keyGenerator: (req) => `reset:${req.ip}`
  });

  // API general limiter
  apiLimiter = this.createLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // 1000 requests per 15 minutes
    message: 'API rate limit exceeded, please try again later'
  });

  // Upload limiter
  uploadLimiter = this.createLimiter({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 10, // 10 uploads per 10 minutes
    message: 'Too many file uploads, please try again later'
  });

  // Search limiter
  searchLimiter = this.createLimiter({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30, // 30 searches per minute
    message: 'Too many search requests, please slow down'
  });

  // Admin action limiter
  adminLimiter = this.createLimiter({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 100, // 100 admin actions per 5 minutes
    message: 'Admin action rate limit exceeded',
    keyGenerator: (req) => `admin:${req.user?._id || req.ip}`
  });

  // Dynamic limiter based on user role
  dynamicLimiter = (req, res, next) => {
    const user = req.user;
    let max = 100; // Default for unauthenticated users
    
    if (user) {
      switch (user.role) {
        case 'admin':
        case 'super_admin':
          max = 1000;
          break;
        case 'moderator':
          max = 500;
          break;
        case 'captain':
          max = 300;
          break;
        case 'premium':
        case 'pro':
          max = 200;
          break;
        default:
          max = 100;
      }
    }

    const limiter = this.createLimiter({
      windowMs: 15 * 60 * 1000,
      max,
      keyGenerator: (req) => user ? `user:${user._id}` : `ip:${req.ip}`,
      message: `Rate limit exceeded for your user level (${max} requests per 15 minutes)`
    });

    return limiter(req, res, next);
  };

  // Sliding window limiter for more precise control
  slidingWindowLimiter = (options = {}) => {
    const {
      windowMs = 15 * 60 * 1000,
      max = 100,
      keyGenerator = (req) => req.ip
    } = options;

    return async (req, res, next) => {
      if (!redisClient.client) {
        return next(); // Skip if Redis is not available
      }

      try {
        const key = `sliding:${keyGenerator(req)}`;
        const now = Date.now();
        const window = now - windowMs;

        // Remove expired entries and count current requests
        await redisClient.client.zremrangebyscore(key, 0, window);
        const current = await redisClient.client.zcard(key);

        if (current >= max) {
          return res.status(429).json({
            success: false,
            message: 'Rate limit exceeded',
            retryAfter: Math.ceil(windowMs / 1000)
          });
        }

        // Add current request
        await redisClient.client.zadd(key, now, `${now}-${Math.random()}`);
        await redisClient.client.expire(key, Math.ceil(windowMs / 1000));

        // Add rate limit headers
        res.set({
          'X-RateLimit-Limit': max,
          'X-RateLimit-Remaining': Math.max(0, max - current - 1),
          'X-RateLimit-Reset': new Date(now + windowMs).toISOString()
        });

        next();
      } catch (error) {
        logger.error('Sliding window rate limiter error:', error);
        next(); // Allow request to proceed on error
      }
    };
  };

  // Distributed rate limiter for microservices
  distributedLimiter = (options = {}) => {
    const {
      windowMs = 15 * 60 * 1000,
      max = 100,
      keyGenerator = (req) => req.ip,
      identifier = 'service'
    } = options;

    return async (req, res, next) => {
      if (!redisClient.client) {
        return next();
      }

      try {
        const key = `distributed:${identifier}:${keyGenerator(req)}`;
        const current = await redisClient.client.incr(key);
        
        if (current === 1) {
          await redisClient.client.expire(key, Math.ceil(windowMs / 1000));
        }

        if (current > max) {
          const ttl = await redisClient.client.ttl(key);
          return res.status(429).json({
            success: false,
            message: 'Distributed rate limit exceeded',
            retryAfter: ttl
          });
        }

        res.set({
          'X-RateLimit-Limit': max,
          'X-RateLimit-Remaining': Math.max(0, max - current),
          'X-RateLimit-Reset': new Date(Date.now() + (windowMs)).toISOString()
        });

        next();
      } catch (error) {
        logger.error('Distributed rate limiter error:', error);
        next();
      }
    };
  };
}

module.exports = new RateLimiterMiddleware();