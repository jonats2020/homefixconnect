const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const jobRoutes = require('./routes/jobRoutes');
const bidRoutes = require('./routes/bidRoutes');
const chatRoutes = require('./routes/chatRoutes');
const ratingRoutes = require('./routes/ratingRoutes');
const userRoutes = require('./routes/userRoutes');
const errorHandler = require('./middleware/errorHandler');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/users', userRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Service is healthy' });
});

// API documentation route
app.get('/api/docs', (req, res) => {
  res.status(200).json({
    message: 'API Documentation',
    endpoints: {
      auth: '/api/auth',
      jobs: '/api/jobs',
      bids: '/api/bids',
      chats: '/api/chats',
      ratings: '/api/ratings',
      users: '/api/users'
    }
  });
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Global error handler
app.use(errorHandler);

module.exports = app;
