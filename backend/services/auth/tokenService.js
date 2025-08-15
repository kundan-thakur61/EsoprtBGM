const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const redisClient = require('../../config/redis');
const logger = require('../../utils/logger/logger');

class TokenService {
  constructor() {
    this.accessTokenSecret = process.env.JWT_ACCESS_SECRET;
    this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET;
    this.issuer = process.env.JWT_ISSUER || 'esports-platform';
    this.audience = process.env.JWT_AUDIENCE || 'esports-users';
  }

  // Generate access and refresh tokens
  async generateTokens(user, deviceInfo = {}) {
    try {
      const payload = {
        id: user._id,
        role: user.role,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        subscription: user.subscription?.plan || 'free'
      };

      // Generate access token (short-lived)
      const accessToken = jwt.sign(payload, this.accessTokenSecret, {
        expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
        issuer: this.issuer,
        audience: this.audience,
        subject: user._id.toString()
      });

      // Generate refresh token (long-lived)
      const refreshTokenPayload = {
        userId: user._id,
        tokenFamily: crypto.randomBytes(16).toString('hex'), // For rotation detection
        deviceInfo
      };

      const refreshToken = jwt.sign(refreshTokenPayload, this.refreshTokenSecret, {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
        issuer: this.issuer,
        audience: this.audience,
        subject: user._id.toString()
      });

      // Store refresh token metadata in Redis
      const refreshTokenHash = this.hashToken(refreshToken);
      await redisClient.set(
        `refresh:${refreshTokenHash}`,
        {
          userId: user._id,
          tokenFamily: refreshTokenPayload.tokenFamily,
          deviceInfo,
          createdAt: Date.now(),
          lastUsed: Date.now()
        },
        7 * 24 * 60 * 60 // 7 days in seconds
      );

      return { accessToken, refreshToken };
    } catch (error) {
      logger.error('Token generation error:', error);
      throw new Error('Failed to generate tokens');
    }
  }

  // Verify access token
  async verifyAccessToken(token) {
    try {
      const decoded = jwt.verify(token, this.accessTokenSecret, {
        issuer: this.issuer,
        audience: this.audience
      });

      // Check if token is blacklisted
      const isBlacklisted = await redisClient.get(`blacklist:${this.hashToken(token)}`);
      if (isBlacklisted) {
        throw new Error('Token has been revoked');
      }

      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Access token expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid access token');
      }
      throw error;
    }
  }

  // Verify refresh token
  async verifyRefreshToken(token) {
    try {
      const decoded = jwt.verify(token, this.refreshTokenSecret, {
        issuer: this.issuer,
        audience: this.audience
      });

      const tokenHash = this.hashToken(token);
      const storedData = await redisClient.get(`refresh:${tokenHash}`);
      
      if (!storedData) {
        throw new Error('Refresh token not found or expired');
      }

      // Update last used timestamp
      storedData.lastUsed = Date.now();
      await redisClient.set(`refresh:${tokenHash}`, storedData, 7 * 24 * 60 * 60);

      return { ...decoded, ...storedData };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Refresh token expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid refresh token');
      }
      throw error;
    }
  }

  // Refresh access token using refresh token
  async refreshAccessToken(refreshToken, user) {
    try {
      const refreshData = await this.verifyRefreshToken(refreshToken);
      
      // Generate new access token
      const { accessToken } = await this.generateTokens(user, refreshData.deviceInfo);
      
      return { accessToken };
    } catch (error) {
      logger.error('Token refresh error:', error);
      throw error;
    }
  }

  // Rotate refresh token (for enhanced security)
  async rotateRefreshToken(oldRefreshToken, user) {
    try {
      const refreshData = await this.verifyRefreshToken(oldRefreshToken);
      
      // Invalidate old refresh token
      await this.revokeRefreshToken(oldRefreshToken);
      
      // Generate new token pair
      const tokens = await this.generateTokens(user, refreshData.deviceInfo);
      
      return tokens;
    } catch (error) {
      logger.error('Token rotation error:', error);
      throw error;
    }
  }

  // Revoke access token
  async revokeAccessToken(token) {
    try {
      const decoded = jwt.decode(token);
      if (!decoded) {
        throw new Error('Invalid token format');
      }

      const tokenHash = this.hashToken(token);
      const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
      
      if (expiresIn > 0) {
        await redisClient.set(`blacklist:${tokenHash}`, true, expiresIn);
      }

      logger.info('Access token revoked', {
        userId: decoded.id,
        tokenHash: tokenHash.substring(0, 10)
      });
    } catch (error) {
      logger.error('Access token revocation error:', error);
      throw error;
    }
  }

  // Revoke refresh token
  async revokeRefreshToken(token) {
    try {
      const tokenHash = this.hashToken(token);
      await redisClient.del(`refresh:${tokenHash}`);

      logger.info('Refresh token revoked', {
        tokenHash: tokenHash.substring(0, 10)
      });
    } catch (error) {
      logger.error('Refresh token revocation error:', error);
      throw error;
    }
  }

  // Revoke all tokens for a user
  async revokeAllTokens(userId) {
    try {
      const User = require('../../models/User');
      const user = await User.findById(userId);
      
      if (user) {
        // Clear refresh tokens from user document
        user.refreshTokens = [];
        await user.save();
      }

      // Remove all refresh tokens from Redis
      const pattern = `refresh:*`;
      const keys = await redisClient.client.keys(pattern);
      
      for (const key of keys) {
        const data = await redisClient.get(key);
        if (data && data.userId === userId.toString()) {
          await redisClient.del(key);
        }
      }

      logger.info('All tokens revoked for user', { userId });
    } catch (error) {
      logger.error('Revoke all tokens error:', error);
      throw error;
    }
  }

  // Generate temporary token (for email verification, password reset, etc.)
  generateTempToken(payload, expiresIn = '1h') {
    return jwt.sign(payload, process.env.JWT_TEMP_SECRET, {
      expiresIn,
      issuer: this.issuer,
      audience: this.audience
    });
  }

  // Verify temporary token
  verifyTempToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_TEMP_SECRET, {
        issuer: this.issuer,
        audience: this.audience
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Temporary token expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid temporary token');
      }
      throw error;
    }
  }

  // Get token information
  async getTokenInfo(token, type = 'access') {
    try {
      const secret = type === 'access' ? this.accessTokenSecret : this.refreshTokenSecret;
      const decoded = jwt.verify(token, secret);
      
      const info = {
        userId: decoded.id || decoded.userId,
        role: decoded.role,
        issuedAt: new Date(decoded.iat * 1000),
        expiresAt: new Date(decoded.exp * 1000),
        issuer: decoded.iss,
        audience: decoded.aud
      };

      if (type === 'refresh') {
        const tokenHash = this.hashToken(token);
        const storedData = await redisClient.get(`refresh:${tokenHash}`);
        if (storedData) {
          info.deviceInfo = storedData.deviceInfo;
          info.lastUsed = new Date(storedData.lastUsed);
        }
      }

      return info;
    } catch (error) {
      throw new Error('Failed to get token information');
    }
  }

  // Clean expired tokens
  async cleanExpiredTokens() {
    try {
      const pattern = `refresh:*`;
      const keys = await redisClient.client.keys(pattern);
      let cleanedCount = 0;

      for (const key of keys) {
        const data = await redisClient.get(key);
        if (!data) {
          cleanedCount++;
          continue;
        }

        // Check if token is expired (7 days old)
        const age = Date.now() - data.createdAt;
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
        
        if (age > maxAge) {
          await redisClient.del(key);
          cleanedCount++;
        }
      }

      logger.info('Token cleanup completed', { cleanedCount });
      return cleanedCount;
    } catch (error) {
      logger.error('Token cleanup error:', error);
      throw error;
    }
  }

  // Hash token for storage
  hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  // Validate token format
  isValidTokenFormat(token) {
    return typeof token === 'string' && token.split('.').length === 3;
  }

  // Get remaining token time
  getTokenRemainingTime(token) {
    try {
      const decoded = jwt.decode(token);
      if (!decoded || !decoded.exp) {
        return 0;
      }
      
      const remainingTime = decoded.exp - Math.floor(Date.now() / 1000);
      return Math.max(0, remainingTime);
    } catch (error) {
      return 0;
    }
  }
}

module.exports = new TokenService();