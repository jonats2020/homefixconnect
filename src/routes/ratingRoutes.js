const express = require('express');
const ratingController = require('../controllers/ratingController');
const { authenticate, verifyUserExists } = require('../middleware/auth');
const { createRatingValidation } = require('../middleware/validation');

const router = express.Router();

/**
 * @route   POST /api/ratings
 * @desc    Create a rating for a completed job
 * @access  Private
 */
router.post(
  '/',
  authenticate,
  verifyUserExists,
  createRatingValidation,
  ratingController.createRating
);

/**
 * @route   GET /api/ratings/user/:userId
 * @desc    Get ratings for a user
 * @access  Private
 */
router.get(
  '/user/:userId',
  authenticate,
  verifyUserExists,
  ratingController.getUserRatings
);

/**
 * @route   GET /api/ratings/job/:jobId
 * @desc    Get ratings for a job
 * @access  Private
 */
router.get(
  '/job/:jobId',
  authenticate,
  verifyUserExists,
  ratingController.getJobRatings
);

module.exports = router;
