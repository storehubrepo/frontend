'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { authApi } from '@/lib/api/auth';
import { setAuthToken, setUser } from '@/lib/auth';

export const RegisterForm: React.FC = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setErrors({ confirmPassword: 'Passwords do not match' });
      return;
    }

    if (formData.password.length < 6) {
      setErrors({ password: 'Password must be at least 6 characters' });
      return;
    }

    setIsLoading(true);

    try {
      const response = await authApi.register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
      });
      
      // Auto-login after successful registration
      const loginResponse = await authApi.login({
        email: formData.email,
        password: formData.password,
      });
      
      setAuthToken(loginResponse.access_token);
      setUser(loginResponse.user);
      router.push('/dashboard');
    } catch (error: any) {
      setErrors({ submit: error.message || 'Registration failed' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative mx-auto z-10" style={{ maxWidth: '400px' }}>
      {/* Phone-like Container */}
      <div className="relative bg-white rounded-3xl p-4 shadow-2xl transform hover:scale-105 transition-transform duration-500">
        {/* Screen */}
        <div className="bg-black rounded-2xl overflow-hidden relative p-8" style={{ minHeight: '700px' }}>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
              <p className="text-gray-400 text-sm">Join StoreHub today</p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                    className="w-full h-11 bg-gray-900 border border-gray-800 rounded-xl px-4 text-white placeholder-gray-600 focus:outline-none focus:border-white transition-colors"
                  />
                  {errors.firstName && (
                    <p className="text-xs text-red-400 mt-1">{errors.firstName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                    className="w-full h-11 bg-gray-900 border border-gray-800 rounded-xl px-4 text-white placeholder-gray-600 focus:outline-none focus:border-white transition-colors"
                  />
                  {errors.lastName && (
                    <p className="text-xs text-red-400 mt-1">{errors.lastName}</p>
                  )}
                </div>
              </div>

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
                  className="w-full h-11 bg-gray-900 border border-gray-800 rounded-xl px-4 text-white placeholder-gray-600 focus:outline-none focus:border-white transition-colors"
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
                  className="w-full h-11 bg-gray-900 border border-gray-800 rounded-xl px-4 text-white placeholder-gray-600 focus:outline-none focus:border-white transition-colors"
                />
                {errors.password && (
                  <p className="text-xs text-red-400 mt-1">{errors.password}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  className="w-full h-11 bg-gray-900 border border-gray-800 rounded-xl px-4 text-white placeholder-gray-600 focus:outline-none focus:border-white transition-colors"
                />
                {errors.confirmPassword && (
                  <p className="text-xs text-red-400 mt-1">{errors.confirmPassword}</p>
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
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>

            <p className="text-center text-sm text-gray-500 pt-2">
              Already have an account?{' '}
              <a href="/login" className="text-white font-medium hover:underline">
                Sign in
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
