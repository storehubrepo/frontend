'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { getAuthToken } from '@/lib/auth';

export default function Home() {
  const router = useRouter();
  const [showSplash, setShowSplash] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const token = getAuthToken();
    if (token) {
      router.push('/dashboard');
      return;
    }

    // Show splash screen for 2 seconds
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => setShowSplash(false), 500);
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

  if (showSplash) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center bg-black transition-opacity duration-500 ${
          fadeOut ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <div className="text-center">
          <div className="mb-8 animate-pulse">
            <div className="w-20 h-20 mx-auto mb-4 bg-white rounded-2xl flex items-center justify-center">
              <svg
                className="w-12 h-12 text-black"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
          </div>
          <h1 className="text-5xl font-bold text-white mb-2">StoreHub</h1>
          <p className="text-gray-400 text-lg">Manage your store with ease</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black p-4 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-white/5 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-float-delayed"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-white/3 rounded-full blur-3xl animate-pulse-slow"></div>
      </div>

      <div className="max-w-6xl w-full relative z-10">
        {/* Logo */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="w-16 h-16 mx-auto mb-4 bg-white rounded-2xl flex items-center justify-center shadow-2xl animate-bounce-slow">
            <svg
              className="w-10 h-10 text-black"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
          </div>
          <h1 className="text-5xl font-bold mb-3 text-white">Welcome to StoreHub</h1>
          <p className="text-xl text-gray-400">
            Manage everything in one place
          </p>
        </div>

        {/* Phone Mockups */}
        <div className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto">
          {/* Create Account Phone */}
          <div className="animate-slide-up">
            <div className="relative mx-auto" style={{ maxWidth: '280px' }}>
              {/* Phone Frame */}
              <div className="relative bg-white rounded-[3rem] p-3 shadow-2xl transform hover:scale-105 transition-transform duration-500">
                {/* Notch */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-white rounded-b-2xl z-10"></div>
                
                {/* Screen */}
                <div className="bg-black rounded-[2.5rem] overflow-hidden relative" style={{ height: '580px' }}>
                  {/* Status Bar */}
                  <div className="flex justify-between items-center px-6 pt-8 pb-4">
                    <span className="text-white text-xs font-semibold">9:41</span>
                    <div className="flex gap-1">
                      <div className="w-1 h-1 bg-white rounded-full animate-pulse"></div>
                      <div className="w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="px-8 pt-8 animate-fade-in-delayed">
                    <div className="mb-8">
                      <h2 className="text-3xl font-bold text-white mb-2">Create Account</h2>
                      <p className="text-gray-400 text-sm">Join StoreHub today</p>
                    </div>

                    {/* Form Fields Preview */}
                    <div className="space-y-4 mb-8">
                      <div className="h-12 bg-gray-900 rounded-xl border border-gray-800 flex items-center px-4">
                        <span className="text-gray-600 text-sm">Full Name</span>
                      </div>
                      <div className="h-12 bg-gray-900 rounded-xl border border-gray-800 flex items-center px-4">
                        <span className="text-gray-600 text-sm">Email Address</span>
                      </div>
                      <div className="h-12 bg-gray-900 rounded-xl border border-gray-800 flex items-center px-4">
                        <span className="text-gray-600 text-sm">Password</span>
                      </div>
                    </div>

                    <button
                      onClick={() => router.push('/register')}
                      className="w-full h-12 bg-white text-black font-semibold rounded-xl hover:bg-gray-100 transition-colors shadow-lg"
                    >
                      Sign Up Now
                    </button>

                    <p className="text-center text-gray-600 text-xs mt-6">
                      Start your journey with us
                    </p>
                  </div>
                </div>
              </div>

              {/* Glow Effect */}
              <div className="absolute inset-0 bg-white/20 rounded-[3rem] blur-2xl -z-10 animate-pulse-slow"></div>
            </div>
          </div>

          {/* Sign In Phone */}
          <div className="animate-slide-up-delayed">
            <div className="relative mx-auto" style={{ maxWidth: '280px' }}>
              {/* Phone Frame */}
              <div className="relative bg-white rounded-[3rem] p-3 shadow-2xl transform hover:scale-105 transition-transform duration-500">
                {/* Notch */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-white rounded-b-2xl z-10"></div>
                
                {/* Screen */}
                <div className="bg-black rounded-[2.5rem] overflow-hidden relative" style={{ height: '580px' }}>
                  {/* Status Bar */}
                  <div className="flex justify-between items-center px-6 pt-8 pb-4">
                    <span className="text-white text-xs font-semibold">9:41</span>
                    <div className="flex gap-1">
                      <div className="w-1 h-1 bg-white rounded-full animate-pulse"></div>
                      <div className="w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="px-8 pt-8 animate-fade-in-delayed">
                    <div className="mb-8">
                      <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
                      <p className="text-gray-400 text-sm">Sign in to continue</p>
                    </div>

                    {/* Form Fields Preview */}
                    <div className="space-y-4 mb-8">
                      <div className="h-12 bg-gray-900 rounded-xl border border-gray-800 flex items-center px-4">
                        <span className="text-gray-600 text-sm">Email Address</span>
                      </div>
                      <div className="h-12 bg-gray-900 rounded-xl border border-gray-800 flex items-center px-4">
                        <span className="text-gray-600 text-sm">Password</span>
                      </div>
                    </div>

                    <button
                      onClick={() => router.push('/login')}
                      className="w-full h-12 bg-white text-black font-semibold rounded-xl hover:bg-gray-100 transition-colors shadow-lg"
                    >
                      Sign In
                    </button>

                    <p className="text-center text-gray-600 text-xs mt-6">
                      Already a member? Continue here
                    </p>
                  </div>
                </div>
              </div>

              {/* Glow Effect */}
              <div className="absolute inset-0 bg-white/20 rounded-[3rem] blur-2xl -z-10 animate-pulse-slow"></div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-16 animate-fade-in">
          StoreHub © 2025 - All rights reserved
        </p>
      </div>

      <style jsx global>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fade-in-delayed {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-up-delayed {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(30px, -30px) scale(1.1);
          }
        }

        @keyframes float-delayed {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(-30px, 30px) scale(1.1);
          }
        }

        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes pulse-slow {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.6;
          }
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }

        .animate-fade-in-delayed {
          animation: fade-in-delayed 0.6s ease-out 0.3s both;
        }

        .animate-slide-up {
          animation: slide-up 0.8s ease-out 0.3s both;
        }

        .animate-slide-up-delayed {
          animation: slide-up-delayed 0.8s ease-out 0.5s both;
        }

        .animate-float {
          animation: float 8s ease-in-out infinite;
        }

        .animate-float-delayed {
          animation: float-delayed 10s ease-in-out infinite;
        }

        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }

        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
