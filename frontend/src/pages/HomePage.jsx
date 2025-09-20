// frontend/src/pages/HomePage.jsx
import { useState, useEffect } from "react";
import api from "../config/api.js";

const HomePage = () => {
	const [posts, setPosts] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [pagination, setPagination] = useState(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [expandedPosts, setExpandedPosts] = useState(new Set());

	useEffect(() => {
		const fetchPosts = async () => {
			setLoading(true);
			try {
				const res = await api.get(`/posts?page=${currentPage}&limit=10`);
				
				// Handle both old format (array) and new format (object with posts array)
				if (Array.isArray(res.data)) {
					// Old format compatibility
					setPosts(res.data);
					setPagination(null);
				} else {
					// New format with pagination
					setPosts(res.data.posts);
					setPagination(res.data.pagination);
				}
			} catch (err) {
				setError(err.message || "Failed to load posts");
				console.error('Fetch posts error:', err);
			} finally {
				setLoading(false);
			}
		};

		fetchPosts();
	}, [currentPage]);

	// Function to toggle post expansion
	const togglePostExpansion = (postId) => {
		setExpandedPosts(prev => {
			const newExpanded = new Set(prev);
			if (newExpanded.has(postId)) {
				newExpanded.delete(postId);
			} else {
				newExpanded.add(postId);
			}
			return newExpanded;
		});
	};

	// Function to check if post should show truncated content
	const shouldTruncate = (post) => {
		return post.content.length > 300 && !expandedPosts.has(post._id);
	};

	// Function to get display content for a post
	const getDisplayContent = (post) => {
		if (shouldTruncate(post)) {
			return `${post.content.substring(0, 300)}...`;
		}
		return post.content;
	};

	if (loading) {
		return (
			<div className="flex justify-center items-center min-h-[400px]">
				<div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="max-w-4xl mx-auto px-4 py-8">
				<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
					{error}
				</div>
			</div>
		);
	}

	return (
		<div className="max-w-4xl mx-auto px-4 py-8">
			<div className="text-center mb-12">
				<h1 className="text-4xl font-bold text-gray-900 mb-4">
					Welcome to Our Blog
				</h1>
				<p className="text-xl text-gray-600 max-w-2xl mx-auto">
					Discover amazing stories, insights, and ideas from our community of
					writers.
				</p>
			</div>

			{posts.length === 0 ? (
				<div className="text-center py-12">
					<div className="text-gray-400 mb-4">
						<svg
							className="mx-auto h-24 w-24"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={1}
								d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
							/>
						</svg>
					</div>
					<h3 className="text-lg font-medium text-gray-900 mb-2">
						No posts yet
					</h3>
					<p className="text-gray-600">Be the first to share your thoughts!</p>
				</div>
			) : (
				<div className="grid gap-8 md:gap-12">
					{posts.map((post) => (
						<article
							key={post._id}
							className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
						>
							<div className="p-6">
								<div className="flex items-center mb-4">
									<div className="flex-shrink-0">
										<div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
											<span className="text-indigo-600 font-medium text-sm">
												{post.author?.username?.[0]?.toUpperCase() || "A"}
											</span>
										</div>
									</div>
									<div className="ml-3">
										<p className="text-sm font-medium text-gray-900">
											{post.author?.username || "Anonymous"}
										</p>
										<p className="text-sm text-gray-500">
											{new Date(post.createdAt).toLocaleDateString("en-US", {
												year: "numeric",
												month: "long",
												day: "numeric",
											})}
										</p>
									</div>
								</div>
								<h2 className="text-2xl font-bold text-gray-900 mb-3">
									{post.title}
								</h2>
								<div className="prose prose-gray max-w-none">
									<p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
										{getDisplayContent(post)}
									</p>
								</div>
								{post.content.length > 300 && (
									<div className="mt-4">
										<button 
											onClick={() => togglePostExpansion(post._id)}
											className="text-indigo-600 hover:text-indigo-500 font-medium text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded"
										>
											{expandedPosts.has(post._id) ? "Read less ↑" : "Read more →"}
										</button>
									</div>
								)}
							</div>
						</article>
					))}
				</div>
			)}

			{/* Pagination Controls */}
			{pagination && pagination.totalPages > 1 && (
				<div className="mt-8 flex justify-center items-center space-x-4">
					<button
						onClick={() => setCurrentPage(currentPage - 1)}
						disabled={!pagination.hasPrev}
						className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						Previous
					</button>
					<span className="text-sm text-gray-700">
						Page {pagination.currentPage} of {pagination.totalPages}
					</span>
					<button
						onClick={() => setCurrentPage(currentPage + 1)}
						disabled={!pagination.hasNext}
						className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						Next
					</button>
				</div>
			)}
		</div>
	);
};

export default HomePage;
