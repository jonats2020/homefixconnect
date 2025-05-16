const express = require('express');
const userController = require('../controllers/userController');
const { authenticate, verifyUserExists } = require('../middleware/auth');
const { updateProfileValidation } = require('../middleware/validation');
const { uploadImage } = require('../middleware/upload');

const router = express.Router();

/**
 * @route   GET /api/users/:userId
 * @desc    Get public profile of a user
 * @access  Private
 */
router.get(
  '/:userId',
  authenticate,
  verifyUserExists,
  userController.getUserProfile
);

/**
 * @route   PUT /api/users/profile
 * @desc    Update current user's profile
 * @access  Private
 */
router.put(
  '/profile',
  authenticate,
  verifyUserExists,
  uploadImage('profileImage'),
  updateProfileValidation,
  userController.updateProfile
);

/**
 * @route   GET /api/users/search/contractors
 * @desc    Search for contractors
 * @access  Private
 */
router.get(
  '/search/contractors',
  authenticate,
  verifyUserExists,
  userController.searchContractors
);

module.exports = router;
