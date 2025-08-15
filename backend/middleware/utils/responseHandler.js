const logger = require('../../utils/logger');

// Standard response format
const createResponse = (success, data, message, statusCode) => ({
  success,
  data,
  message,
  statusCode,
  timestamp: new Date().toISOString()
});

// Response handler middleware
const responseHandler = (req, res, next) => {
  // Add success method to response
  res.success = (data, message = 'Success', statusCode = 200) => {
    const response = createResponse(true, data, message, statusCode);
    res.status(statusCode).json(response);
  };

  // Add error method to response
  res.error = (message, statusCode = 400, data = null) => {
    const response = createResponse(false, data, message, statusCode);
    res.status(statusCode).json(response);
  };

  // Add not found method to response
  res.notFound = (message = 'Resource not found', data = null) => {
    const response = createResponse(false, data, message, 404);
    res.status(404).json(response);
  };

  // Add unauthorized method to response
  res.unauthorized = (message = 'Unauthorized', data = null) => {
    const response = createResponse(false, data, message, 401);
    res.status(401).json(response);
  };

  // Add forbidden method to response
  res.forbidden = (message = 'Forbidden', data = null) => {
    const response = createResponse(false, data, message, 403);
    res.status(403).json(response);
  };

  // Add server error method to response
  res.serverError = (message = 'Internal server error', data = null) => {
    const response = createResponse(false, data, message, 500);
    res.status(500).json(response);
  };

  next();
};

module.exports = {
  responseHandler,
  createResponse
};
