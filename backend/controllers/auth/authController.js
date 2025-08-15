const User = require('../../models/User');
const Profile = require('../../models/Profile');
const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { validationResult } = require('express-validator');
const redisClient = require('../../config/redis');
const logger = require('../../utils/logger');
const { sendEmail } = require('../../services/notification/emailService');
const { generateTokens, verifyRefreshToken } = require('../../services/auth/tokenService');
const { rateLimiter } = require('../../middleware/security/rateLimiter');
const passport = require('passport');

class AuthController {
  // Register new user
  register = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { username, email, password, referralCode } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    try {
      // Check if user already exists
      const existingUser = await User.findByEmailOrUsername(email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'User with this email or username already exists'
        });
      }

      // Rate limiting for registration
      const rateLimitKey = `register:${clientIP}`;
      const rateLimitResult = await redisClient.incrementRateLimit(rateLimitKey, 3600, 5);
      if (rateLimitResult.current > 5) {
        return res.status(429).json({
          success: false,
          message: 'Too many registration attempts. Please try again later.',
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
        });
      }

      // Create user
      const user = new User({
        username,
        email,
        password
      });

      // Generate email verification token
      const verificationToken = user.generateEmailVerificationToken();
      await user.save();

      // Create user profile
      await Profile.create({ user: user._id });

      // Handle referral code if provided
      if (referralCode) {
        await this.handleReferral(user._id, referralCode);
      }

      // Generate tokens
      const { accessToken, refreshToken } = await generateTokens(user);
      
      // Store refresh token
      user.addRefreshToken(refreshToken, userAgent, clientIP);
      await user.save();

      // Send verification email
      await this.sendVerificationEmail(user, verificationToken);

      // Log registration
      logger.info('User registered successfully', {
        userId: user._id,
        username: user.username,
        email: user.email,
        ip: clientIP
      });

      res.status(201).json({
        success: true,
        message: 'User registered successfully. Please check your email for verification.',
        data: {
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            isEmailVerified: user.isEmailVerified
          },
          tokens: {
            accessToken,
            refreshToken
          }
        }
      });

    } catch (error) {
      logger.error('Registration error:', {
        error: error.message,
        stack: error.stack,
        email,
        ip: clientIP
      });

      res.status(500).json({
        success: false,
        message: 'Registration failed. Please try again.'
      });
    }
  });

  // Login user
  login = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { identifier, password, twoFactorCode } = req.body; // identifier can be email or username
    const clientIP = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    try {
      // Rate limiting for login attempts
      const rateLimitKey = `login:${clientIP}`;
      const rateLimitResult = await redisClient.incrementRateLimit(rateLimitKey, 900, 10); // 10 attempts per 15 minutes
      if (rateLimitResult.current > 10) {
        return res.status(429).json({
          success: false,
          message: 'Too many login attempts. Please try again later.',
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
        });
      }

      // Find user
      const user = await User.findByEmailOrUsername(identifier).select('+password +twoFactorSecret');
      if (!user) {
        await this.logFailedLogin(null, clientIP, userAgent, 'User not found');
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Check if account is locked
      if (user.isLocked) {
        await this.logFailedLogin(user._id, clientIP, userAgent, 'Account locked');
        return res.status(423).json({
          success: false,
          message: 'Account temporarily locked due to too many failed attempts. Please try again later.',
          lockUntil: user.accountLockedUntil
        });
      }

      // Check if account is active
      if (!user.isActive) {
        await this.logFailedLogin(user._id, clientIP, userAgent, 'Account inactive');
        return res.status(403).json({
          success: false,
          message: 'Account has been deactivated. Please contact support.'
        });
      }

      // Verify password
      const isPasswordValid = await user.matchPassword(password);
      if (!isPasswordValid) {
        user.addLoginHistory(clientIP, userAgent, await this.getLocationFromIP(clientIP), false);
        await user.save();
        
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Check 2FA if enabled
      if (user.twoFactorEnabled) {
        if (!twoFactorCode) {
          return res.status(200).json({
            success: true,
            message: 'Two-factor authentication required',
            requiresTwoFactor: true,
            tempToken: jwt.sign(
              { userId: user._id, step: '2fa' },
              process.env.JWT_TEMP_SECRET,
              { expiresIn: '5m' }
            )
          });
        }

        const isValidToken = speakeasy.totp.verify({
          secret: user.twoFactorSecret,
          encoding: 'base32',
          token: twoFactorCode,
          window: 2
        });

        if (!isValidToken) {
          user.addLoginHistory(clientIP, userAgent, await this.getLocationFromIP(clientIP), false);
          await user.save();
          
          return res.status(401).json({
            success: false,
            message: 'Invalid two-factor authentication code'
          });
        }
      }

      // Successful login
      const { accessToken, refreshToken } = await generateTokens(user);
      
      // Update user login info
      user.addLoginHistory(clientIP, userAgent, await this.getLocationFromIP(clientIP), true);
      user.addRefreshToken(refreshToken, userAgent, clientIP);
      await user.save();

      // Cache user session
      await redisClient.setSession(user._id.toString(), {
        userId: user._id,
        username: user.username,
        role: user.role,
        loginTime: Date.now()
      });

      logger.info('User logged in successfully', {
        userId: user._id,
        username: user.username,
        ip: clientIP
      });

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
            twoFactorEnabled: user.twoFactorEnabled,
            lastLogin: user.lastLogin,
            subscription: user.subscription
          },
          tokens: {
            accessToken,
            refreshToken
          }
        }
      });

    } catch (error) {
      logger.error('Login error:', {
        error: error.message,
        stack: error.stack,
        identifier,
        ip: clientIP
      });

      res.status(500).json({
        success: false,
        message: 'Login failed. Please try again.'
      });
    }
  });

  // Refresh access token
  refreshToken = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress;

    try {
      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          message: 'Refresh token is required'
        });
      }

      // Verify refresh token
      const decoded = await verifyRefreshToken(refreshToken);
      if (!decoded) {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired refresh token'
        });
      }

      // Find user and validate refresh token
      const user = await User.findById(decoded.userId);
      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'User not found or inactive'
        });
      }

      const tokenExists = user.refreshTokens.some(rt => rt.token === refreshToken);
      if (!tokenExists) {
        // Token rotation attack detected
        logger.warn('Refresh token reuse detected', {
          userId: user._id,
          ip: clientIP,
          token: refreshToken.substring(0, 10) + '...'
        });
        
        // Invalidate all refresh tokens
        user.refreshTokens = [];
        await user.save();
        
        return res.status(401).json({
          success: false,
          message: 'Invalid refresh token. Please login again.'
        });
      }

      // Generate new tokens
      const tokens = await generateTokens(user);
      
      // Remove old refresh token and add new one
      user.removeRefreshToken(refreshToken);
      user.addRefreshToken(tokens.refreshToken, req.get('User-Agent'), clientIP);
      await user.save();

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          tokens
        }
      });

    } catch (error) {
      logger.error('Token refresh error:', {
        error: error.message,
        stack: error.stack,
        ip: clientIP
      });

      res.status(401).json({
        success: false,
        message: 'Token refresh failed'
      });
    }
  });

  // Logout user
  logout = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    const user = req.user;

    try {
      // Remove refresh token
      if (refreshToken && user) {
        user.removeRefreshToken(refreshToken);
        await user.save();
      }

      // Remove session cache
      if (user) {
        await redisClient.deleteSession(user._id.toString());
      }

      logger.info('User logged out', {
        userId: user?._id,
        ip: req.ip
      });

      res.json({
        success: true,
        message: 'Logged out successfully'
      });

    } catch (error) {
      logger.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Logout failed'
      });
    }
  });

  // Logout from all devices
  logoutAll = asyncHandler(async (req, res) => {
    const user = req.user;

    try {
      // Clear all refresh tokens
      user.refreshTokens = [];
      await user.save();

      // Remove session cache
      await redisClient.deleteSession(user._id.toString());

      logger.info('User logged out from all devices', {
        userId: user._id,
        ip: req.ip
      });

      res.json({
        success: true,
        message: 'Logged out from all devices successfully'
      });

    } catch (error) {
      logger.error('Logout all error:', error);
      res.status(500).json({
        success: false,
        message: 'Logout failed'
      });
    }
  });

  // Verify email
  verifyEmail = asyncHandler(async (req, res) => {
    const { token } = req.params;

    try {
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
      
      const user = await User.findOne({
        emailVerificationToken: hashedToken,
        emailVerificationExpires: { $gt: Date.now() }
      });

      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired verification token'
        });
      }

      user.isEmailVerified = true;
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;
      await user.save();

      logger.info('Email verified successfully', {
        userId: user._id,
        email: user.email
      });

      res.json({
        success: true,
        message: 'Email verified successfully'
      });

    } catch (error) {
      logger.error('Email verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Email verification failed'
      });
    }
  });

  // Resend verification email
  resendVerificationEmail = asyncHandler(async (req, res) => {
    const user = req.user;

    try {
      if (user.isEmailVerified) {
        return res.status(400).json({
          success: false,
          message: 'Email is already verified'
        });
      }

      // Rate limiting
      const rateLimitKey = `verify-email:${user._id}`;
      const rateLimitResult = await redisClient.incrementRateLimit(rateLimitKey, 3600, 3);
      if (rateLimitResult.current > 3) {
        return res.status(429).json({
          success: false,
          message: 'Too many verification emails sent. Please try again later.'
        });
      }

      const verificationToken = user.generateEmailVerificationToken();
      await user.save();

      await this.sendVerificationEmail(user, verificationToken);

      res.json({
        success: true,
        message: 'Verification email sent successfully'
      });

    } catch (error) {
      logger.error('Resend verification email error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send verification email'
      });
    }
  });

  // Forgot password
  forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress;

    try {
      // Rate limiting
      const rateLimitKey = `forgot-password:${clientIP}`;
      const rateLimitResult = await redisClient.incrementRateLimit(rateLimitKey, 3600, 5);
      if (rateLimitResult.current > 5) {
        return res.status(429).json({
          success: false,
          message: 'Too many password reset attempts. Please try again later.'
        });
      }

      const user = await User.findOne({ email: email.toLowerCase() });
      
      // Always return success to prevent email enumeration
      const successMessage = 'If an account with that email exists, a password reset link has been sent.';
      
      if (!user) {
        return res.json({
          success: true,
          message: successMessage
        });
      }

      const resetToken = user.generatePasswordResetToken();
      await user.save();

      // Send password reset email
      await this.sendPasswordResetEmail(user, resetToken);

      logger.info('Password reset requested', {
        userId: user._id,
        email: user.email,
        ip: clientIP
      });

      res.json({
        success: true,
        message: successMessage
      });

    } catch (error) {
      logger.error('Forgot password error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process password reset request'
      });
    }
  });

  // Reset password
  resetPassword = asyncHandler(async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    try {
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
      
      const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
      }).select('+password');

      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired password reset token'
        });
      }

      user.password = password;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      user.passwordChangedAt = Date.now();
      
      // Invalidate all refresh tokens on password change
      user.refreshTokens = [];
      
      await user.save();

      logger.info('Password reset successfully', {
        userId: user._id,
        email: user.email
      });

      res.json({
        success: true,
        message: 'Password reset successfully'
      });

    } catch (error) {
      logger.error('Password reset error:', error);
      res.status(500).json({
        success: false,
        message: 'Password reset failed'
      });
    }
  });

  // Enable two-factor authentication
  enableTwoFactor = asyncHandler(async (req, res) => {
    const user = req.user;

    try {
      if (user.twoFactorEnabled) {
        return res.status(400).json({
          success: false,
          message: 'Two-factor authentication is already enabled'
        });
      }

      const secret = speakeasy.generateSecret({
        name: `Esports Platform (${user.email})`,
        issuer: 'Esports Platform'
      });

      // Generate QR code
      const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

      // Store secret temporarily (not yet activated)
      await redisClient.set(
        `2fa-setup:${user._id}`,
        { secret: secret.base32 },
        600 // 10 minutes
      );

      res.json({
        success: true,
        message: 'Scan the QR code with your authenticator app',
        data: {
          qrCode: qrCodeUrl,
          manualEntryKey: secret.base32
        }
      });

    } catch (error) {
      logger.error('Enable 2FA error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to enable two-factor authentication'
      });
    }
  });

  // Confirm two-factor authentication setup
  confirmTwoFactor = asyncHandler(async (req, res) => {
    const { token } = req.body;
    const user = req.user;

    try {
      const setupData = await redisClient.get(`2fa-setup:${user._id}`);
      if (!setupData) {
        return res.status(400).json({
          success: false,
          message: 'Two-factor setup session expired. Please start again.'
        });
      }

      const isValidToken = speakeasy.totp.verify({
        secret: setupData.secret,
        encoding: 'base32',
        token,
        window: 2
      });

      if (!isValidToken) {
        return res.status(400).json({
          success: false,
          message: 'Invalid authentication code'
        });
      }

      // Activate 2FA
      user.twoFactorSecret = setupData.secret;
      user.twoFactorEnabled = true;
      await user.save();

      // Clean up setup data
      await redisClient.del(`2fa-setup:${user._id}`);

      logger.info('Two-factor authentication enabled', {
        userId: user._id
      });

      res.json({
        success: true,
        message: 'Two-factor authentication enabled successfully'
      });

    } catch (error) {
      logger.error('Confirm 2FA error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to confirm two-factor authentication'
      });
    }
  });

  // Disable two-factor authentication
  disableTwoFactor = asyncHandler(async (req, res) => {
    const { password, token } = req.body;
    const user = req.user;

    try {
      if (!user.twoFactorEnabled) {
        return res.status(400).json({
          success: false,
          message: 'Two-factor authentication is not enabled'
        });
      }

      // Verify password
      const userWithPassword = await User.findById(user._id).select('+password +twoFactorSecret');
      const isPasswordValid = await userWithPassword.matchPassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid password'
        });
      }

      // Verify 2FA token
      const isValidToken = speakeasy.totp.verify({
        secret: userWithPassword.twoFactorSecret,
        encoding: 'base32',
        token,
        window: 2
      });

      if (!isValidToken) {
        return res.status(400).json({
          success: false,
          message: 'Invalid authentication code'
        });
      }

      // Disable 2FA
      userWithPassword.twoFactorEnabled = false;
      userWithPassword.twoFactorSecret = undefined;
      await userWithPassword.save();

      logger.info('Two-factor authentication disabled', {
        userId: user._id
      });

      res.json({
        success: true,
        message: 'Two-factor authentication disabled successfully'
      });

    } catch (error) {
      logger.error('Disable 2FA error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to disable two-factor authentication'
      });
    }
  });

  // Get current user profile
  getMe = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id)
      .populate('profile', 'avatarUrl bio stats')
      .select('-refreshTokens');

    res.json({
      success: true,
      data: { user }
    });
  });

  // Helper methods
  async sendVerificationEmail(user, token) {
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${token}`;
    
    await sendEmail({
      to: user.email,
      subject: 'Verify Your Email - Esports Platform',
      template: 'email-verification',
      data: {
        username: user.username,
        verificationUrl
      }
    });
  }

  async sendPasswordResetEmail(user, token) {
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;
    
    await sendEmail({
      to: user.email,
      subject: 'Password Reset - Esports Platform',
      template: 'password-reset',
      data: {
        username: user.username,
        resetUrl
      }
    });
  }

  async handleReferral(userId, referralCode) {
    try {
      const referrer = await User.findOne({ referralCode });
      if (referrer) {
        // Handle referral logic here
        logger.info('Referral processed', {
          referrerId: referrer._id,
          newUserId: userId,
          referralCode
        });
      }
    } catch (error) {
      logger.error('Referral processing error:', error);
    }
  }

  async getLocationFromIP(ip) {
    try {
      // Implement IP geolocation service integration
      return 'Unknown';
    } catch (error) {
      return 'Unknown';
    }
  }

  async logFailedLogin(userId, ip, userAgent, reason) {
    logger.warn('Failed login attempt', {
      userId,
      ip,
      userAgent,
      reason,
      timestamp: new Date()
    });
  }

  // Change user password
  changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const user = req.user;

    try {
      // Get user with password field
      const userWithPassword = await User.findById(user._id).select('+password');
      
      // Verify current password
      const isMatch = await userWithPassword.matchPassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      // Update password
      userWithPassword.password = newPassword;
      await userWithPassword.save();

      // Log the password change
      logger.info('Password changed successfully', { userId: user._id });

      // Send email notification
      await this.sendPasswordChangeNotification(userWithPassword);

      res.json({
        success: true,
        message: 'Password changed successfully'
      });

    } catch (error) {
      logger.error('Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to change password',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // Helper method to send password change notification
  async sendPasswordChangeNotification(user) {
    try {
      await sendEmail({
        to: user.email,
        subject: 'Password Changed - Esports Platform',
        template: 'password-changed',
        data: {
          username: user.username,
          timestamp: new Date().toLocaleString(),
          ip: this.getClientIP(req)
        }
      });
    } catch (error) {
      logger.error('Failed to send password change notification:', error);
    }
  }

  // Helper method to get client IP
  getClientIP(req) {
    return req.ip || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           (req.connection.socket ? req.connection.socket.remoteAddress : null);
  }

  // Change user email
  changeEmail = asyncHandler(async (req, res) => {
    const { newEmail, password } = req.body;
    const user = req.user;

    try {
      // Verify current password
      const userWithPassword = await User.findById(user._id).select('+password');
      const isMatch = await userWithPassword.matchPassword(password);
      
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Incorrect password'
        });
      }

      // Check if new email is the same as current email
      if (user.email.toLowerCase() === newEmail.toLowerCase()) {
        return res.status(400).json({
          success: false,
          message: 'New email cannot be the same as current email'
        });
      }

      // Check if new email is already in use
      const existingUser = await User.findOne({ email: newEmail.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email is already in use by another account'
        });
      }

      // Generate verification token
      const verificationToken = crypto.randomBytes(20).toString('hex');
      
      // Set email change data
      user.newEmail = newEmail.toLowerCase();
      user.emailChangeToken = verificationToken;
      user.emailChangeExpires = Date.now() + 3600000; // 1 hour
      
      await user.save();

      // Send verification email
      const verificationUrl = `${process.env.CLIENT_URL}/verify-email-change/${verificationToken}`;
      
      await sendEmail({
        to: newEmail,
        subject: 'Verify Your New Email - Esports Platform',
        template: 'email-change-verification',
        data: {
          username: user.username,
          verificationUrl,
          oldEmail: user.email,
          newEmail
        }
      });

      logger.info('Email change requested', { 
        userId: user._id,
        oldEmail: user.email,
        newEmail 
      });

      res.json({
        success: true,
        message: 'Verification email sent to your new email address. Please verify to complete the email change.'
      });

    } catch (error) {
      logger.error('Change email error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process email change',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // Deactivate user account
  deactivateAccount = asyncHandler(async (req, res) => {
    const { password, reason } = req.body;
    const user = req.user;
    const clientIp = this.getClientIp(req);
    const userAgent = req.get('User-Agent');

    try {
      // Verify current password
      const userWithPassword = await User.findById(user._id).select('+password');
      const isMatch = await userWithPassword.matchPassword(password);
      
      if (!isMatch) {
        logger.warn('Failed account deactivation attempt - incorrect password', {
          userId: user._id,
          ip: clientIp
        });
        
        return res.status(400).json({
          success: false,
          message: 'Incorrect password',
          code: 'INCORRECT_PASSWORD'
        });
      }

      // Mark account as deactivated
      user.isActive = false;
      user.deactivatedAt = new Date();
      user.deactivationReason = reason || 'User requested account deactivation';
      
      // Invalidate all active sessions
      user.refreshToken = undefined;
      user.refreshTokenExpires = undefined;
      
      await user.save();

      // Log the deactivation
      logger.info('Account deactivated', {
        userId: user._id,
        email: user.email,
        ip: clientIp,
        userAgent,
        reason: reason || 'No reason provided'
      });

      // Send deactivation confirmation email
      try {
        await sendEmail({
          to: user.email,
          subject: 'Your Account Has Been Deactivated - Esports Platform',
          template: 'account-deactivated',
          data: {
            username: user.username,
            deactivationDate: new Date().toLocaleDateString(),
            contactEmail: process.env.SUPPORT_EMAIL || 'support@esportsbgm.com',
            reason: reason || 'Not specified'
          }
        });
      } catch (emailError) {
        logger.error('Failed to send deactivation email', {
          userId: user._id,
          error: emailError.message
        });
        // Don't fail the request if email sending fails
      }

      // Clear auth cookies
      res.clearCookie('accessToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });

      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });

      res.json({
        success: true,
        message: 'Your account has been deactivated successfully. We\'re sorry to see you go!',
        deactivatedAt: user.deactivatedAt
      });

    } catch (error) {
      logger.error('Account deactivation error:', {
        error: error.message,
        userId: user?._id,
        ip: clientIp,
        stack: error.stack
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to deactivate account',
        code: 'DEACTIVATION_FAILED',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // Google OAuth authentication
  googleAuth = asyncHandler(async (req, res, next) => {
    try {
      // Store the return URL in session if provided
      if (req.query.returnTo) {
        req.session.returnTo = req.query.returnTo;
      }
      
      // Initialize Google OAuth authentication
      const authenticator = passport.authenticate('google', {
        scope: ['profile', 'email'],
        session: false,
        prompt: 'select_account',
        accessType: 'offline'
      });
      
      authenticator(req, res, next);
    } catch (error) {
      logger.error('Google auth error:', error);
      res.status(500).json({
        success: false,
        message: 'Error initiating Google authentication'
      });
    }
  });

  // Google OAuth callback
  googleCallback = asyncHandler(async (req, res, next) => {
    try {
      // Handle the Google OAuth callback
      passport.authenticate('google', { session: false }, async (err, user, info) => {
        if (err) {
          logger.error('Google OAuth error:', err);
          return res.redirect(`${process.env.CLIENT_URL}/login?error=auth_failed`);
        }
        
        if (!user) {
          return res.redirect(`${process.env.CLIENT_URL}/login?error=auth_failed`);
        }

        // Generate tokens
        const { accessToken, refreshToken } = await generateTokens(user);
        
        // Set cookies
        res.cookie('accessToken', accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 15 * 60 * 1000 // 15 minutes
        });
        
        res.cookie('refreshToken', refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
        
        // Redirect to the return URL or dashboard
        const returnTo = req.session.returnTo || '/dashboard';
        delete req.session.returnTo;
        
        res.redirect(`${process.env.CLIENT_URL}${returnTo}`);
      })(req, res, next);
    } catch (error) {
      logger.error('Google callback error:', error);
      res.redirect(`${process.env.CLIENT_URL}/login?error=auth_error`);
    }
  });
}

module.exports = new AuthController();
