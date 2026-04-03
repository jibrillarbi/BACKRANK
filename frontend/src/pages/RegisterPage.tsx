import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User } from 'lucide-react';
import { useRegister } from '../api/useAuth';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { mutate: register, isPending, error: apiError } = useRegister();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!username || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    register(
      { username, email, password },
      {
        onSuccess: () => {
          navigate('/login');
        },
        onError: (err) => {
          setError(err.message || 'Registration failed. Please try again.');
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-base-100 text-base-content flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold bg-linear-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent mb-2">
            BACKRANK
          </h1>
          <p className="text-base-content/70">Algorithmic Trading Platform</p>
        </div>

        {/* Register Card */}
        <div className="bg-base-200 border border-base-300 rounded-xl shadow-xl overflow-hidden">
          <div className="bg-base-300/50 px-6 py-4 border-b border-base-300">
            <h2 className="text-lg font-semibold text-white">Create Account</h2>
          </div>

          <form onSubmit={handleRegister} className="p-6 space-y-4">
            {/* Username Input */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-base-content mb-2">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-base-content/60" size={18} />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="john_doe"
                  className="w-full bg-base-300 border border-base-300 rounded-lg pl-10 pr-4 py-2.5 text-base-content placeholder-base-content/50 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-colors"
                />
              </div>
            </div>

            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-base-content mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-base-content/60" size={18} />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-base-300 border border-base-300 rounded-lg pl-10 pr-4 py-2.5 text-base-content placeholder-base-content/50 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-colors"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-base-content mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-base-content/60" size={18} />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-base-300 border border-base-300 rounded-lg pl-10 pr-4 py-2.5 text-base-content placeholder-base-content/50 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-colors"
                />
              </div>
              <p className="text-xs text-base-content/60 mt-1">At least 8 characters</p>
            </div>

            {/* Confirm Password Input */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-base-content mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-base-content/60" size={18} />
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-base-300 border border-base-300 rounded-lg pl-10 pr-4 py-2.5 text-base-content placeholder-base-content/50 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-colors"
                />
              </div>
            </div>

            {/* Error Message */}
            {(error || apiError) && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 text-red-300 text-sm">
                {error || apiError?.message}
              </div>
            )}

            {/* Register Button */}
            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold py-2.5 rounded-lg transition-all duration-200 mt-6"
            >
              {isPending ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          {/* Sign In Link */}
          <div className="bg-base-300/30 border-t border-base-300 px-6 py-4 text-center text-sm">
            <span className="text-base-content/70">Already have an account? </span>
            <button
              onClick={() => navigate('/login')}
              className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              Sign in
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
