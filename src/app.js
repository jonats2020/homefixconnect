const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const jobRoutes = require('./routes/jobRoutes');
const bidRoutes = require('./routes/bidRoutes');
const chatRoutes = require('./routes/chatRoutes');
const userRoutes = require('./routes/userRoutes');
const ratingRoutes = require('./routes/ratingRoutes');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const { authenticateToken } = require('./middleware/auth');

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// API documentation route
app.get('/api/docs', (req, res) => {
  res.status(200).json({
    message: 'Home Services Marketplace API',
    version: '1.0',
    endpoints: {
      auth: {
        base: '/api/auth',
        routes: [
          { path: '/register', method: 'POST', description: 'Register a new user' },
          { path: '/login', method: 'POST', description: 'Login and get JWT token' },
          { path: '/me', method: 'GET', description: 'Get current user data (requires auth)' },
          { path: '/logout', method: 'POST', description: 'Logout (requires auth)' },
        ]
      },
      jobs: {
        base: '/api/jobs',
        routes: [
          { path: '/', method: 'GET', description: 'Get all jobs with optional filtering' },
          { path: '/', method: 'POST', description: 'Create a new job (requires auth)' },
          { path: '/my', method: 'GET', description: 'Get current user\'s jobs (requires auth)' },
          { path: '/:id', method: 'GET', description: 'Get a specific job by ID' },
          { path: '/:id', method: 'PUT', description: 'Update a job (requires auth, job owner only)' },
          { path: '/:id', method: 'DELETE', description: 'Delete a job (requires auth, job owner only)' },
          { path: '/assign', method: 'POST', description: 'Assign contractor to job (requires auth, job owner only)' }
        ]
      },
      bids: {
        base: '/api/bids',
        routes: [
          { path: '/', method: 'POST', description: 'Create a bid (requires auth, contractors only)' },
          { path: '/job/:jobId', method: 'GET', description: 'Get all bids for a job (requires auth)' },
          { path: '/my', method: 'GET', description: 'Get all bids by the current contractor (requires auth)' },
          { path: '/:id', method: 'PUT', description: 'Update a bid (requires auth, bid owner only)' },
          { path: '/:id', method: 'DELETE', description: 'Delete a bid (requires auth, bid owner only)' }
        ]
      },
      chats: {
        base: '/api/chats',
        routes: [
          { path: '/conversation', method: 'POST', description: 'Get or create a conversation (requires auth)' },
          { path: '/conversations', method: 'GET', description: 'Get all conversations (requires auth)' },
          { path: '/message', method: 'POST', description: 'Send a message (requires auth)' },
          { path: '/messages/:conversationId', method: 'GET', description: 'Get messages for a conversation (requires auth)' },
          { path: '/unread', method: 'GET', description: 'Get unread message count (requires auth)' }
        ]
      },
      users: {
        base: '/api/users',
        routes: [
          { path: '/:userId', method: 'GET', description: 'Get public profile of a user (requires auth)' },
          { path: '/profile', method: 'PUT', description: 'Update current user\'s profile (requires auth)' },
          { path: '/search/contractors', method: 'GET', description: 'Search for contractors (requires auth)' }
        ]
      },
      ratings: {
        base: '/api/ratings',
        routes: [
          { path: '/', method: 'POST', description: 'Create a rating (requires auth)' },
          { path: '/user/:userId', method: 'GET', description: 'Get ratings for a user (requires auth)' },
          { path: '/job/:jobId', method: 'GET', description: 'Get ratings for a job (requires auth)' }
        ]
      }
    }
  });
});

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ratings', ratingRoutes);

// Error handling middleware
app.use(errorHandler);

// Handle 404 errors
app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint not found' });
});

module.exports = app;