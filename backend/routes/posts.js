// backend/routes/posts.js

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Import our auth middleware
const Post = require('../models/Post'); // Import the Post model
const User = require('../models/User'); // Import the User model
const geminiService = require('../services/geminiService'); // Import Gemini service

// Input validation helper functions
const validatePostInput = {
  title: (title) => {
    if (!title || typeof title !== 'string') {
      return 'Title is required';
    }
    if (title.trim().length < 1) {
      return 'Title cannot be empty';
    }
    if (title.trim().length > 200) {
      return 'Title must be less than 200 characters';
    }
    return null;
  },
  content: (content) => {
    if (!content || typeof content !== 'string') {
      return 'Content is required';
    }
    if (content.trim().length < 1) {
      return 'Content cannot be empty';
    }
    if (content.trim().length > 10000) {
      return 'Content must be less than 10,000 characters';
    }
    return null;
  }
};

// Sanitize HTML content (basic implementation)
const sanitizeContent = (content) => {
  return content
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
};

// --- CREATE A NEW POST (Protected Route) ---
// @route   POST /api/posts
router.post('/', auth, async (req, res) => {
  const { title, content } = req.body;

  // Input validation
  const titleError = validatePostInput.title(title);
  if (titleError) {
    return res.status(400).json({ msg: titleError });
  }

  const contentError = validatePostInput.content(content);
  if (contentError) {
    return res.status(400).json({ msg: contentError });
  }

  try {
    // Sanitize input
    const sanitizedTitle = title.trim();
    const sanitizedContent = sanitizeContent(content.trim());

    const newPost = new Post({
      title: sanitizedTitle,
      content: sanitizedContent,
      author: req.user.id, // Get the user ID from the middleware
    });

    const post = await newPost.save();
    
    // Populate author information before sending response
    const populatedPost = await Post.findById(post._id).populate('author', ['username']);
    
    res.status(201).json(populatedPost);
  } catch (err) {
    console.error('Create post error:', err.message);
    res.status(500).json({ msg: 'Server error while creating post' });
  }
});

// --- GET ALL POSTS (Public Route) ---
// @route   GET /api/posts
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 50) {
      return res.status(400).json({ msg: 'Invalid pagination parameters' });
    }

    // We use .populate() to get the author's username from the User model
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', ['username']);
    
    const total = await Post.countDocuments();
    
    res.json({
      posts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalPosts: total,
        hasNext: skip + posts.length < total,
        hasPrev: page > 1
      }
    });
  } catch (err) {
    console.error('Get posts error:', err.message);
    res.status(500).json({ msg: 'Server error while fetching posts' });
  }
});

// --- UPDATE A POST (Protected Route) ---
// @route   PUT /api/posts/:id
router.put('/:id', auth, async (req, res) => {
    const { title, content } = req.body;

    // Validate MongoDB ObjectId
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({ msg: 'Invalid post ID' });
    }

    // Input validation
    const titleError = validatePostInput.title(title);
    if (titleError) {
        return res.status(400).json({ msg: titleError });
    }

    const contentError = validatePostInput.content(content);
    if (contentError) {
        return res.status(400).json({ msg: contentError });
    }

    try {
        let post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }

        // Check if the user updating the post is the author
        if (post.author.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'Access denied: You can only edit your own posts' });
        }

        // Sanitize input
        const sanitizedTitle = title.trim();
        const sanitizedContent = sanitizeContent(content.trim());

        post = await Post.findByIdAndUpdate(
            req.params.id,
            { $set: { title: sanitizedTitle, content: sanitizedContent } },
            { new: true, runValidators: true }
        ).populate('author', ['username']);

        res.json(post);
    } catch (err) {
        console.error('Update post error:', err.message);
        if (err.name === 'ValidationError') {
            return res.status(400).json({ msg: 'Invalid post data' });
        }
        res.status(500).json({ msg: 'Server error while updating post' });
    }
});

// --- DELETE A POST (Protected Route) ---
// @route   DELETE /api/posts/:id
router.delete('/:id', auth, async (req, res) => {
    // Validate MongoDB ObjectId
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({ msg: 'Invalid post ID' });
    }

    try {
        let post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }

        // Check if the user deleting the post is the author
        if (post.author.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'Access denied: You can only delete your own posts' });
        }

        await Post.findByIdAndDelete(req.params.id);

        res.json({ 
            msg: 'Post deleted successfully',
            deletedPost: {
                id: post._id,
                title: post.title
            }
        });
    } catch (err) {
        console.error('Delete post error:', err.message);
        res.status(500).json({ msg: 'Server error while deleting post' });
    }
});

// --- GENERATE BLOG CONTENT USING AI (Protected Route) ---
// @route   POST /api/posts/generate
router.post('/generate', auth, async (req, res) => {
  const { topic, tone, length } = req.body;

  // Input validation
  if (!topic || typeof topic !== 'string') {
    return res.status(400).json({ 
      success: false, 
      error: 'Topic is required and must be a string' 
    });
  }

  const trimmedTopic = topic.trim();
  if (trimmedTopic.length < 5 || trimmedTopic.length > 200) {
    return res.status(400).json({ 
      success: false, 
      error: 'Topic must be between 5 and 200 characters' 
    });
  }

  // Validate optional parameters
  const validTones = ['casual', 'professional', 'academic'];
  const validLengths = ['short', 'medium', 'long'];
  
  if (tone && !validTones.includes(tone)) {
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid tone. Must be one of: casual, professional, academic' 
    });
  }

  if (length && !validLengths.includes(length)) {
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid length. Must be one of: short, medium, long' 
    });
  }

  try {
    // Rate limiting check (simple in-memory implementation)
    const userId = req.user.id;
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    
    // Note: In production, this should use Redis or database
    if (!global.userGenerationRequests) {
      global.userGenerationRequests = new Map();
    }
    
    const userRequests = global.userGenerationRequests.get(userId) || [];
    const recentRequests = userRequests.filter(timestamp => now - timestamp < oneHour);
    
    if (recentRequests.length >= 5) {
      return res.status(429).json({ 
        success: false, 
        error: 'Rate limit exceeded. You can generate up to 5 blog posts per hour.' 
      });
    }

    // Generate content using Gemini API
    const generatedContent = await geminiService.generateContent(trimmedTopic, {
      tone: tone || 'professional',
      length: length || 'medium'
    });

    // Update rate limiting
    recentRequests.push(now);
    global.userGenerationRequests.set(userId, recentRequests);

    res.json({
      success: true,
      title: generatedContent.title,
      content: generatedContent.content,
      topic: trimmedTopic,
      options: {
        tone: tone || 'professional',
        length: length || 'medium'
      }
    });
  } catch (err) {
    console.error('AI content generation error:', err.message);
    
    // Handle specific error types
    if (err.message.includes('Rate limit')) {
      return res.status(429).json({ 
        success: false, 
        error: err.message 
      });
    } else if (err.message.includes('API access denied') || err.message.includes('API key')) {
      return res.status(503).json({ 
        success: false, 
        error: 'AI service is currently unavailable. Please try again later.' 
      });
    } else if (err.message.includes('Network error')) {
      return res.status(503).json({ 
        success: false, 
        error: 'Network connection error. Please check your connection and try again.' 
      });
    } else {
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to generate content. Please try again.' 
      });
    }
  }
});


module.exports = router;