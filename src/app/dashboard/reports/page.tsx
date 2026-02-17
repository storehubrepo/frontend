'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { analyticsApi, ProfitReport, OrdersAnalytics } from '@/lib/api/analytics';
import { PaymentStatus } from '@/lib/api/orders';
import { getAuthToken } from '@/lib/auth';
import { formatNumberWithCommas } from '@/lib/utils/numberFormat';
import theme from '@/styles/theme';

export default function ReportsPage() {
  const router = useRouter();
  const [report, setReport] = useState<ProfitReport | null>(null);
  const [ordersAnalytics, setOrdersAnalytics] = useState<OrdersAnalytics | null>(null);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<PaymentStatus | 'all'>('all');

  const loadReport = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      if (!token) {
        router.push('/login');
        return;
      }

      const [profitData, ordersData] = await Promise.all([
        analyticsApi.getProfitReport(token, startDate, endDate),
        analyticsApi.getOrdersAnalytics(token, startDate, endDate)
      ]);
      
      setReport(profitData);
      setOrdersAnalytics(ordersData);
      
      // Load filtered orders based on selected payment status
      await loadFilteredOrders(token);
    } catch (error) {
      console.error('Failed to load report:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFilteredOrders = async (token?: string) => {
    try {
      const authToken = token || getAuthToken();
      if (!authToken) return;

      const orders = await analyticsApi.getOrdersByStatus(
        authToken,
        selectedPaymentStatus === 'all' ? undefined : selectedPaymentStatus as PaymentStatus
      );
      setFilteredOrders(orders);
    } catch (error) {
      console.error('Failed to load filtered orders:', error);
    }
  };

  useEffect(() => {
    loadReport();
  }, []);

  useEffect(() => {
    // Reload filtered orders when payment status filter changes
    const token = getAuthToken();
    if (token && (report || ordersAnalytics)) {
      loadFilteredOrders(token);
    }
  }, [selectedPaymentStatus]);

  const handleGenerateReport = () => {
    loadReport();
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

  const exportToCSV = () => {
    if (!report) return;

    const headers = ['Item Name', 'Units Sold', 'Revenue', 'Cost', 'Profit'];
    const rows = report.itemBreakdown.map(item => [
      item.itemName,
      item.unitsSold,
      formatNumberWithCommas(item.revenue),
      formatNumberWithCommas(item.cost),
      formatNumberWithCommas(item.profit),
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
      '',
      `Total Sales,${report.totalSales}`,
      `Total Revenue,${formatNumberWithCommas(report.totalRevenue)}`,
      `Total Costs,${formatNumberWithCommas(report.totalCosts)}`,
      `Gross Profit,${formatNumberWithCommas(report.grossProfit)}`,
      `Profit Margin,${formatNumberWithCommas(report.profitMargin, 1)}%`,
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `profit-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2" style={{ color: '#000000' }}>Profit Reports</h1>
          <p className="text-sm sm:text-base" style={{ color: '#000000' }}>Generate detailed profit and loss reports</p>
        </div>

        {/* Date Filter */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-8">
          <h2 className="text-xl font-bold mb-4" style={{ color: '#000000' }}>Report Period</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full h-12 px-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-black"
                style={{ color: '#000000' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full h-12 px-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-black"
                style={{ color: '#000000' }}
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={handleGenerateReport}
                disabled={loading}
                style={{ background: theme.colors.primary.black }}
                className="flex-1 h-12 text-white rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 font-medium"
              >
                {loading ? 'Generating...' : 'Generate Report'}
              </button>
              {report && (
                <button
                  onClick={exportToCSV}
                  className="h-12 px-4 border-2 border-gray-200 rounded-xl hover:border-black transition-colors"
                  title="Export to CSV"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Payment Status Filter */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-8">
          <h2 className="text-xl font-bold mb-4" style={{ color: '#000000' }}>Payment Status Filter</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setSelectedPaymentStatus('all')}
              className={`px-6 py-3 rounded-xl font-medium transition-all ${
                selectedPaymentStatus === 'all'
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Orders
            </button>
            <button
              onClick={() => setSelectedPaymentStatus(PaymentStatus.PAID)}
              className={`px-6 py-3 rounded-xl font-medium transition-all ${
                selectedPaymentStatus === PaymentStatus.PAID
                  ? 'text-white'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
              style={selectedPaymentStatus === PaymentStatus.PAID ? { background: theme.colors.accent.green } : {}}
            >
              Paid Only
            </button>
            <button
              onClick={() => setSelectedPaymentStatus(PaymentStatus.UNPAID)}
              className={`px-6 py-3 rounded-xl font-medium transition-all ${
                selectedPaymentStatus === PaymentStatus.UNPAID
                  ? 'text-white'
                  : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
              }`}
              style={selectedPaymentStatus === PaymentStatus.UNPAID ? { background: theme.colors.accent.yellow } : {}}
            >
              Unpaid Only
            </button>
            <button
              onClick={() => setSelectedPaymentStatus(PaymentStatus.FREE)}
              className={`px-6 py-3 rounded-xl font-medium transition-all ${
                selectedPaymentStatus === PaymentStatus.FREE
                  ? 'text-white'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
              style={selectedPaymentStatus === PaymentStatus.FREE ? { background: theme.colors.accent.blue } : {}}
            >
              Free Only
            </button>
          </div>
        </div>

        {/* Orders Analytics */}
        {ordersAnalytics && (
          <div className="bg-white rounded-2xl p-6 shadow-lg mb-8">
            <h2 className="text-xl font-bold mb-4" style={{ color: '#000000' }}>Orders Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-600 mb-1">Total Orders</p>
                <p className="text-3xl font-bold" style={{ color: '#000000' }}>
                  {formatNumberWithCommas(ordersAnalytics.totalOrders, 0)}
                </p>
              </div>
              <div className="p-4 rounded-xl" style={{ background: theme.colors.accent.green + '20' }}>
                <p className="text-sm mb-1" style={{ color: theme.colors.accent.green }}>Paid Orders</p>
                <p className="text-3xl font-bold" style={{ color: theme.colors.accent.green }}>
                  {formatNumberWithCommas(ordersAnalytics.paidOrders, 0)}
                </p>
                <p className="text-sm mt-1" style={{ color: theme.colors.accent.green }}>
                  ${formatNumberWithCommas(ordersAnalytics.totalRevenue)}
                </p>
              </div>
              <div className="p-4 rounded-xl" style={{ background: theme.colors.accent.yellow + '20' }}>
                <p className="text-sm mb-1" style={{ color: theme.colors.accent.yellow }}>Unpaid Orders</p>
                <p className="text-3xl font-bold" style={{ color: theme.colors.accent.yellow }}>
                  {formatNumberWithCommas(ordersAnalytics.unpaidOrders, 0)}
                </p>
                <p className="text-sm mt-1" style={{ color: theme.colors.accent.yellow }}>
                  ${formatNumberWithCommas(ordersAnalytics.unpaidRevenue)}
                </p>
              </div>
              <div className="p-4 rounded-xl" style={{ background: theme.colors.accent.blue + '20' }}>
                <p className="text-sm mb-1" style={{ color: theme.colors.accent.blue }}>Free Orders</p>
                <p className="text-3xl font-bold" style={{ color: theme.colors.accent.blue }}>
                  {formatNumberWithCommas(ordersAnalytics.freeOrders, 0)}
                </p>
                <p className="text-sm mt-1" style={{ color: theme.colors.accent.blue }}>
                  $0.00
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Filtered Orders List */}
        {filteredOrders.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold" style={{ color: '#000000' }}>
                {selectedPaymentStatus === 'all' ? 'All Orders' : 
                 selectedPaymentStatus === PaymentStatus.PAID ? 'Paid Orders' :
                 selectedPaymentStatus === PaymentStatus.UNPAID ? 'Unpaid Orders' : 'Free Orders'}
              </h2>
              <p style={{ color: '#000000' }} className="mt-1">
                {filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'} found
              </p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#000000' }}>Order ID</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#000000' }}>Customer</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#000000' }}>Created By</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#000000' }}>Items</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#000000' }}>Total</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#000000' }}>Payment Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#000000' }}>Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium" style={{ color: '#000000' }}>
                        #{order.id.toString().padStart(4, '0')}
                      </td>
                      <td className="px-6 py-4" style={{ color: '#000000' }}>
                        {order.customer?.name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4" style={{ color: '#000000' }}>
                        {order.user?.role === 'child' ? (
                          <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                            {order.user.firstName} {order.user.lastName}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4" style={{ color: '#000000' }}>
                        {order.orderItems?.length || 0} items
                      </td>
                      <td className="px-6 py-4 font-semibold" style={{ 
                        color: order.paymentStatus === PaymentStatus.PAID ? theme.colors.accent.green : '#000000' 
                      }}>
                        ${formatNumberWithCommas(order.totalPrice || 0)}
                      </td>
                      <td className="px-6 py-4">
                        {getPaymentStatusBadge(order.paymentStatus)}
                      </td>
                      <td className="px-6 py-4" style={{ color: '#000000' }}>
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {report && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl">
                <h3 className="text-sm opacity-90 mb-2">Total Sales</h3>
                <p className="text-4xl font-bold mb-1">{formatNumberWithCommas(report.totalSales, 0)}</p>
                <p className="text-sm opacity-75">units sold</p>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-xl">
                <h3 className="text-sm opacity-90 mb-2">Total Revenue</h3>
                <p className="text-4xl font-bold mb-1">${formatNumberWithCommas(report.totalRevenue)}</p>
                <p className="text-sm opacity-75">from sales</p>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
                <h3 className="text-sm opacity-90 mb-2">Gross Profit</h3>
                <p className="text-4xl font-bold mb-1">${formatNumberWithCommas(report.grossProfit)}</p>
                <p className="text-sm opacity-75">after costs</p>
              </div>

              <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl p-6 text-white shadow-xl">
                <h3 className="text-sm opacity-90 mb-2">Profit Margin</h3>
                <p className="text-4xl font-bold mb-1">{formatNumberWithCommas(report.profitMargin, 1)}%</p>
                <p className="text-sm opacity-75">overall margin</p>
              </div>
            </div>

            {/* Item Breakdown Table */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold" style={{ color: '#000000' }}>Item Breakdown</h2>
                <p style={{ color: '#000000' }} className="mt-1">
                  Period: {new Date(report.period.startDate).toLocaleDateString()} - {new Date(report.period.endDate).toLocaleDateString()}
                </p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#000000' }}>Item Name</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#000000' }}>Units Sold</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#000000' }}>Revenue</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#000000' }}>Cost</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#000000' }}>Profit</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#000000' }}>Profit Margin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {report.itemBreakdown.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center" style={{ color: '#000000' }}>
                          No sales data for this period
                        </td>
                      </tr>
                    ) : (
                      report.itemBreakdown.map((item) => {
                        const margin = item.revenue > 0 ? (item.profit / item.revenue) * 100 : 0;
                        return (
                          <tr key={item.itemId} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 font-medium" style={{ color: '#000000' }}>{item.itemName}</td>
                            <td className="px-6 py-4" style={{ color: '#000000' }}>{formatNumberWithCommas(item.unitsSold, 0)}</td>
                            <td className="px-6 py-4 text-green-600 font-semibold">
                              ${formatNumberWithCommas(item.revenue)}
                            </td>
                            <td className="px-6 py-4 text-red-600">
                              ${formatNumberWithCommas(item.cost)}
                            </td>
                            <td className="px-6 py-4">
                              <span style={{
                                color: item.profit >= 0 ? theme.colors.accent.green : theme.colors.accent.red
                              }} className="font-bold">
                                ${formatNumberWithCommas(item.profit)}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span style={{
                                background: margin >= 20 
                                  ? theme.colors.accent.green + '20'
                                  : margin >= 10
                                  ? theme.colors.accent.yellow + '20'
                                  : theme.colors.accent.red + '20',
                                color: margin >= 20
                                  ? theme.colors.accent.green
                                  : margin >= 10
                                  ? theme.colors.accent.yellow
                                  : theme.colors.accent.red,
                              }} className="px-3 py-1 rounded-full text-sm font-medium">
                                {formatNumberWithCommas(margin, 1)}%
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  {report.itemBreakdown.length > 0 && (
                    <tfoot className="bg-gray-900 text-white font-bold">
                      <tr>
                        <td className="px-6 py-4">TOTAL</td>
                        <td className="px-6 py-4">{formatNumberWithCommas(report.totalSales, 0)}</td>
                        <td className="px-6 py-4">${formatNumberWithCommas(report.totalRevenue)}</td>
                        <td className="px-6 py-4">${formatNumberWithCommas(report.totalCosts)}</td>
                        <td className="px-6 py-4">${formatNumberWithCommas(report.grossProfit)}</td>
                        <td className="px-6 py-4">{formatNumberWithCommas(report.profitMargin, 1)}%</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
