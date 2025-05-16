const express = require('express');
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { registerValidation, loginValidation } = require('../middleware/validation');

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', registerValidation, authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Login a user
 * @access  Public
 */
router.post('/login', loginValidation, authController.login);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user data
 * @access  Private
 */
router.get('/me', authenticate, authController.getCurrentUser);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout a user
 * @access  Private
 */
router.post('/logout', authenticate, authController.logout);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Request password reset
 * @access  Public
 */
router.post('/reset-password', authController.requestPasswordReset);

module.exports = router;
