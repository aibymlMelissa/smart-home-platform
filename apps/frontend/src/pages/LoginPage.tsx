import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { HeartHandshake, Mail, Lock, AlertCircle, UserCircle, Phone } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { apiService } from '../services/api';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Please enter your password'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGuestLoading, setIsGuestLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      setError('');

      const response = await apiService.login(data.email, data.password);

      if (response.success) {
        const { user, tokens } = response.data;
        login(user, tokens.accessToken, tokens.refreshToken);
        navigate('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your details and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    try {
      setIsGuestLoading(true);
      setError('');

      const response = await apiService.guestLogin();

      if (response.success) {
        const { user, tokens } = response.data;
        login(user, tokens.accessToken, tokens.refreshToken);
        navigate('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not start demo. Please try again.');
    } finally {
      setIsGuestLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-rose-500 rounded-2xl mb-4">
            <HeartHandshake className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">SafeHome</h1>
          <p className="text-xl text-gray-300">Welcome back</p>
        </div>

        {/* Login Form */}
        <div className="bg-slate-800/50 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-slate-700">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-200 text-base">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-lg font-medium text-gray-200 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" />
                <input
                  {...register('email')}
                  type="email"
                  id="email"
                  className="w-full pl-14 pr-4 py-4 bg-slate-700/50 border border-slate-600 rounded-xl text-white text-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  placeholder="you@example.com"
                />
              </div>
              {errors.email && (
                <p className="mt-2 text-base text-red-400">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-lg font-medium text-gray-200 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" />
                <input
                  {...register('password')}
                  type="password"
                  id="password"
                  className="w-full pl-14 pr-4 py-4 bg-slate-700/50 border border-slate-600 rounded-xl text-white text-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>
              {errors.password && (
                <p className="mt-2 text-base text-red-400">{errors.password.message}</p>
              )}
            </div>

            {/* Forgot Password */}
            <div className="text-right">
              <Link
                to="/forgot-password"
                className="text-base text-rose-400 hover:text-rose-300 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-rose-500 hover:bg-rose-600 active:bg-rose-700 text-white text-xl font-bold rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-600"></div>
            </div>
            <div className="relative flex justify-center text-base">
              <span className="px-4 bg-slate-800/50 text-gray-400">or</span>
            </div>
          </div>

          {/* Guest Access */}
          <button
            type="button"
            onClick={handleGuestLogin}
            disabled={isGuestLoading}
            className="w-full flex items-center justify-center gap-3 py-4 bg-green-600 hover:bg-green-700 text-white text-xl font-bold rounded-xl transition-colors disabled:opacity-50"
          >
            <UserCircle className="w-6 h-6" />
            {isGuestLoading ? 'Loading...' : 'Try Demo'}
          </button>
          <p className="text-center text-gray-400 text-base mt-3">
            Explore SafeHome without an account
          </p>

          {/* Sign Up Link */}
          <div className="mt-8 text-center">
            <p className="text-gray-300 text-lg">
              New to SafeHome?{' '}
              <Link to="/signup" className="text-rose-400 hover:text-rose-300 font-semibold transition-colors">
                Create account
              </Link>
            </p>
          </div>

          {/* Back to Welcome */}
          <div className="mt-4 text-center">
            <Link to="/welcome" className="text-base text-gray-400 hover:text-white transition-colors">
              ← Back to Home Page
            </Link>
          </div>
        </div>

        {/* Help */}
        <div className="mt-8 text-center">
          <p className="text-gray-400 text-base mb-2">Need help signing in?</p>
          <a
            href="tel:1800723466"
            className="inline-flex items-center gap-2 text-rose-400 hover:text-rose-300 text-lg font-medium transition-colors"
          >
            <Phone className="w-5 h-5" />
            Call 1800 SAFE HOME
          </a>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-sm text-gray-500">
          © 2026 SafeHome. Supporting independent living in Melbourne.
        </p>
      </div>
    </div>
  );
}
