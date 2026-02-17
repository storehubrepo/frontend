'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { customersApi, Customer, CreateCustomerDto } from '@/lib/api/customers';
import { ordersApi, Order, CustomerStats, PaymentStatus } from '@/lib/api/orders';
import { getAuthToken } from '@/lib/auth';
import { formatNumberWithCommas } from '@/lib/utils/numberFormat';
import { useCurrency } from '@/lib/context/CurrencyContext';
import { formatPrice, convertCurrency, Currency } from '@/lib/utils/currency';
import { PriceDisplay } from '@/components/ui/PriceDisplay';
import theme from '@/styles/theme';

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params.id as string;
  const { currency: displayCurrency } = useCurrency();
  
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<CreateCustomerDto>({ name: '', description: '', phone: '', email: '' });

  // Convert total spent from each order's currency to display currency
  const getConvertedTotal = () => {
    return orders.reduce((sum, order) => {
      const orderCurrency = (order.currency as Currency) || Currency.USD;
      return sum + convertCurrency(Number(order.total), orderCurrency, displayCurrency);
    }, 0);
  };

  // Get payment status badge styling
  const getPaymentStatusBadge = (status: PaymentStatus | undefined) => {
    // Handle undefined or missing payment status
    if (!status) {
      console.warn('Payment status is undefined - database migration may not have been run');
      return {
        bg: theme.colors.accent.green + '20',
        color: theme.colors.accent.green,
        label: '✓ Paid'
      };
    }
    
    switch (status) {
      case PaymentStatus.PAID:
        return {
          bg: theme.colors.accent.green + '20',
          color: theme.colors.accent.green,
          label: '✓ Paid'
        };
      case PaymentStatus.UNPAID:
        return {
          bg: theme.colors.accent.red + '20',
          color: theme.colors.accent.red,
          label: '⚠ Unpaid'
        };
      case PaymentStatus.FREE:
        return {
          bg: theme.colors.accent.blue + '20',
          color: theme.colors.accent.blue,
          label: '🎁 Free'
        };
      default:
        return {
          bg: theme.colors.accent.green + '20',
          color: theme.colors.accent.green,
          label: '✓ Paid'
        };
    }
  };

  useEffect(() => {
    loadCustomerData();
  }, [customerId]);

  const loadCustomerData = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        router.push('/login');
        return;
      }
      const [customerData, ordersData, statsData] = await Promise.all([
        customersApi.getOne(customerId, token),
        ordersApi.getByCustomer(customerId, token),
        ordersApi.getCustomerStats(customerId, token),
      ]);
      setCustomer(customerData);
      setOrders(ordersData);
      setStats(statsData);
      setEditData({
        name: customerData.name,
        description: customerData.description || '',
        phone: customerData.phone || '',
        email: customerData.email || '',
      });
    } catch (error) {
      console.error('Failed to load customer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;
      await customersApi.update(customerId, {
        name: editData.name.trim(),
        description: editData.description?.trim() || undefined,
        phone: editData.phone?.trim() || undefined,
        email: editData.email?.trim() || undefined,
      }, token);
      setIsEditing(false);
      loadCustomerData();
    } catch (error) {
      console.error('Failed to update customer:', error);
      alert('Failed to update customer');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this customer? This cannot be undone.')) return;
    try {
      const token = getAuthToken();
      if (!token) return;
      await customersApi.delete(customerId, token);
      router.push('/dashboard/customers');
    } catch (error) {
      console.error('Failed to delete customer:', error);
      alert('Failed to delete customer');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl animate-pulse" style={{ color: '#000000' }}>Loading...</div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <p className="text-xl font-semibold" style={{ color: '#000000' }}>Customer not found</p>
          <button
            onClick={() => router.push('/dashboard/customers')}
            className="mt-4 px-6 py-2 rounded-lg font-semibold"
            style={{ background: theme.colors.primary.black, color: 'white' }}
          >
            Back to Customers
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ background: theme.colors.background.secondary }}>
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.push('/dashboard/customers')}
          className="mb-6 text-sm font-semibold hover:opacity-70 transition-opacity"
          style={{ color: theme.colors.accent.blue }}
        >
          ← Back to Customers
        </button>

        {/* Customer Info Card */}
        <div
          className="rounded-xl p-6 sm:p-8 mb-6"
          style={{
            background: theme.colors.background.card,
            border: `1px solid ${theme.colors.border}`,
            boxShadow: theme.shadows.sm,
          }}
        >
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: '#000000' }}>Name *</label>
                <input
                  type="text"
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg"
                  style={{ background: theme.colors.background.secondary, border: `1px solid ${theme.colors.border}`, color: '#000000' }}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1" style={{ color: '#000000' }}>Phone</label>
                  <input
                    type="text"
                    value={editData.phone}
                    onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg"
                    style={{ background: theme.colors.background.secondary, border: `1px solid ${theme.colors.border}`, color: '#000000' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1" style={{ color: '#000000' }}>Email</label>
                  <input
                    type="email"
                    value={editData.email}
                    onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg"
                    style={{ background: theme.colors.background.secondary, border: `1px solid ${theme.colors.border}`, color: '#000000' }}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: '#000000' }}>Description</label>
                <textarea
                  value={editData.description}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg resize-none"
                  style={{ background: theme.colors.background.secondary, border: `1px solid ${theme.colors.border}`, color: '#000000' }}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-2 rounded-lg font-semibold"
                  style={{ background: theme.colors.background.secondary, border: `1px solid ${theme.colors.border}`, color: '#000000' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!editData.name.trim()}
                  className="px-6 py-2 rounded-lg font-semibold disabled:opacity-50"
                  style={{ background: theme.colors.accent.green, color: 'white' }}
                >
                  Save Changes
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex items-start gap-4">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0"
                  style={{ background: theme.colors.accent.blue + '20', color: theme.colors.accent.blue }}
                >
                  {customer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: '#000000' }}>
                    {customer.name}
                  </h1>
                  <div className="flex flex-wrap gap-4 mt-2 text-sm" style={{ color: '#666' }}>
                    {customer.phone && <span>📱 {customer.phone}</span>}
                    {customer.email && <span>📧 {customer.email}</span>}
                  </div>
                  {customer.description && (
                    <p className="mt-3 text-sm" style={{ color: '#888' }}>{customer.description}</p>
                  )}
                  <p className="mt-2 text-xs" style={{ color: '#aaa' }}>
                    Added {new Date(customer.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 rounded-lg font-semibold text-sm"
                  style={{ background: theme.colors.accent.blue + '15', color: theme.colors.accent.blue }}
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 rounded-lg font-semibold text-sm"
                  style={{ background: theme.colors.accent.red + '15', color: theme.colors.accent.red }}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
            <div
              className="rounded-xl p-5 text-center"
              style={{ background: theme.colors.background.card, border: `1px solid ${theme.colors.border}` }}
            >
              <div className="text-3xl font-bold" style={{ color: theme.colors.accent.blue }}>
                {stats.totalOrders}
              </div>
              <div className="text-sm font-semibold mt-1" style={{ color: '#000000' }}>Total Orders</div>
            </div>
            <div
              className="rounded-xl p-5 text-center"
              style={{ background: theme.colors.background.card, border: `1px solid ${theme.colors.border}` }}
            >
              <div className="text-3xl font-bold" style={{ color: theme.colors.accent.green }}>
                {formatPrice(getConvertedTotal(), displayCurrency)}
              </div>
              <div className="text-sm font-semibold mt-1" style={{ color: '#000000' }}>Total Spent</div>
            </div>
            <div
              className="rounded-xl p-5 text-center"
              style={{ background: theme.colors.background.card, border: `1px solid ${theme.colors.border}` }}
            >
              <div className="text-3xl font-bold" style={{ color: theme.colors.accent.purple }}>
                {stats.totalOrders > 0 ? formatPrice(getConvertedTotal() / stats.totalOrders, displayCurrency) : '-'}
              </div>
              <div className="text-sm font-semibold mt-1" style={{ color: '#000000' }}>Avg. Order</div>
            </div>
            <div
              className="rounded-xl p-5 text-center"
              style={{ background: theme.colors.background.card, border: `1px solid ${theme.colors.border}` }}
            >
              <div className="text-sm font-bold" style={{ color: '#000000' }}>
                {stats.lastOrderDate ? new Date(stats.lastOrderDate).toLocaleDateString() : 'Never'}
              </div>
              <div className="text-sm font-semibold mt-1" style={{ color: '#000000' }}>Last Order</div>
            </div>
            {stats.unpaidOrders > 0 && (
              <div
                className="rounded-xl p-5 text-center"
                style={{ background: theme.colors.background.card, border: `1px solid ${theme.colors.border}` }}
              >
                <div className="text-3xl font-bold" style={{ color: theme.colors.accent.red }}>
                  {stats.unpaidOrders}
                </div>
                <div className="text-sm font-semibold mt-1" style={{ color: '#000000' }}>Unpaid</div>
              </div>
            )}
            {stats.freeOrders > 0 && (
              <div
                className="rounded-xl p-5 text-center"
                style={{ background: theme.colors.background.card, border: `1px solid ${theme.colors.border}` }}
              >
                <div className="text-3xl font-bold" style={{ color: theme.colors.accent.blue }}>
                  {stats.freeOrders}
                </div>
                <div className="text-sm font-semibold mt-1" style={{ color: '#000000' }}>Free</div>
              </div>
            )}
          </div>
        )}

        {/* Most Ordered Items */}
        {stats && stats.mostOrdered.length > 0 && (
          <div
            className="rounded-xl p-6 mb-6"
            style={{ background: theme.colors.background.card, border: `1px solid ${theme.colors.border}` }}
          >
            <h2 className="text-lg font-bold mb-4" style={{ color: '#000000' }}>🏆 Most Ordered Items</h2>
            <div className="space-y-3">
              {stats.mostOrdered.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg"
                  style={{ background: theme.colors.background.secondary }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold" style={{ color: theme.colors.accent.blue }}>
                      #{index + 1}
                    </span>
                    <span className="font-semibold" style={{ color: '#000000' }}>{item.name}</span>
                  </div>
                  <span
                    className="text-sm font-bold px-3 py-1 rounded-full"
                    style={{ background: theme.colors.accent.green + '20', color: theme.colors.accent.green }}
                  >
                    {item.count} ordered
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Orders List */}
        <div
          className="rounded-xl p-6"
          style={{ background: theme.colors.background.card, border: `1px solid ${theme.colors.border}` }}
        >
          <h2 className="text-lg font-bold mb-4" style={{ color: '#000000' }}>
            📋 Order History ({orders.length})
          </h2>

          {orders.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">📭</div>
              <p className="text-sm" style={{ color: '#888' }}>No orders yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map(order => {
                const paymentBadge = getPaymentStatusBadge(order.paymentStatus);
                return (
                  <div
                    key={order.id}
                    className="p-4 rounded-lg"
                    style={{ background: theme.colors.background.secondary }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-bold" style={{ color: '#000000' }}>
                          {order.cartName || 'Order'}
                        </span>
                        {order.cartType && (
                          <span
                            className="text-xs font-bold px-2 py-0.5 rounded-full"
                            style={{ background: theme.colors.accent.purple + '20', color: theme.colors.accent.purple }}
                          >
                            {order.cartType}
                          </span>
                        )}
                        <span
                          className="text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{ background: paymentBadge.bg, color: paymentBadge.color }}
                        >
                          {paymentBadge.label}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold" style={{ color: theme.colors.accent.green }}>
                          {formatPrice(convertCurrency(Number(order.total), (order.currency as Currency) || Currency.USD, displayCurrency), displayCurrency)}
                        </div>
                        <div className="text-xs" style={{ color: '#888' }}>
                          {new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm" style={{ color: '#666' }}>
                      {order.items.map((item, i) => (
                        <span key={i}>
                          {item.quantity}x {item.name}{item.size ? ` (${item.size})` : ''}
                          {i < order.items.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
