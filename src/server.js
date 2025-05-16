const app = require('./app');

// Get port from environment variables
const PORT = process.env.PORT || 8000;
const HOST = '0.0.0.0';

// Start server
app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
  console.log(`API Documentation available at http://${HOST}:${PORT}/api/docs`);
});
