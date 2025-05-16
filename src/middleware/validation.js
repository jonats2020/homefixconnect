const { validationResult, check } = require('express-validator');

/**
 * Middleware to check validation results
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

/**
 * Validation rules for user registration
 */
const registerValidation = [
  check('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  check('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/\d/)
    .withMessage('Password must contain at least one number')
    .matches(/[a-zA-Z]/)
    .withMessage('Password must contain at least one letter'),
  
  check('fullName')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Full name must be at least 2 characters long'),
  
  check('role')
    .isIn(['customer', 'contractor'])
    .withMessage('Role must be either customer or contractor'),
  
  validateRequest
];

/**
 * Validation rules for login
 */
const loginValidation = [
  check('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  check('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  validateRequest
];

/**
 * Validation rules for job creation
 */
const createJobValidation = [
  check('title')
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Title must be between 5 and 100 characters'),
  
  check('description')
    .trim()
    .isLength({ min: 20 })
    .withMessage('Description must be at least 20 characters'),
  
  check('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required'),
  
  check('budget')
    .isFloat({ min: 0 })
    .withMessage('Budget must be a positive number'),
  
  validateRequest
];

/**
 * Validation rules for bid creation
 */
const createBidValidation = [
  check('jobId')
    .trim()
    .notEmpty()
    .withMessage('Job ID is required')
    .isUUID()
    .withMessage('Invalid job ID format'),
  
  check('amount')
    .isFloat({ min: 0 })
    .withMessage('Amount must be a positive number'),
  
  check('estimatedDays')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Estimated days must be a positive integer'),
  
  validateRequest
];

/**
 * Validation rules for rating creation
 */
const createRatingValidation = [
  check('jobId')
    .trim()
    .notEmpty()
    .withMessage('Job ID is required')
    .isUUID()
    .withMessage('Invalid job ID format'),
  
  check('toUserId')
    .trim()
    .notEmpty()
    .withMessage('User ID is required')
    .isUUID()
    .withMessage('Invalid user ID format'),
  
  check('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be an integer between 1 and 5'),
  
  validateRequest
];

/**
 * Validation rules for message creation
 */
const sendMessageValidation = [
  check('conversationId')
    .trim()
    .notEmpty()
    .withMessage('Conversation ID is required')
    .isUUID()
    .withMessage('Invalid conversation ID format'),
  
  check('content')
    .trim()
    .notEmpty()
    .withMessage('Message content is required')
    .isLength({ max: 1000 })
    .withMessage('Message content cannot exceed 1000 characters'),
  
  check('jobId')
    .optional()
    .isUUID()
    .withMessage('Invalid job ID format'),
  
  validateRequest
];

/**
 * Validation rules for profile update
 */
const updateProfileValidation = [
  check('fullName')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Full name must be at least 2 characters long'),
  
  check('phone')
    .optional()
    .trim(),
  
  check('address')
    .optional()
    .trim(),
  
  check('profileImage')
    .optional()
    .trim()
    .isURL()
    .withMessage('Profile image must be a valid URL'),
  
  validateRequest
];

module.exports = {
  validateRequest,
  registerValidation,
  loginValidation,
  createJobValidation,
  createBidValidation,
  createRatingValidation,
  sendMessageValidation,
  updateProfileValidation
};
