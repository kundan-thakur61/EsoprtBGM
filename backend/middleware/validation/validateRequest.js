// middleware/validation/validateRequest.js

const { body, param, query, validationResult } = require('express-validator');
const mongoose = require('mongoose');

/**
 * Middleware to handle validation results
 */
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

/**
 * Validates that the given route param is a valid MongoDB ObjectId
 * @param {string} field - the name of the route param, defaults to 'id'
 */
const validateObjectId = (field = 'id') => {
  return param(field)
    .custom(value => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid ObjectId format');
      }
      return true;
    });
};

/**
 * Validates pagination query params: page, limit, sort
 */
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('sort')
    .optional()
    .isIn(['createdAt', '-createdAt', 'updatedAt', '-updatedAt', 'name', '-name'])
    .withMessage('Invalid sort parameter')
];

/**
 * Example: Validates a tournament creation payload
 */
const validateTournamentData = [
  body('name')
    .isLength({ min: 3, max: 100 })
    .withMessage('Tournament name must be between 3 and 100 characters'),
  body('startDate')
    .isISO8601()
    .withMessage('Start date must be a valid date')
    .custom(value => {
      if (new Date(value) <= new Date()) {
        throw new Error('Start date must be in the future');
      }
      return true;
    }),
  body('endDate')
    .isISO8601()
    .withMessage('End date must be a valid date')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  body('maxPlayers')
    .optional()
    .isInt({ min: 2, max: 1000 })
    .withMessage('Max players must be between 2 and 1000'),
  body('entryFee')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Entry fee must be a positive number'),
  body('prizePool')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Prize pool must be a positive number')
];

module.exports = {
  handleValidation,
  validateObjectId,
  validatePagination,
  validateTournamentData
  // You can export other validators similarly:
  // validateEmail, validatePassword, validateUsername, etc.
};
