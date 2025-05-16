const express = require('express');
const jobController = require('../controllers/jobController');
const { authenticate, verifyUserExists, requireCustomer } = require('../middleware/auth');
const { createJobValidation } = require('../middleware/validation');
const { uploadFiles } = require('../middleware/upload');

const router = express.Router();

/**
 * @route   POST /api/jobs
 * @desc    Create a new job
 * @access  Private (customers only)
 */
router.post(
  '/',
  authenticate,
  verifyUserExists,
  requireCustomer,
  uploadFiles('images'),
  createJobValidation,
  jobController.createJob
);

/**
 * @route   GET /api/jobs
 * @desc    Get all jobs with optional filtering
 * @access  Private
 */
router.get(
  '/',
  authenticate,
  verifyUserExists,
  jobController.getJobs
);

/**
 * @route   GET /api/jobs/my
 * @desc    Get jobs for the current user
 * @access  Private
 */
router.get(
  '/my',
  authenticate,
  verifyUserExists,
  jobController.getMyJobs
);

/**
 * @route   GET /api/jobs/:id
 * @desc    Get a specific job by ID
 * @access  Private
 */
router.get(
  '/:id',
  authenticate,
  verifyUserExists,
  jobController.getJobById
);

/**
 * @route   PUT /api/jobs/:id
 * @desc    Update a job
 * @access  Private (job owner only)
 */
router.put(
  '/:id',
  authenticate,
  verifyUserExists,
  requireCustomer,
  uploadFiles('images'),
  jobController.updateJob
);

/**
 * @route   DELETE /api/jobs/:id
 * @desc    Delete a job
 * @access  Private (job owner only)
 */
router.delete(
  '/:id',
  authenticate,
  verifyUserExists,
  requireCustomer,
  jobController.deleteJob
);

/**
 * @route   POST /api/jobs/assign
 * @desc    Assign a contractor to a job by accepting a bid
 * @access  Private (job owner only)
 */
router.post(
  '/assign',
  authenticate,
  verifyUserExists,
  requireCustomer,
  jobController.assignContractor
);

module.exports = router;
