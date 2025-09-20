// frontend/src/pages/LoginPage.jsx
import { useState, useContext } from "react";
import api from "../config/api.js";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const LoginPage = () => {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [fieldErrors, setFieldErrors] = useState({});
	const { login } = useContext(AuthContext);
	const navigate = useNavigate();

	// Client-side validation
	const validateForm = () => {
		const errors = {};
		
		if (!username.trim()) {
			errors.username = "Username is required";
		} else if (username.trim().length < 3) {
			errors.username = "Username must be at least 3 characters long";
		}
		
		if (!password) {
			errors.password = "Password is required";
		} else if (password.length < 6) {
			errors.password = "Password must be at least 6 characters long";
		}
		
		return errors;
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
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
			const res = await api.post("/users/login", { 
				username: username.trim(), 
				password 
			});
			
			// Login with token and user data
			login(res.data.token, res.data.user);
			navigate("/"); // Redirect to homepage on successful login
		} catch (err) {
			setError(err.message || "Login failed. Please try again.");
			console.error('Login error:', err);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
			<div className="max-w-md w-full space-y-8">
				<div className="text-center">
					<h2 className="mt-6 text-3xl font-extrabold text-gray-900">
						Welcome Back
					</h2>
					<p className="mt-2 text-sm text-gray-600">
						Sign in to your account to continue
					</p>
				</div>

				<div className="bg-white py-8 px-6 shadow-xl rounded-lg">
					{error && (
						<div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
							<div className="flex">
								<div className="flex-shrink-0">
									<svg
										className="h-5 w-5 text-red-400"
										viewBox="0 0 20 20"
										fill="currentColor"
									>
										<path
											fillRule="evenodd"
											d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
											clipRule="evenodd"
										/>
									</svg>
								</div>
								<div className="ml-3">
									<p className="text-sm">{error}</p>
								</div>
							</div>
						</div>
					)}

					<form onSubmit={handleSubmit} className="space-y-6">
						<div>
							<label
								htmlFor="username"
								className="block text-sm font-medium text-gray-700"
							>
								Username
							</label>
							<div className="mt-1">
								<input
									id="username"
									type="text"
									value={username}
									onChange={(e) => setUsername(e.target.value)}
									required
									placeholder="Enter your username"
									className={`appearance-none block w-full px-3 py-2 border rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
										fieldErrors.username ? 'border-red-300' : 'border-gray-300'
									}`}
								/>
								{fieldErrors.username && (
									<p className="mt-1 text-sm text-red-600">{fieldErrors.username}</p>
								)}
							</div>
						</div>

						<div>
							<label
								htmlFor="password"
								className="block text-sm font-medium text-gray-700"
							>
								Password
							</label>
							<div className="mt-1">
								<input
									id="password"
									type="password"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									required
									placeholder="Enter your password"
									className={`appearance-none block w-full px-3 py-2 border rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
										fieldErrors.password ? 'border-red-300' : 'border-gray-300'
									}`}
								/>
								{fieldErrors.password && (
									<p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
								)}
							</div>
						</div>

						<div>
							<button
								type="submit"
								disabled={loading}
								className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
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
										Signing in...
									</span>
								) : (
									"Sign In"
								)}
							</button>
						</div>

						<div className="text-center">
							<p className="text-sm text-gray-600">
								Don't have an account?{" "}
								<Link
									to="/register"
									className="font-medium text-indigo-600 hover:text-indigo-500"
								>
									Sign up here
								</Link>
							</p>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
};

export default LoginPage;
