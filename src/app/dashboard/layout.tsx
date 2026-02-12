'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getAuthToken, logout } from '@/lib/auth';
import Link from 'next/link';
import theme from '@/styles/theme';
import { CurrencyToggle } from '@/components/ui/CurrencyToggle';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.push('/login');
      return;
    }
    
    // Check localStorage first for instant redirect
    const storedRole = localStorage.getItem('userRole');
    if (storedRole === 'child' && pathname !== '/dashboard/pos' && pathname !== '/dashboard/profile') {
      router.replace('/dashboard/pos');
      return;
    }
    
    fetchUserRole();
  }, [router, pathname]);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const fetchUserRole = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        // Unauthorized - clear auth and redirect to login
        localStorage.clear();
        router.push('/login');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setUserRole(data.role);
        
        // Update localStorage with fresh role
        localStorage.setItem('userRole', data.role);
        
        // Redirect child users to POS if they try to access any other page
        if (data.role === 'child' && pathname !== '/dashboard/pos' && pathname !== '/dashboard/profile') {
          router.replace('/dashboard/pos');
          return; // Don't set isLoading to false, keep splash screen during redirect
        }
        
        setIsLoading(false);
      } else {
        // Other errors - redirect to login
        localStorage.clear();
        router.push('/login');
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
      localStorage.clear();
      router.push('/login');
    }
  };

  const allNavItems = [
    { name: 'Dashboard', path: '/dashboard', icon: '🏠', roles: ['parent', 'admin'] },
    { name: 'My Items', path: '/dashboard/items', icon: '📦', roles: ['parent', 'admin'] },
    { name: 'Stock', path: '/dashboard/stock', icon: '📊', roles: ['parent', 'admin'] },
    { name: 'Expenses', path: '/dashboard/expenses', icon: '💸', roles: ['parent', 'admin'] },
    { name: 'POS', path: '/dashboard/pos', icon: '💳', roles: ['parent', 'admin', 'child'] },
    { name: 'Customers', path: '/dashboard/customers', icon: '👥', roles: ['parent', 'admin'] },
    { name: 'Cost Analysis', path: '/dashboard/cost-analysis', icon: '💰', roles: ['parent', 'admin'] },
    { name: 'Sales Analytics', path: '/dashboard/sales-analytics', icon: '📈', roles: ['parent', 'admin'] },
    { name: 'Analytics', path: '/dashboard/analytics', icon: '📊', roles: ['parent', 'admin'] },
    { name: 'Reports', path: '/dashboard/reports', icon: '📄', roles: ['parent', 'admin'] },
    { name: 'Users', path: '/dashboard/users', icon: '👥', roles: ['parent', 'admin'] },
    { name: 'Profile', path: '/dashboard/profile', icon: '👤', roles: ['parent', 'admin', 'child'] },
  ];

  // Filter nav items based on user role
  const navItems = userRole 
    ? allNavItems.filter(item => item.roles.includes(userRole))
    : [];

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Show splash screen while loading user role
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-8">
            <h1 className="text-5xl font-bold text-white mb-2">StoreHub</h1>
            <p className="text-gray-400 text-lg">Loading your workspace...</p>
          </div>
          <div className="flex justify-center items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    );
  }

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
          {userRole && (
            <p className="text-xs text-gray-300 mt-1 capitalize">
              {userRole === 'child' ? 'Child Account' : `${userRole} User`}
            </p>
          )}
        </div>

        <div className="mb-6">
          <CurrencyToggle />
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
