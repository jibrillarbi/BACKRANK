import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import { useLogin } from '../api/useAuth';

export default function LoginPage() {
  const navigate = useNavigate();
  const { mutate: login, isPending, error: apiError } = useLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    login(
      { email, password },
      {
        onSuccess: () => {
          navigate('/');
        },
        onError: (err) => {
          setError(err.message || 'Login failed. Please try again.');
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold bg-linear-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent mb-2">
            BACKRANK
          </h1>
          <p className="text-gray-400">Algorithmic Trading Platform</p>
        </div>

        {/* Login Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-xl overflow-hidden">
          <div className="bg-gray-800/50 px-6 py-4 border-b border-gray-800">
            <h2 className="text-lg font-semibold text-white">Sign In</h2>
          </div>

          <form onSubmit={handleLogin} className="p-6 space-y-4">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-gray-500" size={18} />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-colors"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-500" size={18} />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-colors"
                />
              </div>
            </div>

            {/* Error Message */}
            {(error || apiError) && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 text-red-300 text-sm">
                {error || apiError?.message}
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold py-2.5 rounded-lg transition-all duration-200 mt-6"
            >
              {isPending ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="bg-gray-800/30 border-t border-gray-800 px-6 py-4 text-center text-sm">
            <span className="text-gray-400">Don't have an account? </span>
            <button
              onClick={() => navigate('/register')}
              className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              Sign up
            </button>
          </div>
        </div>


      </div>
    </div>
  );
}
