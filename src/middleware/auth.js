const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

/**
 * Middleware to authenticate JWT token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authenticate = (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication token required' });
    }
    
    // Verify token
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }
      
      // Set user data in request
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role
      };
      
      next();
    });
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

/**
 * Middleware to check if user is a customer
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const requireCustomer = (req, res, next) => {
  if (req.user && req.user.role === 'customer') {
    return next();
  }
  return res.status(403).json({ error: 'Access denied. Customers only.' });
};

/**
 * Middleware to check if user is a contractor
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const requireContractor = (req, res, next) => {
  if (req.user && req.user.role === 'contractor') {
    return next();
  }
  return res.status(403).json({ error: 'Access denied. Contractors only.' });
};

/**
 * Middleware to check if user exists in Supabase
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const verifyUserExists = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    
    // Check if user exists in database
    const { data: user, error } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', userId)
      .single();
    
    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Update role in case it changed
    req.user.role = user.role;
    
    next();
  } catch (error) {
    console.error('Verify user error:', error);
    return res.status(500).json({ error: 'Failed to verify user' });
  }
};

module.exports = {
  authenticate,
  requireCustomer,
  requireContractor,
  verifyUserExists
};
