// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { securityHeaders, validateContentLength, sanitizeRequest } = require('./middleware/security');
require('dotenv').config(); // This loads the environment variables from .env

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(securityHeaders);
app.use(validateContentLength);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' })); // Allows us to accept JSON data in the request body
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request sanitization (after parsing)
app.use(sanitizeRequest);

// Connect to MongoDB
const mongoURI = process.env.MONGO_URI;

if (!mongoURI) {
  console.error('MONGO_URI is not defined in environment variables');
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is not defined in environment variables');
  process.exit(1);
}

if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
  console.warn('WARNING: GEMINI_API_KEY is not properly configured.');
  console.warn('AI content generation will not work until you add a valid API key to the .env file.');
  console.warn('Get your API key from: https://aistudio.google.com/app/apikey');
}

mongoose.connect(mongoURI)
.then(() => {
  console.log("MongoDB connected successfully!");
}).catch(err => {
  console.error("MongoDB connection error:", err);
  process.exit(1);
});


// A simple test route to make sure the server is running
app.get('/', (req, res) => {
    res.send('API is running...');
});

// This tells Express to use our auth routes for any request to /api/users
app.use('/api/users', require('./routes/auth'));

// Use the posts routes
app.use('/api/posts', require('./routes/posts'));



// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});