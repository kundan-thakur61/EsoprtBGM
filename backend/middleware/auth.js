// middleware/auth.js
const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = asyncHandler(async (req, res, next) => {
  let token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) throw new Error('User not found');
    next();
  } catch (err) {
    res.status(401);
    throw new Error('Not authorized, token failed');
  }
});
