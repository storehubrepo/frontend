'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { itemsApi, Item } from '@/lib/api/items';
import { getAuthToken } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatNumberWithCommas } from '@/lib/utils/numberFormat';
import { PriceDisplay } from '@/components/ui/PriceDisplay';
import { Currency, convertCurrency } from '@/lib/utils/currency';
import { useCurrency } from '@/lib/context/CurrencyContext';
import theme from '@/styles/theme';

export default function ItemsPage() {
  const router = useRouter();
  const { currency } = useCurrency();
  const [items, setItems] = useState<Item[]>([]);
  const [filter, setFilter] = useState<'all' | 'raw_material' | 'manufactured'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadItems();
  }, [filter]);

  const loadItems = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const filterType = filter === 'all' ? undefined : filter;
      const data = await itemsApi.getAll(token, filterType);
      setItems(data);
      
      // Extract unique categories
      const uniqueCategories = Array.from(new Set(data.map(item => item.category).filter(Boolean))) as string[];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Failed to load items:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = categoryFilter === 'all' 
    ? items 
    : items.filter(item => item.category === categoryFilter);

  // Calculate cost per unit for manufactured products
  const calculateCostPerUnit = (item: Item) => {
    if (item.type !== 'manufactured' || !item.recipes || item.recipes.length === 0) {
      return 0;
    }
    const totalCost = item.recipes.reduce((sum, recipe) => {
      const ingredientCost = recipe.childItem?.purchasePrice || 0;
      const ingredientCurrency = recipe.childItem?.purchasePriceCurrency || Currency.USD;
      // Convert to selected currency
      const convertedCost = convertCurrency(ingredientCost, ingredientCurrency, currency);
      return sum + (convertedCost * recipe.quantityNeeded);
    }, 0);
    const yield_ = item.recipeYield || 1;
    return totalCost / yield_;
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const token = getAuthToken();
      if (!token) return;

      await itemsApi.delete(id, token);
      loadItems();
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  };

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: '#000000' }}>Items Management</h1>
            <p style={{ color: '#000000' }} className="mt-1 text-sm sm:text-base">Manage your raw materials and products</p>
          </div>
          <Button onClick={() => router.push('/dashboard/items/new')} className="w-full sm:w-auto">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Item
          </Button>
        </div>

        {/* Filters */}
        <div className="mb-6">
          {/* Type Filters */}
          <div className="flex flex-wrap gap-2 sm:gap-4 mb-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
                filter === 'all'
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-black hover:bg-gray-200'
              }`}
            >
              All Items ({items.length})
            </button>
            <button
              onClick={() => setFilter('raw_material')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'raw_material'
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-black hover:bg-gray-200'
              }`}
            >
              Raw Materials
            </button>
            <button
              onClick={() => setFilter('manufactured')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'manufactured'
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-black hover:bg-gray-200'
              }`}
            >
              Products
            </button>
          </div>

          {/* Category Filters */}
          {categories.length > 0 && (
            <div>
              <p className="text-sm mb-2" style={{ color: '#000000' }}>Filter by Category:</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setCategoryFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    categoryFilter === 'all'
                      ? 'bg-black text-white'
                      : 'bg-gray-100 text-black hover:bg-gray-200'
                  }`}
                >
                  All Categories
                </button>
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setCategoryFilter(category)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      categoryFilter === category
                        ? 'bg-black text-white'
                        : 'bg-gray-100 text-black hover:bg-gray-200'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Items Grid */}
        {loading ? (
          <div className="text-center py-12">
            <p style={{ color: '#000000' }}>Loading items...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <svg className="w-16 h-16 mx-auto text-black mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="text-lg font-semibold mb-1">No items yet</h3>
            <p className="text-black mb-4">Get started by adding your first item</p>
            <Button onClick={() => router.push('/dashboard/items/new')}>Add Item</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <div key={item.id} className="border-2 border-gray-200 rounded-xl p-6 hover:border-black transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-1" style={{ color: '#000000' }}>{item.name}</h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        item.type === 'raw_material'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {item.type === 'raw_material' ? 'Raw Material' : 'Product'}
                      </span>
                      {item.category && (
                        <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700">
                          {item.category}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-medium" style={{ color: '#000000' }}>{item.unit}</span>
                </div>

                {item.description && (
                  <p className="text-sm mb-4" style={{ color: '#000000' }}>{item.description}</p>
                )}

                <div className="space-y-2 mb-4">
                  {item.type === 'raw_material' && item.purchasePrice && (
                    <div className="flex justify-between text-sm">
                      <span className="text-black">Purchase Price:</span>
                      <span className="font-semibold">
                        <PriceDisplay 
                          amount={item.purchasePrice} 
                          currency={item.purchasePriceCurrency || Currency.USD}
                        />
                      </span>
                    </div>
                  )}
                  {item.type === 'manufactured' && (
                    <>
                      {item.recipes && item.recipes.length > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-black">Cost per Unit:</span>
                          <span className="font-semibold text-blue-600">
                            <PriceDisplay amount={calculateCostPerUnit(item)} currency={currency} />
                          </span>
                        </div>
                      )}
                      {item.sellingPrice && (
                        <>
                          <div className="flex justify-between text-sm">
                            <span className="text-black">Selling Price:</span>
                            <span className="font-semibold">
                              <PriceDisplay 
                                amount={item.sellingPrice} 
                                currency={item.sellingPriceCurrency || Currency.USD}
                              />
                            </span>
                          </div>
                          {item.recipes && item.recipes.length > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-black">Profit per Unit:</span>
                              <span className={`font-semibold ${convertCurrency(item.sellingPrice, item.sellingPriceCurrency || Currency.USD, currency) > calculateCostPerUnit(item) ? 'text-green-600' : 'text-red-600'}`}>
                                <PriceDisplay 
                                  amount={convertCurrency(item.sellingPrice, item.sellingPriceCurrency || Currency.USD, currency) - calculateCostPerUnit(item)} 
                                  currency={currency}
                                />
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    </>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-black">Stock:</span>
                    <span className="font-semibold">{formatNumberWithCommas(Number(item.stockQuantity))} {item.unit}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => router.push(`/dashboard/items/${item.id}`)}
                    className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
                  >
                    Edit
                  </button>
                  {item.type === 'manufactured' && (
                    <button
                      onClick={() => router.push(`/dashboard/items/${item.id}/recipe`)}
                      className="flex-1 px-4 py-2 border-2 border-black text-black rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                    >
                      Recipe
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="px-4 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
