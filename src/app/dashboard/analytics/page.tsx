'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { analyticsApi, AnalyticsSummary } from '@/lib/api/analytics';
import { getAuthToken } from '@/lib/auth';
import { expensesApi } from '@/lib/api/expenses';
import theme from '@/styles/theme';

export default function AnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [includeExpenses, setIncludeExpenses] = useState(true);
  const [expenseTypes, setExpenseTypes] = useState<string[]>([]);
  const [excludedExpenseTypes, setExcludedExpenseTypes] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadExpenseTypes();
  }, []);

  useEffect(() => {
    loadData();
  }, [includeExpenses, excludedExpenseTypes]);

  useEffect(() => {
    loadExpenseTypes();
  }, []);

  useEffect(() => {
    loadData();
  }, [includeExpenses, excludedExpenseTypes]);

  const loadExpenseTypes = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const types = await expensesApi.getTypes(token);
      setExpenseTypes(types);
    } catch (error) {
      console.error('Failed to load expense types:', error);
    }
  };

  const loadData = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        router.push('/login');
        return;
      }

      const summary = await analyticsApi.getSummary(
        token,
        includeExpenses,
        excludedExpenseTypes
      );
      setData(summary);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpenseType = (type: string) => {
    setExcludedExpenseTypes((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type]
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p style={{ color: theme.colors.text.secondary }}>Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ color: theme.colors.text.primary }}>Analytics Dashboard</h1>
          <p style={{ color: theme.colors.text.secondary }}>Comprehensive insights into your business performance</p>
        </div>

        {/* Expense Filters */}
        <div className="bg-white rounded-2xl p-6 shadow-xl mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold" style={{ color: theme.colors.text.primary }}>
              Expense Settings
            </h2>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={includeExpenses}
                onChange={(e) => setIncludeExpenses(e.target.checked)}
                className="mr-3 w-5 h-5 rounded border-gray-300 text-black focus:ring-black"
              />
              <div>
                <span className="text-sm font-medium text-gray-900">
                  Include Operating Expenses
                </span>
                <p className="text-xs text-gray-500">
                  Include recurring expenses in profit calculations
                </p>
              </div>
            </label>
          </div>

          {showFilters && expenseTypes.length > 0 && (
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-3">
                Exclude specific expense types:
              </p>
              <div className="flex flex-wrap gap-2">
                {expenseTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => toggleExpenseType(type)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      excludedExpenseTypes.includes(type)
                        ? 'bg-gray-200 text-gray-500 line-through'
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="text-3xl">📊</div>
              <svg className="w-8 h-8 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
            </div>
            <h3 className="text-sm opacity-90 mb-1">Total Items</h3>
            <p className="text-4xl font-bold">{data.totalItems}</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="text-3xl">💰</div>
              <svg className="w-8 h-8 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-sm opacity-90 mb-1">Stock Value</h3>
            <p className="text-4xl font-bold">${data.totalStockValue.toFixed(0)}</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="text-3xl">📈</div>
              <svg className="w-8 h-8 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h3 className="text-sm opacity-90 mb-1">Net Profit</h3>
            <p className="text-4xl font-bold">${data.netProfit.toFixed(0)}</p>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="text-3xl">⚠️</div>
              <svg className="w-8 h-8 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-sm opacity-90 mb-1">Low Stock Items</h3>
            <p className="text-4xl font-bold">{data.lowStockItems}</p>
          </div>
        </div>

        {/* Revenue Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-xl">
            <h2 className="text-2xl font-bold mb-6" style={{ color: theme.colors.text.primary }}>Revenue Overview</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                <span style={{ color: theme.colors.text.secondary }}>Total Revenue</span>
                <span className="text-2xl font-bold text-green-600">${data.totalRevenue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                <span style={{ color: theme.colors.text.secondary }}>Total Costs</span>
                <span className="text-2xl font-bold text-red-600">${data.totalCosts.toFixed(2)}</span>
              </div>
              {data.operatingExpenses !== undefined && (
                <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <span style={{ color: theme.colors.text.secondary }}>Operating Expenses</span>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                      This Month
                    </span>
                  </div>
                  <span className="text-2xl font-bold text-orange-600">${data.operatingExpenses.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                <span style={{ color: theme.colors.text.secondary }}>Net Profit</span>
                <span className="text-2xl font-bold text-purple-600">${data.netProfit.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span style={{ color: theme.colors.text.secondary }}>Profit Margin</span>
                <span className="text-2xl font-bold text-blue-600">{data.profitMargin.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-xl">
            <h2 className="text-2xl font-bold mb-6" style={{ color: theme.colors.text.primary }}>Top Selling Items</h2>
            <div className="space-y-3">
              {data.topSellingItems.length === 0 ? (
                <p style={{ color: theme.colors.text.secondary }} className="text-center py-8">No sales data yet</p>
              ) : (
                data.topSellingItems.map((item, index) => (
                  <div key={item.itemId} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                    <div 
                      style={{ background: theme.colors.primary.black }}
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold" style={{ color: theme.colors.text.primary }}>{item.itemName}</p>
                      <p className="text-sm" style={{ color: theme.colors.text.secondary }}>{item.totalSold.toFixed(0)} units sold</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Cost Breakdown Table */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold" style={{ color: theme.colors.text.primary }}>Cost Breakdown by Product</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: theme.colors.text.secondary }}>Product</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: theme.colors.text.secondary }}>Material Cost</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: theme.colors.text.secondary }}>Labor Cost</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: theme.colors.text.secondary }}>Utilities</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: theme.colors.text.secondary }}>Total Cost</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: theme.colors.text.secondary }}>Selling Price</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: theme.colors.text.secondary }}>Profit</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: theme.colors.text.secondary }}>Margin %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.costBreakdown.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center" style={{ color: theme.colors.text.secondary }}>
                      No manufactured products yet
                    </td>
                  </tr>
                ) : (
                  data.costBreakdown.map((item) => (
                    <tr key={item.itemId} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium" style={{ color: theme.colors.text.primary }}>{item.itemName}</td>
                      <td className="px-6 py-4" style={{ color: theme.colors.text.secondary }}>${item.materialCost.toFixed(2)}</td>
                      <td className="px-6 py-4" style={{ color: theme.colors.text.secondary }}>${item.laborCost.toFixed(2)}</td>
                      <td className="px-6 py-4" style={{ color: theme.colors.text.secondary }}>${item.utilitiesCost.toFixed(2)}</td>
                      <td className="px-6 py-4 font-semibold" style={{ color: theme.colors.text.primary }}>${item.totalCost.toFixed(2)}</td>
                      <td className="px-6 py-4" style={{ color: theme.colors.text.secondary }}>${item.sellingPrice.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span style={{
                          color: item.profitMargin >= 0 ? theme.colors.accent.green : theme.colors.accent.red
                        }} className="font-semibold">
                          ${item.profitMargin.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span style={{
                          background: item.profitPercentage >= 20 
                            ? theme.colors.accent.green + '20'
                            : item.profitPercentage >= 10
                            ? theme.colors.accent.yellow + '20'
                            : theme.colors.accent.red + '20',
                          color: item.profitPercentage >= 20
                            ? theme.colors.accent.green
                            : item.profitPercentage >= 10
                            ? theme.colors.accent.yellow
                            : theme.colors.accent.red,
                        }} className="px-3 py-1 rounded-full text-sm font-medium">
                          {item.profitPercentage.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
