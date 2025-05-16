const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

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

// Initialize Express app
const app = express();

// Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('ERROR: Missing Supabase credentials in environment variables');
  console.error('Make sure SUPABASE_URL and SUPABASE_KEY are set in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Add supabase client to request object
app.use((req, res, next) => {
  req.supabase = supabase;
  next();
});

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
    message: 'API Documentation',
    version: '1.0',
    endpoints: {
      auth: '/api/auth',
      jobs: '/api/jobs',
      bids: '/api/bids',
      chats: '/api/chats',
      users: '/api/users',
      ratings: '/api/ratings'
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

// Get port from environment variable or use default
const PORT = process.env.PORT || 8000;

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log(`API Documentation available at http://0.0.0.0:${PORT}/api/docs`);
});

module.exports = app; // Export for testing