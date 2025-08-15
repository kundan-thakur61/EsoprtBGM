// middleware/roleCheck.js
exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      res.status(403);
      throw new Error('Forbidden: insufficient permissions');
    }
    next();
  };
};
