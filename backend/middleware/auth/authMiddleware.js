const jwt = require('jsonwebtoken');
const User = require('../../models/User'); // adjust path if needed

// 🔹 Middleware: Require authentication
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      return res.status(401).json({ message: 'User not found' });
    }

    next();
  } catch (error) {
    console.error('Auth error:', error.message);
    return res.status(401).json({ message: 'Not authorized' });
  }
};

// 🔹 Middleware: Optional authentication (if token exists)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    }
    next();
  } catch (error) {
    // Token invalid? Just move on without user data
    next();
  }
};

// 🔹 Middleware: Role-based authorization
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized for this action' });
    }
    next();
  };
};
// In your authMiddleware.js file, add this method:
checkSubscription = (requiredLevel) => {
  const levelHierarchy = { free: 0, premium: 1, pro: 2 };
  
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userLevel = levelHierarchy[req.user.subscription?.plan || 'free'] || 0;
    const required = levelHierarchy[requiredLevel] || 0;

    if (userLevel < required) {
      return res.status(402).json({
        success: false,
        message: `${requiredLevel} subscription required`,
        current: req.user.subscription?.plan || 'free',
        required: requiredLevel
      });
    }

    // Check if subscription is expired
    if (req.user.subscription?.plan !== 'free' && 
        req.user.subscription?.expiresAt < new Date()) {
      return res.status(402).json({
        success: false,
        message: 'Subscription expired',
        expiredAt: req.user.subscription.expiresAt
      });
    }

    next();
  };
};


module.exports = {
  authenticate,
  optionalAuth,
  authorize,
   checkSubscription,
};
