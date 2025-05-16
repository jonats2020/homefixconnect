/**
 * Application constants
 */

/**
 * Job categories
 */
const JOB_CATEGORIES = [
  'Plumbing',
  'Electrical',
  'Carpentry',
  'Painting',
  'Landscaping',
  'Cleaning',
  'HVAC',
  'Roofing',
  'Flooring',
  'Home Renovation',
  'Moving',
  'Appliance Repair',
  'Pest Control',
  'Security',
  'Other'
];

/**
 * Job statuses
 */
const JOB_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

/**
 * Bid statuses
 */
const BID_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected'
};

/**
 * User roles
 */
const USER_ROLES = {
  CUSTOMER: 'customer',
  CONTRACTOR: 'contractor'
};

/**
 * Validation constants
 */
const VALIDATION = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_TITLE_LENGTH: 100,
  MIN_TITLE_LENGTH: 5,
  MIN_DESCRIPTION_LENGTH: 20,
  MAX_MESSAGE_LENGTH: 1000,
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_FILES: 5,
};

/**
 * Pagination defaults
 */
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MESSAGES_LIMIT: 20
};

/**
 * Error messages
 */
const ERROR_MESSAGES = {
  AUTHENTICATION_REQUIRED: 'Authentication required',
  INVALID_TOKEN: 'Invalid or expired token',
  USER_NOT_FOUND: 'User not found',
  ACCESS_DENIED: 'Access denied',
  CUSTOMERS_ONLY: 'Access denied. Customers only.',
  CONTRACTORS_ONLY: 'Access denied. Contractors only.',
  INTERNAL_SERVER_ERROR: 'Internal server error',
  VALIDATION_ERROR: 'Validation error',
  DATABASE_ERROR: 'Database error',
  FILE_TOO_LARGE: 'The uploaded file exceeds the maximum allowed size of 5MB',
  TOO_MANY_FILES: 'You can upload a maximum of 5 files at once',
  INVALID_FILE_TYPE: 'Invalid file type. Only JPEG, PNG, WebP, MP4, PDF, and Word documents are allowed.',
  MISSING_REQUIRED_FIELDS: 'Missing required fields',
  JOB_NOT_FOUND: 'Job not found',
  BID_NOT_FOUND: 'Bid not found',
  CONVERSATION_NOT_FOUND: 'Conversation not found or you are not part of it',
};

module.exports = {
  JOB_CATEGORIES,
  JOB_STATUS,
  BID_STATUS,
  USER_ROLES,
  VALIDATION,
  PAGINATION,
  ERROR_MESSAGES,
};
