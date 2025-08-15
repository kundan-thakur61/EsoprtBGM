const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const logger = require('../utils/logger/logger');

// JWT Strategy
passport.use('jwt', new JwtStrategy({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_ACCESS_SECRET,
  issuer: process.env.JWT_ISSUER || 'esports-platform',
  audience: process.env.JWT_AUDIENCE || 'esports-users'
}, async (payload, done) => {
  try {
    const user = await User.findById(payload.id)
      .select('-password -refreshTokens')
      .populate('profile', 'avatarUrl bio');
    
    if (user && user.isActive) {
      return done(null, user);
    }
    return done(null, false);
  } catch (error) {
    logger.error('JWT Strategy error:', error);
    return done(error, false);
  }
}));

// Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ 
        $or: [
          { googleId: profile.id },
          { email: profile.emails[0].value }
        ]
      });

      if (user) {
        if (!user.googleId) {
          user.googleId = profile.id;
          await user.save();
        }
        return done(null, user);
      } else {
        user = new User({
          googleId: profile.id,
          username: profile.displayName.replace(/\s/g, '').toLowerCase(),
          email: profile.emails[0].value,
          isEmailVerified: true,
          provider: 'google'
        });
        await user.save();
        return done(null, user);
      }
    } catch (error) {
      logger.error('Google OAuth error:', error);
      return done(error, false);
    }
  }));
}

module.exports = passport;