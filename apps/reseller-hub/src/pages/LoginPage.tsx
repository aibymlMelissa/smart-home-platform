import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Mail, Lock, AlertCircle } from 'lucide-react';
import { useResellerStore } from '../stores/resellerStore';
import { authApi, resellerApi } from '../services/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useResellerStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await authApi.login(email, password);
      const { user, tokens } = response.data.data;

      // Check if user is a reseller
      if (user.userType !== 'reseller') {
        setError('Access denied. This portal is for reseller accounts only.');
        return;
      }

      // Fetch the reseller company linked to this user
      if (!user.resellerId) {
        setError('Your account is not linked to a reseller company.');
        return;
      }

      // Store token BEFORE fetching reseller (so the interceptor can use it)
      localStorage.setItem('accessToken', tokens.accessToken);

      const resellerResponse = await resellerApi.getById(user.resellerId);
      const reseller = resellerResponse.data.data;

      login(user, tokens.accessToken, reseller);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-primary-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Reseller Hub</h1>
          <p className="text-slate-300">Smart Home Platform Partner Portal</p>
        </div>

        {/* Login Form */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
          {error && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="you@company.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 p-4 bg-primary-500/10 border border-primary-500/30 rounded-lg">
            <p className="text-sm font-medium text-primary-300 mb-2">Demo Reseller Account</p>
            <div className="text-sm text-slate-300 space-y-1">
              <p>Email: <code className="bg-white/10 px-2 py-0.5 rounded text-white">demo@product.com</code></p>
              <p>Password: <code className="bg-white/10 px-2 py-0.5 rounded text-white">product123</code></p>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-slate-400">
          Reseller Hub - Smart Home Platform
        </p>
      </div>
    </div>
  );
}
