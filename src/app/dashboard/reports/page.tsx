'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { analyticsApi, ProfitReport } from '@/lib/api/analytics';
import { getAuthToken } from '@/lib/auth';
import theme from '@/styles/theme';

export default function ReportsPage() {
  const router = useRouter();
  const [report, setReport] = useState<ProfitReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const loadReport = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      if (!token) {
        router.push('/login');
        return;
      }

      const data = await analyticsApi.getProfitReport(token, startDate, endDate);
      setReport(data);
    } catch (error) {
      console.error('Failed to load report:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, []);

  const handleGenerateReport = () => {
    loadReport();
  };

  const exportToCSV = () => {
    if (!report) return;

    const headers = ['Item Name', 'Units Sold', 'Revenue', 'Cost', 'Profit'];
    const rows = report.itemBreakdown.map(item => [
      item.itemName,
      item.unitsSold,
      item.revenue.toFixed(2),
      item.cost.toFixed(2),
      item.profit.toFixed(2),
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
      '',
      `Total Sales,${report.totalSales}`,
      `Total Revenue,${report.totalRevenue.toFixed(2)}`,
      `Total Costs,${report.totalCosts.toFixed(2)}`,
      `Gross Profit,${report.grossProfit.toFixed(2)}`,
      `Profit Margin,${report.profitMargin.toFixed(2)}%`,
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

        {report && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl">
                <h3 className="text-sm opacity-90 mb-2">Total Sales</h3>
                <p className="text-4xl font-bold mb-1">{report.totalSales.toFixed(0)}</p>
                <p className="text-sm opacity-75">units sold</p>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-xl">
                <h3 className="text-sm opacity-90 mb-2">Total Revenue</h3>
                <p className="text-4xl font-bold mb-1">${report.totalRevenue.toFixed(2)}</p>
                <p className="text-sm opacity-75">from sales</p>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
                <h3 className="text-sm opacity-90 mb-2">Gross Profit</h3>
                <p className="text-4xl font-bold mb-1">${report.grossProfit.toFixed(2)}</p>
                <p className="text-sm opacity-75">after costs</p>
              </div>

              <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl p-6 text-white shadow-xl">
                <h3 className="text-sm opacity-90 mb-2">Profit Margin</h3>
                <p className="text-4xl font-bold mb-1">{report.profitMargin.toFixed(1)}%</p>
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
                            <td className="px-6 py-4" style={{ color: '#000000' }}>{item.unitsSold.toFixed(0)}</td>
                            <td className="px-6 py-4 text-green-600 font-semibold">
                              ${item.revenue.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 text-red-600">
                              ${item.cost.toFixed(2)}
                            </td>
                            <td className="px-6 py-4">
                              <span style={{
                                color: item.profit >= 0 ? theme.colors.accent.green : theme.colors.accent.red
                              }} className="font-bold">
                                ${item.profit.toFixed(2)}
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
                                {margin.toFixed(1)}%
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
                        <td className="px-6 py-4">{report.totalSales.toFixed(0)}</td>
                        <td className="px-6 py-4">${report.totalRevenue.toFixed(2)}</td>
                        <td className="px-6 py-4">${report.totalCosts.toFixed(2)}</td>
                        <td className="px-6 py-4">${report.grossProfit.toFixed(2)}</td>
                        <td className="px-6 py-4">{report.profitMargin.toFixed(1)}%</td>
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
