// backend/routes/auth.js

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Import the User model

// Input validation helper functions
const validateInput = {
  username: (username) => {
    if (!username || typeof username !== 'string') {
      return 'Username is required';
    }
    if (username.trim().length < 3) {
      return 'Username must be at least 3 characters long';
    }
    if (username.trim().length > 30) {
      return 'Username must be less than 30 characters';
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
      return 'Username can only contain letters, numbers, and underscores';
    }
    return null;
  },
  password: (password) => {
    if (!password || typeof password !== 'string') {
      return 'Password is required';
    }
    if (password.length < 6) {
      return 'Password must be at least 6 characters long';
    }
    if (password.length > 128) {
      return 'Password must be less than 128 characters';
    }
    return null;
  }
};

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

const checkRateLimit = (ip, endpoint) => {
  const key = `${ip}:${endpoint}`;
  const now = Date.now();
  const attempts = rateLimitStore.get(key) || [];
  
  // Remove old attempts outside the window
  const validAttempts = attempts.filter(time => now - time < RATE_LIMIT_WINDOW);
  
  if (validAttempts.length >= MAX_ATTEMPTS) {
    return false; // Rate limit exceeded
  }
  
  validAttempts.push(now);
  rateLimitStore.set(key, validAttempts);
  return true; // Within rate limit
};

// --- REGISTRATION ROUTE ---
// @route   POST /api/users/register
// @desc    Register a new user
router.post('/register', async (req, res) => {
  // Rate limiting check
  if (!checkRateLimit(req.ip, 'register')) {
    return res.status(429).json({ 
      msg: 'Too many registration attempts. Please try again later.',
      retryAfter: Math.ceil(RATE_LIMIT_WINDOW / 1000 / 60) // minutes
    });
  }

  const { username, password } = req.body;

  // Input validation
  const usernameError = validateInput.username(username);
  if (usernameError) {
    return res.status(400).json({ msg: usernameError });
  }

  const passwordError = validateInput.password(password);
  if (passwordError) {
    return res.status(400).json({ msg: passwordError });
  }

  try {
    // Sanitize input
    const sanitizedUsername = username.trim().toLowerCase();

    // 1. Check if user already exists
    let user = await User.findOne({ username: sanitizedUsername });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    // 2. Create a new user instance
    user = new User({
      username: sanitizedUsername,
      password,
    });

    // 3. Hash the password before saving
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10);
    user.password = await bcrypt.hash(password, salt);

    // 4. Save the user to the database
    await user.save();

    // 5. Create and return a JSON Web Token (JWT)
    const payload = {
      user: {
        id: user.id, // The user's unique ID from the database
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '5h' }, // Token expires in 5 hours
      (err, token) => {
        if (err) {
          console.error('JWT signing error:', err);
          return res.status(500).json({ msg: 'Error generating token' });
        }
        res.json({ 
          token,
          user: {
            id: user.id,
            username: user.username
          }
        });
      }
    );
  } catch (err) {
    console.error('Registration error:', err.message);
    if (err.code === 11000) {
      return res.status(400).json({ msg: 'Username already exists' });
    }
    res.status(500).json({ msg: 'Server error during registration' });
  }
});

// --- LOGIN ROUTE ---
// @route   POST /api/users/login
// @desc    Authenticate user & get token
router.post('/login', async (req, res) => {
  // Rate limiting check
  if (!checkRateLimit(req.ip, 'login')) {
    return res.status(429).json({ 
      msg: 'Too many login attempts. Please try again later.',
      retryAfter: Math.ceil(RATE_LIMIT_WINDOW / 1000 / 60) // minutes
    });
  }

  const { username, password } = req.body;

  // Input validation
  const usernameError = validateInput.username(username);
  if (usernameError) {
    return res.status(400).json({ msg: usernameError });
  }

  const passwordError = validateInput.password(password);
  if (passwordError) {
    return res.status(400).json({ msg: passwordError });
  }

  try {
    // Sanitize input
    const sanitizedUsername = username.trim().toLowerCase();

    // 1. Check if user exists
    let user = await User.findOne({ username: sanitizedUsername });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // 2. Compare submitted password with the stored hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // 3. If credentials are valid, create and return a JWT
    const payload = {
      user: {
        id: user.id,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '5h' },
      (err, token) => {
        if (err) {
          console.error('JWT signing error:', err);
          return res.status(500).json({ msg: 'Error generating token' });
        }
        res.json({ 
          token,
          user: {
            id: user.id,
            username: user.username
          }
        });
      }
    );
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ msg: 'Server error during login' });
  }
});

module.exports = router;