# Blog Application with AI Content Generation

A full-stack blog application with enhanced "Read More" functionality and AI-powered content generation using Google's Gemini 2.0 Flash API.

## 🚀 Features

### ✨ Enhanced Blog Reading Experience
- **Smart Read More**: Automatically truncates long posts with smooth expand/collapse functionality
- **Multiple Post Expansion**: Read multiple full posts simultaneously
- **Responsive Design**: Works perfectly on desktop and mobile devices

### 🤖 AI-Powered Content Generation
- **Intelligent Writing Assistant**: Generate high-quality blog content from simple topics
- **Customizable Output**: Choose tone (Professional, Casual, Academic) and length (Short, Medium, Long)
- **Smart Auto-Population**: Generated content automatically fills your post form
- **Rate Limited**: Fair usage with 5 generations per hour per user

### 🔒 Security & Performance
- **JWT Authentication**: Secure user sessions
- **Input Validation**: Comprehensive validation and sanitization
- **Rate Limiting**: Prevents API abuse
- **Error Handling**: Graceful error recovery with user-friendly messages

## 🛠️ Quick Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud)
- Google Gemini API key

### Installation

1. **Clone and Install Dependencies**
   ```bash
   # Backend
   cd backend
   npm install
   
   # Frontend
   cd ../frontend
   npm install
   ```

2. **Configure Environment Variables**
   
   **Backend** (`backend/.env`):
   ```env
   MONGO_URI=mongodb://localhost:27017/blog_app
   JWT_SECRET=your_super_secret_jwt_key_here
   PORT=5000
   FRONTEND_URL=http://localhost:5173
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
   
   **Frontend** (`frontend/.env`):
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

3. **Get Your Gemini API Key**
   - Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Create a new API key
   - Add it to your backend `.env` file

4. **Start the Application**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm start
   
   # Terminal 2 - Frontend  
   cd frontend
   npm run dev
   ```

5. **Access the Application**
   - Frontend: http://localhost:5173 (or shown port)
   - Backend API: http://localhost:5000

## 📖 Usage Guide

### Reading Blog Posts
1. Visit the homepage to see all blog posts
2. Posts longer than 300 characters show a "Read more →" button
3. Click to expand and read the full content
4. Click "Read less ↑" to collapse back to summary

### Creating Posts with AI
1. Navigate to "Create Post" page
2. Click "Show AI Tools" to reveal the AI generator
3. Enter your topic (e.g., "Benefits of Remote Work")
4. Select your preferred tone and length
5. Click "Generate with AI" and wait for the magic ✨
6. Review, edit if needed, and publish your post!

### Manual Post Creation
- You can still create posts manually by typing directly into the form
- The AI generator is completely optional

## 🏗️ Project Structure

```
Blog/
├── backend/
│   ├── models/           # MongoDB schemas
│   ├── routes/           # API endpoints
│   ├── middleware/       # Authentication & security
│   ├── services/         # Gemini AI service
│   └── server.js         # Express server
├── frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   ├── context/      # State management
│   │   └── config/       # API configuration
│   └── package.json
└── README.md
```

## 🔧 API Reference

### AI Content Generation
```http
POST /api/posts/generate
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "topic": "Your blog topic here",
  "tone": "professional",     // optional: professional|casual|academic
  "length": "medium"          // optional: short|medium|long
}
```

### Standard Blog Endpoints
- `GET /api/posts` - Get all posts (paginated)
- `POST /api/posts` - Create new post (authenticated)
- `PUT /api/posts/:id` - Update post (authenticated, owner only)
- `DELETE /api/posts/:id` - Delete post (authenticated, owner only)

## 🚨 Troubleshooting

### Common Issues

**"GEMINI_API_KEY is not properly configured"**
- Make sure you've added a valid API key to `backend/.env`
- Restart the backend server after adding the key

**"Network error" when generating content**
- Check your internet connection
- Verify the API key is valid and has quota available

**Frontend not connecting to backend**
- Ensure both servers are running
- Check that `VITE_API_URL` in `frontend/.env` points to correct backend URL

**Posts not loading**
- Make sure MongoDB is running
- Check the `MONGO_URI` in your backend `.env` file

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [Google Gemini AI](https://ai.google.dev/) for the powerful content generation API
- [React](https://reactjs.org/) and [Express.js](https://expressjs.com/) for the robust framework foundation
- [TailwindCSS](https://tailwindcss.com/) for the beautiful, responsive styling

---

**Happy Blogging! 📝✨**