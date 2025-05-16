const express = require('express');
const bidController = require('../controllers/bidController');
const { authenticate, verifyUserExists, requireContractor } = require('../middleware/auth');
const { createBidValidation } = require('../middleware/validation');

const router = express.Router();

/**
 * @route   POST /api/bids
 * @desc    Create a new bid
 * @access  Private (contractors only)
 */
router.post(
  '/',
  authenticate,
  verifyUserExists,
  requireContractor,
  createBidValidation,
  bidController.createBid
);

/**
 * @route   GET /api/bids/job/:jobId
 * @desc    Get all bids for a job
 * @access  Private
 */
router.get(
  '/job/:jobId',
  authenticate,
  verifyUserExists,
  bidController.getBidsForJob
);

/**
 * @route   GET /api/bids/my
 * @desc    Get all bids by the current contractor
 * @access  Private (contractors only)
 */
router.get(
  '/my',
  authenticate,
  verifyUserExists,
  requireContractor,
  bidController.getMyBids
);

/**
 * @route   PUT /api/bids/:id
 * @desc    Update a bid
 * @access  Private (bid owner only)
 */
router.put(
  '/:id',
  authenticate,
  verifyUserExists,
  requireContractor,
  bidController.updateBid
);

/**
 * @route   DELETE /api/bids/:id
 * @desc    Delete a bid
 * @access  Private (bid owner only)
 */
router.delete(
  '/:id',
  authenticate,
  verifyUserExists,
  requireContractor,
  bidController.deleteBid
);

module.exports = router;
