'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { stockMovementsApi, CreateStockMovementDto } from '@/lib/api/stock-movements';
import { itemsApi, Item } from '@/lib/api/items';
import { getAuthToken } from '@/lib/auth';
import { NumberInput } from '@/components/ui/NumberInput';
import { formatNumberWithCommas } from '@/lib/utils/numberFormat';
import Link from 'next/link';
import theme from '@/styles/theme';

export default function StockPage() {
  const router = useRouter();
  const [movements, setMovements] = useState<any[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  
  const [formData, setFormData] = useState<CreateStockMovementDto>({
    type: 'purchase',
    itemId: '',
    quantity: 0,
    unitCost: 0,
    notes: '',
  });

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

      const [movementsData, itemsData, summaryData] = await Promise.all([
        stockMovementsApi.getAll(token),
        itemsApi.getAll(token),
        stockMovementsApi.getSummary(token),
      ]);

      setMovements(movementsData);
      setItems(itemsData);
      setSummary(summaryData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = getAuthToken();
      if (!token) return;

      await stockMovementsApi.create(formData, token);
      setShowModal(false);
      setFormData({
        type: 'purchase',
        itemId: '',
        quantity: 0,
        unitCost: 0,
        notes: '',
      });
      loadData();
    } catch (error) {
      console.error('Failed to create movement:', error);
      alert('Failed to create stock movement');
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'purchase': return theme.colors.accent.blue;
      case 'sale': return theme.colors.accent.green;
      case 'production': return theme.colors.accent.purple;
      case 'waste': return theme.colors.accent.red;
      case 'adjustment': return theme.colors.accent.yellow;
      default: return theme.colors.primary.gray[500];
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'purchase': return '📦';
      case 'sale': return '💰';
      case 'production': return '🏭';
      case 'waste': return '🗑️';
      case 'adjustment': return '⚙️';
      default: return '📊';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p style={{ color: '#000000' }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2" style={{ color: '#000000' }}>Stock Management</h1>
            <p className="text-sm sm:text-base" style={{ color: '#000000' }}>Track inventory movements and stock levels</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            style={{ background: theme.colors.primary.black }}
            className="w-full sm:w-auto px-4 sm:px-6 py-3 text-white rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg text-sm sm:text-base"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Movement
          </button>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Link href="/dashboard/stock/purchases" className="bg-white rounded-2xl p-6 shadow-lg border-2 border-transparent hover:border-blue-500 transition-all cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                <div className="text-3xl">📦</div>
                <div style={{ background: theme.colors.accent.blue }} className="p-2 rounded-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                  </svg>
                </div>
              </div>
              <h3 className="text-sm mb-1" style={{ color: '#000000' }}>Total Purchases</h3>
              <p className="text-3xl font-bold" style={{ color: '#000000' }}>{formatNumberWithCommas(summary.totalPurchases, 0)}</p>
            </Link>

            <Link href="/dashboard/stock/sales" className="bg-white rounded-2xl p-6 shadow-lg border-2 border-transparent hover:border-green-500 transition-all cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                <div className="text-3xl">💰</div>
                <div style={{ background: theme.colors.accent.green }} className="p-2 rounded-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                  </svg>
                </div>
              </div>
              <h3 className="text-sm mb-1" style={{ color: '#000000' }}>Total Sales</h3>
              <p className="text-3xl font-bold" style={{ color: '#000000' }}>{formatNumberWithCommas(summary.totalSales, 0)}</p>
            </Link>

            <Link href="/dashboard/stock/production" className="bg-white rounded-2xl p-6 shadow-lg border-2 border-transparent hover:border-purple-500 transition-all cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                <div className="text-3xl">🏭</div>
                <div style={{ background: theme.colors.accent.purple }} className="p-2 rounded-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-sm mb-1" style={{ color: '#000000' }}>Total Production</h3>
              <p className="text-3xl font-bold" style={{ color: '#000000' }}>{formatNumberWithCommas(summary.totalProduction, 0)}</p>
            </Link>

            <Link href="/dashboard/stock/waste" className="bg-white rounded-2xl p-6 shadow-lg border-2 border-transparent hover:border-red-500 transition-all cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                <div className="text-3xl">🗑️</div>
                <div style={{ background: theme.colors.accent.red }} className="p-2 rounded-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-sm mb-1" style={{ color: '#000000' }}>Total Waste</h3>
              <p className="text-3xl font-bold" style={{ color: '#000000' }}>{formatNumberWithCommas(summary.totalWaste, 0)}</p>
            </Link>
          </div>
        )}

        {/* Movements Table */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold" style={{ color: '#000000' }}>Recent Movements</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-black">Type</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-black">Item</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-black">Quantity</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-black">Unit Cost</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-black">Notes</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-black">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {movements.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-black">
                      No stock movements yet
                    </td>
                  </tr>
                ) : (
                  movements.map((movement) => (
                    <tr key={movement.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <span
                          style={{ 
                            background: getTypeColor(movement.type) + '20',
                            color: getTypeColor(movement.type),
                          }}
                          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium"
                        >
                          {getTypeIcon(movement.type)}
                          {movement.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium" style={{ color: '#000000' }}>{movement.item?.name || 'Unknown'}</td>
                      <td className="px-6 py-4" style={{ color: '#000000' }}>{formatNumberWithCommas(Number(movement.quantity))}</td>
                      <td className="px-6 py-4" style={{ color: '#000000' }}>
                        {movement.unitCost ? `$${formatNumberWithCommas(Number(movement.unitCost))}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-black">{movement.notes || '-'}</td>
                      <td className="px-6 py-4 text-black">
                        {new Date(movement.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Movement Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl sm:text-2xl font-bold" style={{ color: '#000000' }}>Add Stock Movement</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>Movement Type</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                  {(['purchase', 'sale', 'production', 'adjustment', 'waste'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData({ ...formData, type })}
                      style={{
                        background: formData.type === type ? getTypeColor(type) : 'white',
                        color: formData.type === type ? 'white' : theme.colors.primary.black,
                        borderColor: getTypeColor(type),
                      }}
                      className="px-4 py-3 border-2 rounded-xl font-medium transition-all hover:scale-105"
                    >
                      {getTypeIcon(type)} {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>Item</label>
                <select
                  value={formData.itemId}
                  onChange={(e) => setFormData({ ...formData, itemId: e.target.value })}
                  className="w-full h-12 px-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-black"
                  style={{ color: '#000000' }}
                  required
                >
                  <option value="">Select an item...</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} (Stock: {formatNumberWithCommas(Number(item.stockQuantity))} {item.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>Quantity</label>
                <NumberInput
                  value={formData.quantity}
                  onChange={(value) => setFormData({ ...formData, quantity: value })}
                  min={0}
                  allowDecimals={true}
                  className="w-full h-12 px-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-black"
                  style={{ color: '#000000' }}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>Unit Cost (Optional)</label>
                <NumberInput
                  value={formData.unitCost || 0}
                  onChange={(value) => setFormData({ ...formData, unitCost: value })}
                  min={0}
                  allowDecimals={true}
                  className="w-full h-12 px-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-black"
                  style={{ color: '#000000' }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>Notes (Optional)</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full h-24 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-black resize-none"
                  style={{ color: '#000000' }}
                  placeholder="Add any notes about this movement..."
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  style={{ background: theme.colors.primary.black }}
                  className="flex-1 py-3 text-white rounded-xl hover:opacity-90 transition-opacity font-medium"
                >
                  Add Movement
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 border-2 border-gray-200 rounded-xl hover:border-black transition-colors font-medium"
                  style={{ color: '#000000' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
