// backend/models/Post.js

const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    minlength: [1, 'Title cannot be empty'],
    maxlength: [200, 'Title must be less than 200 characters']
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    minlength: [1, 'Content cannot be empty'],
    maxlength: [10000, 'Content must be less than 10,000 characters']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId, // This stores the User's ID
    ref: 'User', // This creates the link to the User model
    required: [true, 'Author is required']
  }
}, {
  timestamps: true // Automatically adds 'createdAt' and 'updatedAt' fields
});

// Indexes for better query performance
PostSchema.index({ createdAt: -1 });
PostSchema.index({ author: 1 });
PostSchema.index({ title: 'text', content: 'text' }); // Text search index

module.exports = mongoose.model('Post', PostSchema);