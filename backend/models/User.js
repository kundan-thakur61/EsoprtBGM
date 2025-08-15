const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const validator = require('validator');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers and underscores']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: function() { return !this.googleId; },
    minlength: [8, 'Password must be at least 8 characters'],
    validate: {
      validator: function(password) {
        // Password must contain at least one uppercase, one lowercase, one digit and one special char
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(password);
      },
      message: 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'
    },
    select: false
  },
  role: {
    type: String,
    enum: {
      values: ['player', 'captain', 'moderator', 'admin', 'super_admin'],
      message: 'Role must be either player, captain, moderator, admin, or super_admin'
    },
    default: 'player'
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  passwordChangedAt: Date,
  lastLogin: Date,
  loginCount: {
    type: Number,
    default: 0
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorSecret: {
    type: String,
    select: false
  },
  refreshTokens: [{
    token: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: {
      type: Date,
      required: true
    },
    device: String,
    ip: String
  }],
  loginHistory: [{
    ip: String,
    userAgent: String,
    location: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    success: Boolean
  }],
  preferences: {
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      },
      sms: {
        type: Boolean,
        default: false
      }
    },
    privacy: {
      showEmail: {
        type: Boolean,
        default: false
      },
      showStats: {
        type: Boolean,
        default: true
      }
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto'
    },
    language: {
      type: String,
      default: 'en'
    }
  },
  // Social authentication
  googleId: String,
  facebookId: String,
  discordId: String,
  // Subscription
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'premium', 'pro'],
      default: 'free'
    },
    expiresAt: Date,
    autoRenew: {
      type: Boolean,
      default: false
    }
  },
  // Security
  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  accountLockedUntil: Date,
  ipWhitelist: [String],
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { 
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.refreshTokens;
      delete ret.twoFactorSecret;
      delete ret.emailVerificationToken;
      delete ret.passwordResetToken;
      return ret;
    }
  }
});

// Indexes for performance
UserSchema.index({ email: 1 });
UserSchema.index({ username: 1 });
UserSchema.index({ role: 1, isActive: 1 });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ 'refreshTokens.token': 1 });

// Virtual for account lock status
UserSchema.virtual('isLocked').get(function() {
  return !!(this.failedLoginAttempts && 
           this.failedLoginAttempts >= 5 && 
           this.accountLockedUntil && 
           this.accountLockedUntil > Date.now());
});

// Hash password before save
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    this.passwordChangedAt = Date.now() - 1000; // Subtract 1 second to ensure JWT tokens created after password change are valid
    next();
  } catch (error) {
    next(error);
  }
});

// Update timestamps
UserSchema.pre('save', function(next) {
  if (!this.isNew) {
    this.updatedAt = Date.now();
  }
  next();
});

// Clean expired refresh tokens
UserSchema.pre('save', function(next) {
  if (this.refreshTokens) {
    this.refreshTokens = this.refreshTokens.filter(token => 
      token.expiresAt > new Date()
    );
  }
  next();
});

// Instance methods
UserSchema.methods.matchPassword = async function(enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

UserSchema.methods.generateEmailVerificationToken = function() {
  const token = crypto.randomBytes(32).toString('hex');
  this.emailVerificationToken = crypto.createHash('sha256').update(token).digest('hex');
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  return token;
};

UserSchema.methods.generatePasswordResetToken = function() {
  const token = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  return token;
};

UserSchema.methods.addRefreshToken = function(token, device, ip) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  this.refreshTokens.push({
    token,
    expiresAt,
    device,
    ip
  });
  
  // Keep only the last 5 refresh tokens
  if (this.refreshTokens.length > 5) {
    this.refreshTokens = this.refreshTokens.slice(-5);
  }
};

UserSchema.methods.removeRefreshToken = function(token) {
  this.refreshTokens = this.refreshTokens.filter(rt => rt.token !== token);
};

UserSchema.methods.addLoginHistory = function(ip, userAgent, location, success = true) {
  this.loginHistory.unshift({
    ip,
    userAgent,
    location,
    success,
    timestamp: new Date()
  });
  
  // Keep only the last 10 login attempts
  if (this.loginHistory.length > 10) {
    this.loginHistory = this.loginHistory.slice(0, 10);
  }
  
  if (success) {
    this.lastLogin = Date.now();
    this.loginCount += 1;
    this.failedLoginAttempts = 0;
    this.accountLockedUntil = undefined;
  } else {
    this.failedLoginAttempts += 1;
    if (this.failedLoginAttempts >= 5) {
      this.accountLockedUntil = Date.now() + 30 * 60 * 1000; // Lock for 30 minutes
    }
  }
};

UserSchema.methods.hasPermission = function(permission) {
  const rolePermissions = {
    player: ['read_own_profile', 'update_own_profile', 'join_tournaments'],
    captain: ['read_own_profile', 'update_own_profile', 'join_tournaments', 'create_team', 'manage_team'],
    moderator: ['read_own_profile', 'update_own_profile', 'join_tournaments', 'create_team', 'manage_team', 'moderate_content'],
    admin: ['read_own_profile', 'update_own_profile', 'join_tournaments', 'create_team', 'manage_team', 'moderate_content', 'manage_users', 'manage_tournaments'],
    super_admin: ['*'] // All permissions
  };
  
  const userPermissions = rolePermissions[this.role] || [];
  return userPermissions.includes('*') || userPermissions.includes(permission);
};

UserSchema.methods.canAccessResource = function(resource, action = 'read') {
  const permission = `${action}_${resource}`;
  return this.hasPermission(permission);
};

// Static methods
UserSchema.statics.findByEmailOrUsername = function(identifier) {
  return this.findOne({
    $or: [
      { email: identifier.toLowerCase() },
      { username: identifier.toLowerCase() }
    ]
  });
};

UserSchema.statics.findActiveUsers = function() {
  return this.find({ isActive: true });
};

UserSchema.statics.getUserStats = async function() {
  return await this.aggregate([
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        activeUsers: { $sum: { $cond: ['$isActive', 1, 0] } },
        verifiedUsers: { $sum: { $cond: ['$isEmailVerified', 1, 0] } },
        roleDistribution: {
          $push: {
            role: '$role',
            count: 1
          }
        }
      }
    }
  ]);
};

module.exports = mongoose.model('User', UserSchema);