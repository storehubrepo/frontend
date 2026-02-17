'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { stockMovementsApi } from '@/lib/api/stock-movements';
import { ordersApi, PaymentStatus } from '@/lib/api/orders';
import { getAuthToken } from '@/lib/auth';
import { PriceDisplay } from '@/components/ui/PriceDisplay';
import { Currency, convertCurrency } from '@/lib/utils/currency';
import { useCurrency } from '@/lib/context/CurrencyContext';
import { formatNumberWithCommas } from '@/lib/utils/numberFormat';
import theme from '@/styles/theme';

export default function SalesPage() {
  const router = useRouter();
  const [movements, setMovements] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<PaymentStatus | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const { currency } = useCurrency();

  useEffect(() => {
    loadSales();
  }, []);

  useEffect(() => {
    loadOrders();
  }, [selectedPaymentStatus]);

  const loadSales = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        router.push('/login');
        return;
      }

      const allMovements = await stockMovementsApi.getAll(token);
      const sales = allMovements.filter((m: any) => m.type === 'sale');
      setMovements(sales);
      
      await loadOrders(token);
    } catch (error) {
      console.error('Failed to load sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async (token?: string) => {
    try {
      const authToken = token || getAuthToken();
      if (!authToken) return;

      const allOrders = await ordersApi.getAll(
        authToken,
        selectedPaymentStatus === 'all' ? undefined : selectedPaymentStatus
      );
      setOrders(allOrders);
    } catch (error) {
      console.error('Failed to load orders:', error);
    }
  };

  const getPaymentStatusBadge = (status: PaymentStatus) => {
    const statusConfig = {
      [PaymentStatus.PAID]: { bg: theme.colors.accent.green + '20', color: theme.colors.accent.green, label: 'Paid' },
      [PaymentStatus.UNPAID]: { bg: theme.colors.accent.yellow + '20', color: theme.colors.accent.yellow, label: 'Unpaid' },
      [PaymentStatus.FREE]: { bg: theme.colors.accent.blue + '20', color: theme.colors.accent.blue, label: 'Free' },
    };
    const config = statusConfig[status];
    return (
      <span
        style={{ background: config.bg, color: config.color }}
        className="px-3 py-1 rounded-full text-sm font-medium"
      >
        {config.label}
      </span>
    );
  };

  const totalRevenue = movements.reduce((sum, m) => {
    const unitCost = Number(m.unitCost || 0);
    const itemCurrency = m.unitCostCurrency || Currency.USD;
    const convertedCost = convertCurrency(unitCost, itemCurrency, currency);
    return sum + (Number(m.quantity || 0) * convertedCost);
  }, 0);
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
            <div className="text-5xl">💰</div>
            <div>
              <h1 className="text-4xl font-bold" style={{ color: theme.colors.text.primary }}>
                Total Sales
              </h1>
              <p style={{ color: theme.colors.text.secondary }}>
                Complete list of all sales transactions
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
              Total Revenue
            </div>
            <div className="text-3xl font-bold" style={{ color: theme.colors.accent.green }}>
              <PriceDisplay amount={totalRevenue} currency={currency} />
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
              Total Items Sold
            </div>
            <div className="text-3xl font-bold" style={{ color: theme.colors.accent.purple }}>
              {formatNumberWithCommas(totalQuantity)}
            </div>
          </div>
        </div>

        {/* Payment Status Filter */}
        <div
          className="rounded-xl p-6 mb-8"
          style={{
            background: theme.colors.background.card,
            border: `1px solid ${theme.colors.border}`,
            boxShadow: theme.shadows.sm,
          }}
        >
          <h2 className="text-xl font-bold mb-4" style={{ color: theme.colors.text.primary }}>
            Filter Orders by Payment Status
          </h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setSelectedPaymentStatus('all')}
              className={`px-6 py-3 rounded-xl font-medium transition-all ${
                selectedPaymentStatus === 'all'
                  ? 'text-white'
                  : 'opacity-60 hover:opacity-100'
              }`}
              style={selectedPaymentStatus === 'all' ? { background: theme.colors.primary.black } : { background: theme.colors.background.secondary, color: theme.colors.text.primary }}
            >
              All Orders
            </button>
            <button
              onClick={() => setSelectedPaymentStatus(PaymentStatus.PAID)}
              className={`px-6 py-3 rounded-xl font-medium transition-all ${
                selectedPaymentStatus === PaymentStatus.PAID
                  ? 'text-white'
                  : 'opacity-60 hover:opacity-100'
              }`}
              style={selectedPaymentStatus === PaymentStatus.PAID ? { background: theme.colors.accent.green } : { background: theme.colors.accent.green + '30', color: theme.colors.accent.green }}
            >
              Paid
            </button>
            <button
              onClick={() => setSelectedPaymentStatus(PaymentStatus.UNPAID)}
              className={`px-6 py-3 rounded-xl font-medium transition-all ${
                selectedPaymentStatus === PaymentStatus.UNPAID
                  ? 'text-white'
                  : 'opacity-60 hover:opacity-100'
              }`}
              style={selectedPaymentStatus === PaymentStatus.UNPAID ? { background: theme.colors.accent.yellow } : { background: theme.colors.accent.yellow + '30', color: theme.colors.accent.yellow }}
            >
              Unpaid
            </button>
            <button
              onClick={() => setSelectedPaymentStatus(PaymentStatus.FREE)}
              className={`px-6 py-3 rounded-xl font-medium transition-all ${
                selectedPaymentStatus === PaymentStatus.FREE
                  ? 'text-white'
                  : 'opacity-60 hover:opacity-100'
              }`}
              style={selectedPaymentStatus === PaymentStatus.FREE ? { background: theme.colors.accent.blue } : { background: theme.colors.accent.blue + '30', color: theme.colors.accent.blue }}
            >
              Free
            </button>
          </div>
        </div>

        {/* Orders List */}
        <div
          className="rounded-xl overflow-hidden mb-8"
          style={{
            background: theme.colors.background.card,
            border: `1px solid ${theme.colors.border}`,
            boxShadow: theme.shadows.sm,
          }}
        >
          <div className="p-6 border-b" style={{ borderColor: theme.colors.border }}>
            <h2 className="text-xl font-bold" style={{ color: theme.colors.text.primary }}>
              Customer Orders
              {selectedPaymentStatus !== 'all' && ` - ${selectedPaymentStatus.charAt(0).toUpperCase() + selectedPaymentStatus.slice(1)}`}
            </h2>
            <p className="text-sm mt-1" style={{ color: theme.colors.text.secondary }}>
              {orders.length} {orders.length === 1 ? 'order' : 'orders'} found
            </p>
          </div>

          {orders.length === 0 ? (
            <div className="p-8 text-center" style={{ color: theme.colors.text.secondary }}>
              No orders found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ background: theme.colors.background.secondary }}>
                  <tr>
                    <th className="text-left p-4" style={{ color: theme.colors.text.secondary }}>
                      Order ID
                    </th>
                    <th className="text-left p-4" style={{ color: theme.colors.text.secondary }}>
                      Customer
                    </th>
                    <th className="text-left p-4" style={{ color: theme.colors.text.secondary }}>
                      Date
                    </th>
                    <th className="text-right p-4" style={{ color: theme.colors.text.secondary }}>
                      Items
                    </th>
                    <th className="text-right p-4" style={{ color: theme.colors.text.secondary }}>
                      Total
                    </th>
                    <th className="text-left p-4" style={{ color: theme.colors.text.secondary }}>
                      Payment Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order, index) => (
                    <tr
                      key={order.id}
                      style={{
                        borderTop: index > 0 ? `1px solid ${theme.colors.border}` : 'none',
                      }}
                      className="hover:bg-opacity-50 transition-colors"
                    >
                      <td className="p-4 font-medium" style={{ color: theme.colors.text.primary }}>
                        #{order.id.toString().padStart(4, '0')}
                      </td>
                      <td className="p-4" style={{ color: theme.colors.text.primary }}>
                        {order.customer?.name || 'Unknown'}
                      </td>
                      <td className="p-4" style={{ color: theme.colors.text.primary }}>
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-right" style={{ color: theme.colors.text.primary }}>
                        {order.orderItems?.length || 0} items
                      </td>
                      <td className="p-4 text-right font-semibold" style={{ 
                        color: order.paymentStatus === PaymentStatus.PAID ? theme.colors.accent.green : theme.colors.text.primary 
                      }}>
                        <PriceDisplay 
                          amount={order.totalPrice || 0}
                          currency={order.totalPriceCurrency || Currency.USD}
                        />
                      </td>
                      <td className="p-4">
                        {getPaymentStatusBadge(order.paymentStatus)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Stock Movements (Sales Transactions) */}
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
              Stock Movement Transactions
            </h2>
            <p className="text-sm mt-1" style={{ color: theme.colors.text.secondary }}>
              Inventory-level sales transactions
            </p>
          </div>

          {movements.length === 0 ? (
            <div className="p-8 text-center" style={{ color: theme.colors.text.secondary }}>
              No sales transactions found
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
                      Unit Price
                    </th>
                    <th className="text-right p-4" style={{ color: theme.colors.text.secondary }}>
                      Total Revenue
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
                        {formatNumberWithCommas(Number(movement.quantity || 0))} {movement.item?.unit}
                      </td>
                      <td className="p-4 text-right" style={{ color: theme.colors.text.primary }}>
                        <PriceDisplay 
                          amount={Number(movement.unitCost || 0)}
                          currency={movement.unitCostCurrency || Currency.USD}
                        />
                      </td>
                      <td className="p-4 text-right font-semibold" style={{ color: theme.colors.accent.green }}>
                        <PriceDisplay 
                          amount={Number(movement.quantity || 0) * Number(movement.unitCost || 0)}
                          currency={movement.unitCostCurrency || Currency.USD}
                        />
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
