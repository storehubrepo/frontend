'use client';

import { useEffect, useState } from 'react';
import { itemsApi, recipesApi } from '@/lib/api/items';
import { stockMovementsApi } from '@/lib/api/stock-movements';
import { analyticsApi } from '@/lib/api/analytics';
import { getAuthToken } from '@/lib/auth';
import Link from 'next/link';
import theme from '@/styles/theme';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalItems: 0,
    totalRecipes: 0,
    recentMovements: 0,
    lowStockItems: 0,
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const [items, movements] = await Promise.all([
        itemsApi.getAll(token),
        stockMovementsApi.getAll(token),
      ]);

      const lowStock = items.filter((item: any) => item.stockQuantity < 10);

      // Count recipes from items
      const recipeCount = items.reduce((count: number, item: any) => {
        return count + (item.recipes?.length || 0);
      }, 0);

      setStats({
        totalItems: items.length,
        totalRecipes: recipeCount,
        recentMovements: movements.slice(0, 5).length,
        lowStockItems: lowStock.length,
      });

      setRecentActivity(movements.slice(0, 5));
      setLoading(false);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl animate-pulse" style={{ color: theme.colors.text.secondary }}>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8" style={{ background: theme.colors.background.secondary }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ color: theme.colors.text.primary }}>
            My Dashboard
          </h1>
          <p style={{ color: theme.colors.text.secondary }}>
            Overview of your inventory system
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div
            className="rounded-xl p-6"
            style={{
              background: theme.colors.background.card,
              border: `1px solid ${theme.colors.border}`,
              boxShadow: theme.shadows.sm,
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="text-3xl">📦</div>
              <div
                className="px-3 py-1 rounded-full text-sm font-semibold"
                style={{ backgroundColor: `${theme.colors.accent.blue}33`, color: theme.colors.accent.blue }}
              >
                Items
              </div>
            </div>
            <div className="text-3xl font-bold mb-1" style={{ color: theme.colors.text.primary }}>
              {stats.totalItems}
            </div>
            <div style={{ color: theme.colors.text.secondary }}>Total Items</div>
          </div>

          <div
            className="rounded-xl p-6"
            style={{
              background: theme.colors.background.card,
              border: `1px solid ${theme.colors.border}`,
              boxShadow: theme.shadows.sm,
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="text-3xl">🧪</div>
              <div
                className="px-3 py-1 rounded-full text-sm font-semibold"
                style={{ backgroundColor: `${theme.colors.accent.purple}33`, color: theme.colors.accent.purple }}
              >
                Recipes
              </div>
            </div>
            <div className="text-3xl font-bold mb-1" style={{ color: theme.colors.text.primary }}>
              {stats.totalRecipes}
            </div>
            <div style={{ color: theme.colors.text.secondary }}>Total Recipes</div>
          </div>

          <div
            className="rounded-xl p-6"
            style={{
              background: theme.colors.background.card,
              border: `1px solid ${theme.colors.border}`,
              boxShadow: theme.shadows.sm,
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="text-3xl">📊</div>
              <div
                className="px-3 py-1 rounded-full text-sm font-semibold"
                style={{ backgroundColor: `${theme.colors.accent.green}33`, color: theme.colors.accent.green }}
              >
                Movements
              </div>
            </div>
            <div className="text-3xl font-bold mb-1" style={{ color: theme.colors.text.primary }}>
              {stats.recentMovements}
            </div>
            <div style={{ color: theme.colors.text.secondary }}>Recent Movements</div>
          </div>

          <div
            className="rounded-xl p-6"
            style={{
              background: theme.colors.background.card,
              border: `1px solid ${theme.colors.border}`,
              boxShadow: theme.shadows.sm,
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="text-3xl">⚠️</div>
              <div
                className="px-3 py-1 rounded-full text-sm font-semibold"
                style={{ backgroundColor: `${theme.colors.accent.red}33`, color: theme.colors.accent.red }}
              >
                Alert
              </div>
            </div>
            <div className="text-3xl font-bold mb-1" style={{ color: theme.colors.text.primary }}>
              {stats.lowStockItems}
            </div>
            <div style={{ color: theme.colors.text.secondary }}>Low Stock Items</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div
          className="rounded-xl p-6 mb-8"
          style={{
            background: theme.colors.background.card,
            border: `1px solid ${theme.colors.border}`,
            boxShadow: theme.shadows.sm,
          }}
        >
          <h2 className="text-xl font-bold mb-4" style={{ color: theme.colors.text.primary }}>
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/dashboard/items/new"
              className="flex items-center gap-3 p-4 rounded-lg hover:scale-105 transition-transform"
              style={{ backgroundColor: `${theme.colors.accent.blue}33`, border: `1px solid ${theme.colors.accent.blue}` }}
            >
              <div className="text-2xl">➕</div>
              <div>
                <div className="font-semibold" style={{ color: theme.colors.text.primary }}>
                  Add New Item
                </div>
                <div className="text-sm" style={{ color: theme.colors.text.secondary }}>
                  Create raw material or product
                </div>
              </div>
            </Link>

            <Link
              href="/dashboard/stock"
              className="flex items-center gap-3 p-4 rounded-lg hover:scale-105 transition-transform"
              style={{ backgroundColor: `${theme.colors.accent.green}33`, border: `1px solid ${theme.colors.accent.green}` }}
            >
              <div className="text-2xl">📦</div>
              <div>
                <div className="font-semibold" style={{ color: theme.colors.text.primary }}>
                  Record Movement
                </div>
                <div className="text-sm" style={{ color: theme.colors.text.secondary }}>
                  Track stock changes
                </div>
              </div>
            </Link>

            <Link
              href="/dashboard/analytics"
              className="flex items-center gap-3 p-4 rounded-lg hover:scale-105 transition-transform"
              style={{ backgroundColor: `${theme.colors.accent.purple}33`, border: `1px solid ${theme.colors.accent.purple}` }}
            >
              <div className="text-2xl">📈</div>
              <div>
                <div className="font-semibold" style={{ color: theme.colors.text.primary }}>
                  View Analytics
                </div>
                <div className="text-sm" style={{ color: theme.colors.text.secondary }}>
                  Check performance
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div
          className="rounded-xl p-6"
          style={{
            background: theme.colors.background.card,
            border: `1px solid ${theme.colors.border}`,
            boxShadow: theme.shadows.sm,
          }}
        >
          <h2 className="text-xl font-bold mb-4" style={{ color: theme.colors.text.primary }}>
            Recent Activity
          </h2>
          {recentActivity.length === 0 ? (
            <div className="text-center py-8" style={{ color: theme.colors.text.secondary }}>
              No recent activity
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((activity: any) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-4 rounded-lg"
                  style={{ background: theme.colors.background.secondary }}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-2xl">
                      {activity.type === 'purchase' && '📥'}
                      {activity.type === 'sale' && '📤'}
                      {activity.type === 'production' && '🏭'}
                      {activity.type === 'waste' && '🗑️'}
                    </div>
                    <div>
                      <div className="font-semibold" style={{ color: theme.colors.text.primary }}>
                        {activity.item?.name || 'Unknown Item'}
                      </div>
                      <div className="text-sm" style={{ color: theme.colors.text.secondary }}>
                        {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)} • {activity.quantity} {activity.item?.unit}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold" style={{ color: theme.colors.text.primary }}>
                      ${((activity.quantity * activity.unitCost) || 0).toFixed(2)}
                    </div>
                    <div className="text-sm" style={{ color: theme.colors.text.secondary }}>
                      {new Date(activity.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
