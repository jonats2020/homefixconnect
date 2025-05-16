/**
 * Global error handling middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error occurred:', err);
  
  // Check if headers already sent
  if (res.headersSent) {
    return next(err);
  }
  
  // Handle Multer errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large',
        message: 'The uploaded file exceeds the maximum allowed size of 5MB.'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        error: 'Too many files',
        message: 'You can upload a maximum of 5 files at once.'
      });
    }
    return res.status(400).json({
      error: 'Upload error',
      message: err.message
    });
  }
  
  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Authentication error',
      message: 'Invalid token'
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Authentication error',
      message: 'Token expired'
    });
  }
  
  // Handle Supabase errors
  if (err.message && err.message.includes('Supabase')) {
    return res.status(500).json({
      error: 'Database error',
      message: 'A database error occurred'
    });
  }
  
  // Handle validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation error',
      message: err.message
    });
  }
  
  // Default error response
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  
  res.status(statusCode).json({
    error: statusCode === 500 ? 'Internal server error' : err.name || 'Error',
    message: statusCode === 500 ? 'Something went wrong on the server' : message
  });
};

module.exports = errorHandler;
