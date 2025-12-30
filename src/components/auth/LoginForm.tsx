'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { authApi } from '@/lib/api/auth';
import { setAuthToken, setUser } from '@/lib/auth';

export const LoginForm: React.FC = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    try {
      const response = await authApi.login(formData);
      setAuthToken(response.access_token);
      setUser(response.user);
      router.push('/dashboard');
    } catch (error: any) {
      setErrors({ submit: error.message || 'Login failed' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative mx-auto z-10" style={{ maxWidth: '380px' }}>
      {/* Phone-like Container */}
      <div className="relative bg-white rounded-3xl p-4 shadow-2xl transform hover:scale-105 transition-transform duration-500">
        {/* Screen */}
        <div className="bg-black rounded-2xl overflow-hidden relative p-8" style={{ minHeight: '600px' }}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
              <p className="text-gray-400 text-sm">Sign in to continue</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full h-12 bg-gray-900 border border-gray-800 rounded-xl px-4 text-white placeholder-gray-600 focus:outline-none focus:border-white transition-colors"
                />
                {errors.email && (
                  <p className="text-xs text-red-400 mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="w-full h-12 bg-gray-900 border border-gray-800 rounded-xl px-4 text-white placeholder-gray-600 focus:outline-none focus:border-white transition-colors"
                />
                {errors.password && (
                  <p className="text-xs text-red-400 mt-1">{errors.password}</p>
                )}
              </div>
            </div>

            {errors.submit && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-sm text-red-400">{errors.submit}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-white text-black font-semibold rounded-xl hover:bg-gray-100 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>

            <p className="text-center text-sm text-gray-500 pt-4">
              Don't have an account?{' '}
              <a href="/register" className="text-white font-medium hover:underline">
                Sign up
              </a>
            </p>
          </form>
        </div>
      </div>

      {/* Glow Effect */}
      <div className="absolute inset-0 bg-white/20 rounded-3xl blur-2xl -z-10 animate-pulse-slow"></div>

      <style jsx>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};
