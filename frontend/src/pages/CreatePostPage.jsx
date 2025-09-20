// frontend/src/pages/CreatePostPage.jsx
import { useState, useContext } from "react";
import api from "../config/api.js";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const CreatePostPage = () => {
	const [title, setTitle] = useState("");
	const [content, setContent] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [fieldErrors, setFieldErrors] = useState({});
	
	// AI Generation states
	const [topicInput, setTopicInput] = useState("");
	const [isGenerating, setIsGenerating] = useState(false);
	const [generationError, setGenerationError] = useState("");
	const [generatedContent, setGeneratedContent] = useState(null);
	const [tone, setTone] = useState("professional");
	const [length, setLength] = useState("medium");
	const [showAISection, setShowAISection] = useState(false);
	
	const { isLoggedIn } = useContext(AuthContext);
	const navigate = useNavigate();

	// Client-side validation
	const validateForm = () => {
		const errors = {};
		
		if (!title.trim()) {
			errors.title = "Title is required";
		} else if (title.trim().length > 200) {
			errors.title = "Title must be less than 200 characters";
		}
		
		if (!content.trim()) {
			errors.content = "Content is required";
		} else if (content.trim().length > 10000) {
			errors.content = "Content must be less than 10,000 characters";
		}
		
		return errors;
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!isLoggedIn) {
			setError("You must be logged in to create a post");
			return;
		}

		setLoading(true);
		setError("");
		setFieldErrors({});

		// Client-side validation
		const errors = validateForm();
		if (Object.keys(errors).length > 0) {
			setFieldErrors(errors);
			setLoading(false);
			return;
		}

		try {
			await api.post("/posts", { 
				title: title.trim(), 
				content: content.trim() 
			});
			navigate("/"); // Redirect to homepage after successful post creation
		} catch (err) {
			setError(err.message || "Failed to create post");
			console.error('Create post error:', err);
		} finally {
			setLoading(false);
		}
	};

	// AI Content Generation
	const handleGenerateContent = async () => {
		if (!topicInput.trim()) {
			setGenerationError("Please enter a topic for content generation");
			return;
		}

		if (topicInput.trim().length < 5 || topicInput.trim().length > 200) {
			setGenerationError("Topic must be between 5 and 200 characters");
			return;
		}

		setIsGenerating(true);
		setGenerationError("");

		try {
			const response = await api.post("/posts/generate", {
				topic: topicInput.trim(),
				tone,
				length
			});

			if (response.data.success) {
				setGeneratedContent(response.data);
				// Auto-populate the form with generated content
				setTitle(response.data.title);
				setContent(response.data.content);
				// Clear any existing errors
				setFieldErrors({});
			} else {
				setGenerationError(response.data.error || "Failed to generate content");
			}
		} catch (err) {
			console.error('AI generation error:', err);
			if (err.response?.data?.error) {
				setGenerationError(err.response.data.error);
			} else if (err.response?.status === 429) {
				setGenerationError("Rate limit exceeded. Please try again in a few minutes.");
			} else if (err.response?.status === 503) {
				setGenerationError("AI service is currently unavailable. Please try again later.");
			} else {
				setGenerationError("Failed to generate content. Please check your connection and try again.");
			}
		} finally {
			setIsGenerating(false);
		}
	};

	// Clear generated content and reset AI section
	const clearGeneratedContent = () => {
		setGeneratedContent(null);
		setTopicInput("");
		setGenerationError("");
		setTone("professional");
		setLength("medium");
	};

	if (!isLoggedIn) {
		return (
			<div className="max-w-2xl mx-auto px-4 py-8">
				<div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
					<p>
						You must be{" "}
						<a href="/login" className="underline font-medium">
							logged in
						</a>{" "}
						to create a post.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="max-w-2xl mx-auto px-4 py-8">
			<div className="bg-white rounded-lg shadow-md p-6">
				<h1 className="text-3xl font-bold text-gray-900 mb-6">
					Create New Post
				</h1>

				{/* AI Content Generation Section */}
				<div className="mb-8 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6 border border-indigo-200">
					<div className="flex items-center justify-between mb-4">
						<div className="flex items-center">
							<svg className="h-6 w-6 text-indigo-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
							</svg>
							<h3 className="text-lg font-semibold text-gray-900">AI Content Generator</h3>
						</div>
						<button
							type="button"
							onClick={() => setShowAISection(!showAISection)}
							className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
						>
							{showAISection ? "Hide" : "Show"} AI Tools
						</button>
					</div>

					{showAISection && (
						<div className="space-y-4">
							<div>
								<label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-2">
									Blog Topic
								</label>
								<input
									id="topic"
									type="text"
									value={topicInput}
									onChange={(e) => setTopicInput(e.target.value)}
									placeholder="Enter a topic for your blog post (e.g., 'Benefits of Remote Work')..."
									className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
									maxLength={200}
								/>
								<p className="mt-1 text-xs text-gray-500">
									{topicInput.length}/200 characters
								</p>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<label htmlFor="tone" className="block text-sm font-medium text-gray-700 mb-2">
										Tone
									</label>
									<select
										id="tone"
										value={tone}
										onChange={(e) => setTone(e.target.value)}
										className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
									>
										<option value="professional">Professional</option>
										<option value="casual">Casual</option>
										<option value="academic">Academic</option>
									</select>
								</div>
								<div>
									<label htmlFor="length" className="block text-sm font-medium text-gray-700 mb-2">
										Length
									</label>
									<select
										id="length"
										value={length}
										onChange={(e) => setLength(e.target.value)}
										className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
									>
										<option value="short">Short (300-500 words)</option>
										<option value="medium">Medium (500-800 words)</option>
										<option value="long">Long (800-1200 words)</option>
									</select>
								</div>
							</div>

							{generationError && (
								<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
									{generationError}
								</div>
							)}

							{generatedContent && (
								<div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
									<div className="flex items-center justify-between">
										<span className="font-medium">✓ Content generated successfully!</span>
										<button
											type="button"
											onClick={clearGeneratedContent}
											className="text-green-600 hover:text-green-500 text-sm underline"
										>
											Clear
										</button>
									</div>
									<p className="text-sm mt-1">
										Topic: "{generatedContent.topic}" | 
										Tone: {generatedContent.options.tone} | 
										Length: {generatedContent.options.length}
									</p>
								</div>
							)}

							<button
								type="button"
								onClick={handleGenerateContent}
								disabled={isGenerating || !topicInput.trim()}
								className="w-full px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-md hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
							>
								{isGenerating ? (
									<span className="flex items-center justify-center">
										<svg
											className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
											xmlns="http://www.w3.org/2000/svg"
											fill="none"
											viewBox="0 0 24 24"
										>
											<circle
												className="opacity-25"
												cx="12"
												cy="12"
												r="10"
												stroke="currentColor"
												strokeWidth="4"
											></circle>
											<path
												className="opacity-75"
												fill="currentColor"
												d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
											></path>
										</svg>
										Generating with AI...
									</span>
								) : (
									<span className="flex items-center justify-center">
										<svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
										</svg>
										Generate with AI
									</span>
								)}
							</button>
						</div>
					)}
				</div>

				{error && (
					<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
						{error}
					</div>
				)}

				<form onSubmit={handleSubmit} className="space-y-6">
					<div>
						<label
							htmlFor="title"
							className="block text-sm font-medium text-gray-700 mb-2"
						>
							Title
						</label>
						<input
							id="title"
							type="text"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							required
							placeholder="Enter your post title..."
							className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
								fieldErrors.title ? 'border-red-300' : 'border-gray-300'
							}`}
						/>
						{fieldErrors.title && (
							<p className="mt-1 text-sm text-red-600">{fieldErrors.title}</p>
						)}
						<p className="mt-1 text-xs text-gray-500">
							{title.length}/200 characters
						</p>
					</div>

					<div>
						<label
							htmlFor="content"
							className="block text-sm font-medium text-gray-700 mb-2"
						>
							Content
						</label>
						<textarea
							id="content"
							value={content}
							onChange={(e) => setContent(e.target.value)}
							required
							rows={12}
							placeholder="Write your post content here... or use the AI generator above to get started!"
							className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 resize-vertical ${
								fieldErrors.content ? 'border-red-300' : 'border-gray-300'
							}`}
						/>
						{fieldErrors.content && (
							<p className="mt-1 text-sm text-red-600">{fieldErrors.content}</p>
						)}
						<p className="mt-1 text-xs text-gray-500">
							{content.length}/10,000 characters
						</p>
					</div>

					<div className="flex items-center justify-between">
						<button
							type="button"
							onClick={() => navigate("/")}
							className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={loading}
							className="px-6 py-2 font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{loading ? (
								<span className="flex items-center">
									<svg
										className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
									>
										<circle
											className="opacity-25"
											cx="12"
											cy="12"
											r="10"
											stroke="currentColor"
											strokeWidth="4"
										></circle>
										<path
											className="opacity-75"
											fill="currentColor"
											d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
										></path>
									</svg>
									Creating...
								</span>
							) : (
								"Create Post"
							)}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default CreatePostPage;
