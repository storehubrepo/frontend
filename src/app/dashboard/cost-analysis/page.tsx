'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { itemsApi, Item, Recipe } from '@/lib/api/items';
import { getAuthToken } from '@/lib/auth';
import theme from '@/styles/theme';

interface CostBreakdown {
  itemId: string;
  itemName: string;
  category: string;
  materialCost: number;
  laborCost: number;
  utilitiesCost: number;
  totalCost: number;
  sellingPrice: number;
  profit: number;
  marginPercent: number;
  ingredients: {
    name: string;
    quantity: number;
    unit: string;
    costPerUnit: number;
    totalCost: number;
  }[];
}

type TimeFilter = 'all' | 'today' | 'week' | 'month' | 'year';
type ItemFilter = 'all' | string;

export default function CostAnalysisPage() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [costBreakdowns, setCostBreakdowns] = useState<CostBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [itemFilter, setItemFilter] = useState<ItemFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        router.push('/login');
        return;
      }

      const allItems = await itemsApi.getAll(token);
      setItems(allItems);

      // Extract unique categories
      const uniqueCategories = Array.from(
        new Set(allItems.filter(item => item.category).map(item => item.category))
      ) as string[];
      setCategories(uniqueCategories);

      // Calculate cost breakdowns for manufactured products
      const breakdowns = await calculateCostBreakdowns(allItems, token);
      setCostBreakdowns(breakdowns);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateCostBreakdowns = async (allItems: Item[], token: string): Promise<CostBreakdown[]> => {
    const manufacturedItems = allItems.filter(item => item.type === 'manufactured');
    const breakdowns: CostBreakdown[] = [];

    for (const item of manufacturedItems) {
      let materialCost = 0;
      const ingredients: CostBreakdown['ingredients'] = [];

      // Get recipes for this item
      if (item.recipes && item.recipes.length > 0) {
        for (const recipe of item.recipes) {
          const ingredient = allItems.find(i => i.id === recipe.childItemId);
          if (!ingredient) continue;

          // Calculate cost based on quantity needed
          const costPerUnit = ingredient.purchasePrice || 0;
          const quantityNeeded = recipe.quantityNeeded;
          
          // Unit conversion: if ingredient is in kg and recipe needs grams, convert
          let adjustedQuantity = quantityNeeded;
          if (ingredient.unit === 'kg' && quantityNeeded < 1) {
            // Recipe is probably in grams, keep as-is (quantityNeeded represents fraction of kg)
            adjustedQuantity = quantityNeeded;
          } else if (ingredient.unit === 'liter' && quantityNeeded < 1) {
            // Recipe is probably in ml, keep as-is
            adjustedQuantity = quantityNeeded;
          }

          const ingredientCost = costPerUnit * adjustedQuantity;
          materialCost += ingredientCost;

          ingredients.push({
            name: ingredient.name,
            quantity: quantityNeeded,
            unit: ingredient.unit,
            costPerUnit,
            totalCost: ingredientCost,
          });
        }
      }

      const laborCost = item.laborCost || 0;
      const utilitiesCost = item.utilitiesCost || 0;
      const totalCost = materialCost + laborCost + utilitiesCost;
      const sellingPrice = item.sellingPrice || 0;
      const profit = sellingPrice - totalCost;
      const marginPercent = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;

      breakdowns.push({
        itemId: item.id,
        itemName: item.name,
        category: item.category || 'Uncategorized',
        materialCost,
        laborCost,
        utilitiesCost,
        totalCost,
        sellingPrice,
        profit,
        marginPercent,
        ingredients,
      });
    }

    return breakdowns;
  };

  const getFilteredBreakdowns = () => {
    let filtered = costBreakdowns;

    // Filter by category
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(b => b.category === categoryFilter);
    }

    // Filter by specific item
    if (itemFilter !== 'all') {
      filtered = filtered.filter(b => b.itemId === itemFilter);
    }

    return filtered;
  };

  const getTotals = () => {
    const filtered = getFilteredBreakdowns();
    return {
      totalMaterialCost: filtered.reduce((sum, b) => sum + (b.materialCost || 0), 0),
      totalLaborCost: filtered.reduce((sum, b) => sum + (b.laborCost || 0), 0),
      totalUtilitiesCost: filtered.reduce((sum, b) => sum + (b.utilitiesCost || 0), 0),
      totalCost: filtered.reduce((sum, b) => sum + (b.totalCost || 0), 0),
      totalRevenue: filtered.reduce((sum, b) => sum + (b.sellingPrice || 0), 0),
      totalProfit: filtered.reduce((sum, b) => sum + (b.profit || 0), 0),
    };
  };

  const filteredBreakdowns = getFilteredBreakdowns();
  const totals = getTotals();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl animate-pulse" style={{ color: '#000000' }}>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ background: theme.colors.background.secondary }}>
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2" style={{ color: '#000000' }}>
            Cost Analysis & Breakdown
          </h1>
          <p className="text-sm sm:text-base" style={{ color: '#000000' }}>
            Detailed recipe-based cost calculations for all products
          </p>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 sm:mb-8">
          {/* Time Filter */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#000000' }}>
              Time Period
            </label>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
              className="w-full h-12 px-4 rounded-xl"
              style={{
                background: theme.colors.background.card,
                border: `2px solid ${theme.colors.border}`,
                color: '#000000',
              }}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#000000' }}>
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full h-12 px-4 rounded-xl"
              style={{
                background: theme.colors.background.card,
                border: `2px solid ${theme.colors.border}`,
                color: '#000000',
              }}
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Item Filter */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#000000' }}>
              Specific Item
            </label>
            <select
              value={itemFilter}
              onChange={(e) => setItemFilter(e.target.value)}
              className="w-full h-12 px-4 rounded-xl"
              style={{
                background: theme.colors.background.card,
                border: `2px solid ${theme.colors.border}`,
                color: '#000000',
              }}
            >
              <option value="all">All Items</option>
              {items.filter(i => i.type === 'manufactured').map(item => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div
            className="rounded-xl p-6"
            style={{
              background: theme.colors.background.card,
              border: `1px solid ${theme.colors.border}`,
              boxShadow: theme.shadows.sm,
            }}
          >
            <h3 className="text-sm font-semibold mb-2" style={{ color: '#000000' }}>
              Total Production Cost
            </h3>
            <p className="text-3xl font-bold" style={{ color: theme.colors.accent.red }}>
              ${totals.totalCost.toFixed(2)}
            </p>
            <div className="mt-3 space-y-1 text-sm" style={{ color: '#000000' }}>
              <div>Materials: ${totals.totalMaterialCost.toFixed(2)}</div>
              <div>Labor: ${totals.totalLaborCost.toFixed(2)}</div>
              <div>Utilities: ${totals.totalUtilitiesCost.toFixed(2)}</div>
            </div>
          </div>

          <div
            className="rounded-xl p-6"
            style={{
              background: theme.colors.background.card,
              border: `1px solid ${theme.colors.border}`,
              boxShadow: theme.shadows.sm,
            }}
          >
            <h3 className="text-sm font-semibold mb-2" style={{ color: '#000000' }}>
              Potential Revenue
            </h3>
            <p className="text-3xl font-bold" style={{ color: theme.colors.accent.blue }}>
              ${totals.totalRevenue.toFixed(2)}
            </p>
            <div className="mt-3 text-sm" style={{ color: '#000000' }}>
              Based on current selling prices
            </div>
          </div>

          <div
            className="rounded-xl p-6"
            style={{
              background: theme.colors.background.card,
              border: `1px solid ${theme.colors.border}`,
              boxShadow: theme.shadows.sm,
            }}
          >
            <h3 className="text-sm font-semibold mb-2" style={{ color: '#000000' }}>
              Expected Profit
            </h3>
            <p className="text-3xl font-bold" style={{ color: theme.colors.accent.green }}>
              ${totals.totalProfit.toFixed(2)}
            </p>
            <div className="mt-3 text-sm" style={{ color: '#000000' }}>
              Average Margin: {totals.totalRevenue > 0 ? ((totals.totalProfit / totals.totalRevenue) * 100).toFixed(1) : 0}%
            </div>
          </div>
        </div>

        {/* Cost Breakdown Table */}
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: theme.colors.background.card,
            border: `1px solid ${theme.colors.border}`,
            boxShadow: theme.shadows.sm,
          }}
        >
          <div className="p-6 border-b" style={{ borderColor: theme.colors.border }}>
            <h2 className="text-2xl font-bold" style={{ color: '#000000' }}>
              Cost Breakdown by Product
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ background: theme.colors.background.secondary }}>
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold" style={{ color: '#000000' }}>
                    Product
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold" style={{ color: '#000000' }}>
                    Material Cost
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold" style={{ color: '#000000' }}>
                    Labor Cost
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold" style={{ color: '#000000' }}>
                    Utilities
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold" style={{ color: '#000000' }}>
                    Total Cost
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold" style={{ color: '#000000' }}>
                    Selling Price
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold" style={{ color: '#000000' }}>
                    Profit
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold" style={{ color: '#000000' }}>
                    Margin %
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredBreakdowns.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center" style={{ color: '#000000' }}>
                      No products with recipes found
                    </td>
                  </tr>
                ) : (
                  filteredBreakdowns.map((breakdown) => (
                    <tr
                      key={breakdown.itemId}
                      className="border-t hover:bg-opacity-50 transition-colors"
                      style={{ borderColor: theme.colors.border }}
                    >
                      <td className="px-6 py-4">
                        <div className="font-semibold" style={{ color: '#000000' }}>
                          {breakdown.itemName}
                        </div>
                        <div className="text-xs" style={{ color: '#000000' }}>
                          {breakdown.category}
                        </div>
                      </td>
                      <td className="px-6 py-4" style={{ color: theme.colors.accent.blue }}>
                        ${breakdown.materialCost.toFixed(2)}
                      </td>
                      <td className="px-6 py-4" style={{ color: theme.colors.accent.purple }}>
                        ${breakdown.laborCost.toFixed(2)}
                      </td>
                      <td className="px-6 py-4" style={{ color: theme.colors.accent.yellow }}>
                        ${breakdown.utilitiesCost.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 font-bold" style={{ color: '#000000' }}>
                        ${breakdown.totalCost.toFixed(2)}
                      </td>
                      <td className="px-6 py-4" style={{ color: '#000000' }}>
                        ${breakdown.sellingPrice.toFixed(2)}
                      </td>
                      <td
                        className="px-6 py-4 font-bold"
                        style={{
                          color: breakdown.profit >= 0 ? theme.colors.accent.green : theme.colors.accent.red,
                        }}
                      >
                        ${breakdown.profit.toFixed(2)}
                      </td>
                      <td
                        className="px-6 py-4 font-bold"
                        style={{
                          color: breakdown.marginPercent >= 0 ? theme.colors.accent.green : theme.colors.accent.red,
                        }}
                      >
                        {breakdown.marginPercent.toFixed(1)}%
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Ingredient Details */}
        {itemFilter !== 'all' && filteredBreakdowns.length === 1 && (
          <div
            className="rounded-xl p-6 mt-8"
            style={{
              background: theme.colors.background.card,
              border: `1px solid ${theme.colors.border}`,
              boxShadow: theme.shadows.sm,
            }}
          >
            <h3 className="text-xl font-bold mb-4" style={{ color: '#000000' }}>
              Recipe Ingredients for {filteredBreakdowns[0].itemName}
            </h3>
            <div className="space-y-3">
              {filteredBreakdowns[0].ingredients.map((ingredient, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 rounded-lg"
                  style={{ background: theme.colors.background.secondary }}
                >
                  <div>
                    <div className="font-semibold" style={{ color: '#000000' }}>
                      {ingredient.name}
                    </div>
                    <div className="text-sm" style={{ color: '#000000' }}>
                      {ingredient.quantity} {ingredient.unit} × ${ingredient.costPerUnit.toFixed(2)}/{ingredient.unit}
                    </div>
                  </div>
                  <div className="font-bold text-lg" style={{ color: theme.colors.accent.green }}>
                    ${ingredient.totalCost.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
