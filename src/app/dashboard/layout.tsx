'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getAuthToken, logout } from '@/lib/auth';
import Link from 'next/link';
import theme from '@/styles/theme';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: '🏠' },
    { name: 'My Items', path: '/dashboard/items', icon: '📦' },
    { name: 'Stock', path: '/dashboard/stock', icon: '📊' },
    { name: 'Expenses', path: '/dashboard/expenses', icon: '💸' },
    { name: 'POS', path: '/dashboard/pos', icon: '💳' },
    { name: 'Cost Analysis', path: '/dashboard/cost-analysis', icon: '💰' },
    { name: 'Sales Analytics', path: '/dashboard/sales-analytics', icon: '📈' },
    { name: 'Analytics', path: '/dashboard/analytics', icon: '📊' },
    { name: 'Reports', path: '/dashboard/reports', icon: '📄' },
  ];

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-black text-white p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">StoreHub</h1>
            <p className="text-xs text-gray-300">My Inventory</p>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        style={{ background: theme.colors.gradients.dark }}
        className={`fixed left-0 top-0 h-full w-64 text-white p-6 z-50 transition-transform duration-300 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="mb-10 mt-0 lg:mt-0">
          <h1 className="text-2xl font-bold mb-1">StoreHub</h1>
          <p className="text-sm text-black">My Inventory</p>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.path || pathname?.startsWith(item.path + '/');
            return (
              <Link
                key={item.path}
                href={item.path}
                style={{
                  background: isActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                  borderLeft: isActive ? `4px solid ${theme.colors.accent.blue}` : '4px solid transparent',
                }}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-all"
              >
                <span className="text-2xl">{item.icon}</span>
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <button
          onClick={handleLogout}
          className="absolute bottom-6 left-6 right-6 flex items-center justify-center gap-2 px-4 py-3 bg-red-500 hover:bg-red-600 rounded-lg transition-colors font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 pt-16 lg:pt-0">
        {children}
      </main>
    </div>
  );
}
