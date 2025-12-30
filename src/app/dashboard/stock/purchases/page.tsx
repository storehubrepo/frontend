'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { stockMovementsApi } from '@/lib/api/stock-movements';
import { getAuthToken } from '@/lib/auth';
import theme from '@/styles/theme';

export default function PurchasesPage() {
  const router = useRouter();
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPurchases();
  }, []);

  const loadPurchases = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        router.push('/login');
        return;
      }

      const allMovements = await stockMovementsApi.getAll(token);
      const purchases = allMovements.filter((m: any) => m.type === 'purchase');
      setMovements(purchases);
    } catch (error) {
      console.error('Failed to load purchases:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = movements.reduce((sum, m) => sum + (Number(m.quantity || 0) * Number(m.unitCost || 0)), 0);
  const totalQuantity = movements.reduce((sum, m) => sum + Number(m.quantity || 0), 0);

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
          <button
            onClick={() => router.back()}
            className="mb-4 flex items-center gap-2 hover:opacity-70 transition-opacity"
            style={{ color: theme.colors.text.secondary }}
          >
            ← Back
          </button>
          <div className="flex items-center gap-4 mb-4">
            <div className="text-5xl">📦</div>
            <div>
              <h1 className="text-4xl font-bold" style={{ color: theme.colors.text.primary }}>
                Total Purchases
              </h1>
              <p style={{ color: theme.colors.text.secondary }}>
                Complete list of all purchase transactions
              </p>
            </div>
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
            <div className="text-sm mb-2" style={{ color: theme.colors.text.secondary }}>
              Total Transactions
            </div>
            <div className="text-3xl font-bold" style={{ color: theme.colors.accent.blue }}>
              {movements.length}
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
            <div className="text-sm mb-2" style={{ color: theme.colors.text.secondary }}>
              Total Amount Spent
            </div>
            <div className="text-3xl font-bold" style={{ color: theme.colors.accent.green }}>
              ${totalAmount.toFixed(2)}
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
            <div className="text-sm mb-2" style={{ color: theme.colors.text.secondary }}>
              Total Items Purchased
            </div>
            <div className="text-3xl font-bold" style={{ color: theme.colors.accent.purple }}>
              {totalQuantity.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Purchases List */}
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: theme.colors.background.card,
            border: `1px solid ${theme.colors.border}`,
            boxShadow: theme.shadows.sm,
          }}
        >
          <div className="p-6 border-b" style={{ borderColor: theme.colors.border }}>
            <h2 className="text-xl font-bold" style={{ color: theme.colors.text.primary }}>
              All Purchase Transactions
            </h2>
          </div>

          {movements.length === 0 ? (
            <div className="p-8 text-center" style={{ color: theme.colors.text.secondary }}>
              No purchase transactions found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ background: theme.colors.background.secondary }}>
                  <tr>
                    <th className="text-left p-4" style={{ color: theme.colors.text.secondary }}>
                      Date
                    </th>
                    <th className="text-left p-4" style={{ color: theme.colors.text.secondary }}>
                      Item
                    </th>
                    <th className="text-right p-4" style={{ color: theme.colors.text.secondary }}>
                      Quantity
                    </th>
                    <th className="text-right p-4" style={{ color: theme.colors.text.secondary }}>
                      Unit Cost
                    </th>
                    <th className="text-right p-4" style={{ color: theme.colors.text.secondary }}>
                      Total Cost
                    </th>
                    <th className="text-left p-4" style={{ color: theme.colors.text.secondary }}>
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((movement, index) => (
                    <tr
                      key={movement.id}
                      style={{
                        borderTop: index > 0 ? `1px solid ${theme.colors.border}` : 'none',
                      }}
                      className="hover:bg-opacity-50 transition-colors"
                    >
                      <td className="p-4" style={{ color: theme.colors.text.primary }}>
                        {new Date(movement.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <div className="font-semibold" style={{ color: theme.colors.text.primary }}>
                          {movement.item?.name || 'Unknown'}
                        </div>
                        <div className="text-sm" style={{ color: theme.colors.text.secondary }}>
                          {movement.item?.type}
                        </div>
                      </td>
                      <td className="p-4 text-right" style={{ color: theme.colors.text.primary }}>
                        {Number(movement.quantity || 0).toFixed(2)} {movement.item?.unit}
                      </td>
                      <td className="p-4 text-right" style={{ color: theme.colors.text.primary }}>
                        ${Number(movement.unitCost || 0).toFixed(2)}
                      </td>
                      <td className="p-4 text-right font-semibold" style={{ color: theme.colors.accent.green }}>
                        ${(Number(movement.quantity || 0) * Number(movement.unitCost || 0)).toFixed(2)}
                      </td>
                      <td className="p-4" style={{ color: theme.colors.text.secondary }}>
                        {movement.notes || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
