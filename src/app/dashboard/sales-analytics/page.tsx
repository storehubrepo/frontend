'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { stockMovementsApi, StockMovement } from '@/lib/api/stock-movements';
import { itemsApi, Item } from '@/lib/api/items';
import { getAuthToken } from '@/lib/auth';
import theme from '@/styles/theme';

type TimeFilter = 'day' | 'week' | 'month' | 'year';

interface ChartData {
  date: string;
  sales: number;
  quantity: number;
}

export default function SalesAnalyticsPage() {
  const router = useRouter();
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('week');
  const [selectedItemId, setSelectedItemId] = useState<string>('all');
  const [showItemDropdown, setShowItemDropdown] = useState(false);
  const [itemType, setItemType] = useState<'all' | 'manufactured' | 'raw_material'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [totalSales, setTotalSales] = useState(0);
  const [totalQuantity, setTotalQuantity] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (movements.length > 0) {
      processChartData(movements);
    }
  }, [timeFilter, selectedItemId, itemType, selectedCategory]);

  const loadData = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        router.push('/login');
        return;
      }

      const [movementsData, itemsData] = await Promise.all([
        stockMovementsApi.getAll(token),
        itemsApi.getAll(token)
      ]);
      
      const salesMovements = movementsData.filter((m: StockMovement) => m.type === 'sale');
      setMovements(salesMovements);
      setItems(itemsData);
      
      processChartData(salesMovements);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processChartData = (salesData: StockMovement[]) => {
    const now = new Date();
    
    // Filter by time
    let filtered = salesData.filter(m => {
      const date = new Date(m.createdAt);
      switch (timeFilter) {
        case 'day':
          return date.toDateString() === now.toDateString();
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return date >= weekAgo;
        case 'month':
          return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        case 'year':
          return date.getFullYear() === now.getFullYear();
        default:
          return true;
      }
    });

    // Filter by item
    if (selectedItemId !== 'all') {
      filtered = filtered.filter(m => m.itemId === selectedItemId);
    }

    // Filter by item type
    if (itemType !== 'all') {
      const itemIds = items.filter(item => item.type === itemType).map(item => item.id);
      filtered = filtered.filter(m => itemIds.includes(m.itemId));
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      const itemIds = items.filter(item => item.category === selectedCategory).map(item => item.id);
      filtered = filtered.filter(m => itemIds.includes(m.itemId));
    }

    // Group by date
    const grouped: { [key: string]: { sales: number; quantity: number } } = {};
    
    filtered.forEach(m => {
      const date = new Date(m.createdAt);
      let key = '';
      
      switch (timeFilter) {
        case 'day':
          key = `${date.getHours()}:00`;
          break;
        case 'week':
          key = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
          break;
        case 'month':
          key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          break;
        case 'year':
          key = date.toLocaleDateString('en-US', { month: 'short' });
          break;
      }
      
      if (!grouped[key]) {
        grouped[key] = { sales: 0, quantity: 0 };
      }
      
      grouped[key].sales += Number(m.quantity) * Number(m.unitCost);
      grouped[key].quantity += Number(m.quantity);
    });

    const chartArray = Object.entries(grouped).map(([date, data]) => ({
      date,
      sales: Number(data.sales.toFixed(2)),
      quantity: Number(data.quantity.toFixed(2)),
    }));

    setChartData(chartArray);
    setTotalSales(chartArray.reduce((sum, item) => sum + item.sales, 0));
    setTotalQuantity(chartArray.reduce((sum, item) => sum + item.quantity, 0));
  };

  const maxSales = Math.max(...chartData.map(d => d.sales), 1);
  const maxQuantity = Math.max(...chartData.map(d => d.quantity), 1);

  const filteredItems = items.filter(item => {
    if (itemType === 'all') return true;
    return item.type === itemType;
  });

  const selectedItem = items.find(item => item.id === selectedItemId);

  // Get unique categories based on current item type filter
  const categories = Array.from(new Set(
    items
      .filter(item => itemType === 'all' ? true : item.type === itemType)
      .map(item => item.category)
      .filter(Boolean)
  )) as string[];

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ background: theme.colors.background.secondary }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center mb-4 hover:opacity-70 transition-opacity text-sm sm:text-base"
            style={{ color: theme.colors.text.secondary }}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2" style={{ color: theme.colors.text.primary }}>
            📊 Sales Analytics
          </h1>
          <p className="text-sm sm:text-base" style={{ color: theme.colors.text.secondary }}>
            Track your sales performance over time
          </p>
        </div>

        {/* Filter Section */}
        <div className="mb-6 sm:mb-8 space-y-4">
          {/* Time Filters */}
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {(['day', 'week', 'month', 'year'] as TimeFilter[]).map((filter) => (
              <button
                key={filter}
                onClick={() => setTimeFilter(filter)}
                className="px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold transition-all transform hover:scale-105 text-sm sm:text-base"
                style={{
                  background: timeFilter === filter ? theme.colors.primary.black : theme.colors.background.card,
                  color: timeFilter === filter ? 'white' : theme.colors.text.primary,
                  border: `2px solid ${timeFilter === filter ? theme.colors.primary.black : theme.colors.border}`,
                }}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>

          {/* Item Type Filters */}
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <button
              onClick={() => {
                setItemType('all');
                setSelectedItemId('all');
                setSelectedCategory('all');
              }}
              className="px-6 py-3 rounded-xl font-semibold transition-all transform hover:scale-105"
              style={{
                background: itemType === 'all' ? theme.colors.accent.blue : theme.colors.background.card,
                color: itemType === 'all' ? 'white' : theme.colors.text.primary,
                border: `2px solid ${itemType === 'all' ? theme.colors.accent.blue : theme.colors.border}`,
              }}
            >
              📦 All Items
            </button>
            <button
              onClick={() => {
                setItemType('manufactured');
                setSelectedItemId('all');
                setSelectedCategory('all');
              }}
              className="px-6 py-3 rounded-xl font-semibold transition-all transform hover:scale-105"
              style={{
                background: itemType === 'manufactured' ? theme.colors.accent.green : theme.colors.background.card,
                color: itemType === 'manufactured' ? 'white' : theme.colors.text.primary,
                border: `2px solid ${itemType === 'manufactured' ? theme.colors.accent.green : theme.colors.border}`,
              }}
            >
              🏭 Products Only
            </button>
            <button
              onClick={() => {
                setItemType('raw_material');
                setSelectedItemId('all');
                setSelectedCategory('all');
              }}
              className="px-6 py-3 rounded-xl font-semibold transition-all transform hover:scale-105"
              style={{
                background: itemType === 'raw_material' ? theme.colors.accent.purple : theme.colors.background.card,
                color: itemType === 'raw_material' ? 'white' : theme.colors.text.primary,
                border: `2px solid ${itemType === 'raw_material' ? theme.colors.accent.purple : theme.colors.border}`,
              }}
            >
              📦 Raw Materials Only
            </button>
          </div>

          {/* Category Dropdown */}
          {categories.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                className="w-full md:w-96 px-6 py-4 rounded-xl font-semibold transition-all transform hover:scale-105 flex items-center justify-between"
                style={{
                  background: theme.colors.background.card,
                  border: `2px solid ${theme.colors.border}`,
                  color: theme.colors.text.primary,
                  boxShadow: theme.shadows.md,
                }}
              >
                <span className="flex items-center gap-3">
                  <span className="text-2xl">🏷️</span>
                  <span>
                    {selectedCategory === 'all' 
                      ? 'All Categories' 
                      : selectedCategory}
                  </span>
                </span>
                <svg
                  className="w-5 h-5 transition-transform"
                  style={{ transform: showCategoryDropdown ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showCategoryDropdown && (
                <div
                  className="absolute top-full left-0 right-0 md:w-96 mt-2 rounded-xl overflow-hidden z-50"
                  style={{
                    background: theme.colors.background.card,
                    border: `2px solid ${theme.colors.border}`,
                    boxShadow: theme.shadows.xl,
                    maxHeight: '300px',
                    overflowY: 'auto',
                  }}
                >
                  <button
                    onClick={() => {
                      setSelectedCategory('all');
                      setSelectedItemId('all');
                      setShowCategoryDropdown(false);
                    }}
                    className="w-full px-6 py-4 text-left hover:opacity-70 transition-all flex items-center gap-3"
                    style={{
                      background: selectedCategory === 'all' ? `${theme.colors.accent.blue}20` : 'transparent',
                      borderBottom: `1px solid ${theme.colors.border}`,
                    }}
                  >
                    <span className="text-2xl">🏷️</span>
                    <div>
                      <div className="font-semibold" style={{ color: theme.colors.text.primary }}>
                        All Categories
                      </div>
                      <div className="text-xs" style={{ color: theme.colors.text.secondary }}>
                        View sales from all categories
                      </div>
                    </div>
                  </button>
                  
                  {categories.map((category) => {
                    const categoryItems = items.filter(item => 
                      item.category === category && 
                      (itemType === 'all' ? true : item.type === itemType)
                    );
                    const categoryItemCount = categoryItems.length;
                    
                    return (
                      <button
                        key={category}
                        onClick={() => {
                          setSelectedCategory(category);
                          setSelectedItemId('all');
                          setShowCategoryDropdown(false);
                        }}
                        className="w-full px-6 py-4 text-left hover:opacity-70 transition-all flex items-center gap-3"
                        style={{
                          background: selectedCategory === category ? `${theme.colors.accent.purple}20` : 'transparent',
                          borderBottom: `1px solid ${theme.colors.border}`,
                        }}
                      >
                        <span className="text-2xl">🏷️</span>
                        <div className="flex-1">
                          <div className="font-semibold" style={{ color: theme.colors.text.primary }}>
                            {category}
                          </div>
                          <div className="text-xs" style={{ color: theme.colors.text.secondary }}>
                            {categoryItemCount} {categoryItemCount === 1 ? 'item' : 'items'} in this category
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Item Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowItemDropdown(!showItemDropdown)}
              className="w-full md:w-96 px-6 py-4 rounded-xl font-semibold transition-all transform hover:scale-105 flex items-center justify-between"
              style={{
                background: theme.colors.background.card,
                border: `2px solid ${theme.colors.border}`,
                color: theme.colors.text.primary,
                boxShadow: theme.shadows.md,
              }}
            >
              <span className="flex items-center gap-3">
                <span className="text-2xl">
                  {selectedItemId === 'all' ? '🔍' : selectedItem?.type === 'manufactured' ? '🏭' : '📦'}
                </span>
                <span>
                  {selectedItemId === 'all' 
                    ? `All ${itemType === 'all' ? 'Items' : itemType === 'manufactured' ? 'Products' : 'Raw Materials'}` 
                    : selectedItem?.name || 'Select Item'}
                </span>
              </span>
              <svg
                className="w-5 h-5 transition-transform"
                style={{ transform: showItemDropdown ? 'rotate(180deg)' : 'rotate(0deg)' }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showItemDropdown && (
              <div
                className="absolute top-full left-0 right-0 md:w-96 mt-2 rounded-xl overflow-hidden z-50"
                style={{
                  background: theme.colors.background.card,
                  border: `2px solid ${theme.colors.border}`,
                  boxShadow: theme.shadows.xl,
                  maxHeight: '400px',
                  overflowY: 'auto',
                }}
              >
                <button
                  onClick={() => {
                    setSelectedItemId('all');
                    setShowItemDropdown(false);
                  }}
                  className="w-full px-6 py-4 text-left hover:opacity-70 transition-all flex items-center gap-3"
                  style={{
                    background: selectedItemId === 'all' ? `${theme.colors.accent.blue}20` : 'transparent',
                    borderBottom: `1px solid ${theme.colors.border}`,
                  }}
                >
                  <span className="text-2xl">🔍</span>
                  <div>
                    <div className="font-semibold" style={{ color: theme.colors.text.primary }}>
                      All {itemType === 'all' ? 'Items' : itemType === 'manufactured' ? 'Products' : 'Raw Materials'}
                    </div>
                    <div className="text-xs" style={{ color: theme.colors.text.secondary }}>
                      View all sales data
                    </div>
                  </div>
                </button>
                
                {filteredItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSelectedItemId(item.id);
                      setShowItemDropdown(false);
                    }}
                    className="w-full px-6 py-4 text-left hover:opacity-70 transition-all flex items-center gap-3"
                    style={{
                      background: selectedItemId === item.id ? `${theme.colors.accent.green}20` : 'transparent',
                      borderBottom: `1px solid ${theme.colors.border}`,
                    }}
                  >
                    <span className="text-2xl">{item.type === 'manufactured' ? '🏭' : '📦'}</span>
                    <div className="flex-1">
                      <div className="font-semibold" style={{ color: theme.colors.text.primary }}>
                        {item.name}
                      </div>
                      <div className="text-xs flex items-center gap-2" style={{ color: theme.colors.text.secondary }}>
                        <span className="px-2 py-0.5 rounded-full text-xs" style={{
                          background: item.type === 'manufactured' ? `${theme.colors.accent.green}20` : `${theme.colors.accent.purple}20`,
                          color: item.type === 'manufactured' ? theme.colors.accent.green : theme.colors.accent.purple,
                        }}>
                          {item.type === 'manufactured' ? 'Product' : 'Raw Material'}
                        </span>
                        {item.category && (
                          <span className="px-2 py-0.5 rounded-full text-xs" style={{
                            background: `${theme.colors.accent.blue}20`,
                            color: theme.colors.accent.blue,
                          }}>
                            {item.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p style={{ color: theme.colors.text.secondary }}>Loading analytics...</p>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div
                className="p-6 rounded-xl transform hover:scale-105 transition-all"
                style={{
                  background: `linear-gradient(135deg, ${theme.colors.accent.green} 0%, ${theme.colors.accent.blue} 100%)`,
                  boxShadow: theme.shadows.lg,
                }}
              >
                <div className="text-white">
                  <p className="text-sm opacity-90 mb-2">Total Sales</p>
                  <p className="text-4xl font-bold">${totalSales.toFixed(2)}</p>
                </div>
              </div>
              
              <div
                className="p-6 rounded-xl transform hover:scale-105 transition-all"
                style={{
                  background: `linear-gradient(135deg, ${theme.colors.accent.blue} 0%, ${theme.colors.accent.purple} 100%)`,
                  boxShadow: theme.shadows.lg,
                }}
              >
                <div className="text-white">
                  <p className="text-sm opacity-90 mb-2">Total Items Sold</p>
                  <p className="text-4xl font-bold">{totalQuantity.toFixed(0)}</p>
                </div>
              </div>
              
              <div
                className="p-6 rounded-xl transform hover:scale-105 transition-all"
                style={{
                  background: `linear-gradient(135deg, ${theme.colors.accent.purple} 0%, ${theme.colors.accent.red} 100%)`,
                  boxShadow: theme.shadows.lg,
                }}
              >
                <div className="text-white">
                  <p className="text-sm opacity-90 mb-2">Average Sale</p>
                  <p className="text-4xl font-bold">
                    ${chartData.length > 0 ? (totalSales / chartData.length).toFixed(2) : '0.00'}
                  </p>
                </div>
              </div>
            </div>

            {/* Sales Chart */}
            <div
              className="p-8 rounded-xl mb-8"
              style={{
                background: theme.colors.background.card,
                border: `1px solid ${theme.colors.border}`,
                boxShadow: theme.shadows.md,
              }}
            >
              <h2 className="text-2xl font-bold mb-6" style={{ color: theme.colors.text.primary }}>
                Sales Revenue
              </h2>
              
              {chartData.length === 0 ? (
                <div className="text-center py-12">
                  <p style={{ color: theme.colors.text.secondary }}>No sales data for this period</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {chartData.map((item, index) => (
                    <div key={index} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                      <div className="flex justify-between mb-2">
                        <span className="font-medium" style={{ color: theme.colors.text.primary }}>
                          {item.date}
                        </span>
                        <span className="font-bold" style={{ color: theme.colors.accent.green }}>
                          ${item.sales.toFixed(2)}
                        </span>
                      </div>
                      <div
                        className="h-8 rounded-full relative overflow-hidden"
                        style={{ background: theme.colors.background.secondary }}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-1000 ease-out"
                          style={{
                            width: `${(item.sales / maxSales) * 100}%`,
                            background: `linear-gradient(90deg, ${theme.colors.accent.green} 0%, ${theme.colors.accent.blue} 100%)`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quantity Chart */}
            <div
              className="p-8 rounded-xl"
              style={{
                background: theme.colors.background.card,
                border: `1px solid ${theme.colors.border}`,
                boxShadow: theme.shadows.md,
              }}
            >
              <h2 className="text-2xl font-bold mb-6" style={{ color: theme.colors.text.primary }}>
                Items Sold
              </h2>
              
              {chartData.length === 0 ? (
                <div className="text-center py-12">
                  <p style={{ color: theme.colors.text.secondary }}>No sales data for this period</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {chartData.map((item, index) => (
                    <div key={index} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                      <div className="flex justify-between mb-2">
                        <span className="font-medium" style={{ color: theme.colors.text.primary }}>
                          {item.date}
                        </span>
                        <span className="font-bold" style={{ color: theme.colors.accent.blue }}>
                          {item.quantity.toFixed(0)} items
                        </span>
                      </div>
                      <div
                        className="h-8 rounded-full relative overflow-hidden"
                        style={{ background: theme.colors.background.secondary }}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-1000 ease-out"
                          style={{
                            width: `${(item.quantity / maxQuantity) * 100}%`,
                            background: `linear-gradient(90deg, ${theme.colors.accent.blue} 0%, ${theme.colors.accent.purple} 100%)`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
}
