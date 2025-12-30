import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface CostBreakdown {
  itemId: string;
  itemName: string;
  type: string;
  materialCost: number;
  laborCost: number;
  utilitiesCost: number;
  totalCost: number;
  sellingPrice: number;
  profitMargin: number;
  profitPercentage: number;
}

export interface AnalyticsSummary {
  totalItems: number;
  totalStockValue: number;
  lowStockItems: number;
  totalRevenue: number;
  totalCosts: number;
  operatingExpenses?: number;
  netProfit: number;
  profitMargin: number;
  topSellingItems: Array<{ itemId: string; itemName: string; totalSold: number }>;
  costBreakdown: CostBreakdown[];
}

export interface ProfitReport {
  period: {
    startDate: string;
    endDate: string;
  };
  totalSales: number;
  totalRevenue: number;
  totalCosts: number;
  grossProfit: number;
  profitMargin: number;
  itemBreakdown: Array<{
    itemId: string;
    itemName: string;
    unitsSold: number;
    revenue: number;
    cost: number;
    profit: number;
  }>;
}

export const analyticsApi = {
  async getSummary(
    token: string,
    includeExpenses = true,
    excludeExpenseTypes: string[] = []
  ): Promise<AnalyticsSummary> {
    const params = new URLSearchParams();
    params.append('includeExpenses', includeExpenses.toString());
    if (excludeExpenseTypes.length > 0) {
      params.append('excludeExpenseTypes', excludeExpenseTypes.join(','));
    }

    const response = await axios.get(`${API_URL}/analytics/summary?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async getProfitReport(
    token: string,
    startDate?: string,
    endDate?: string,
    includeExpenses = true,
    excludeExpenseTypes: string[] = []
  ): Promise<ProfitReport> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    params.append('includeExpenses', includeExpenses.toString());
    if (excludeExpenseTypes.length > 0) {
      params.append('excludeExpenseTypes', excludeExpenseTypes.join(','));
    }
    
    const response = await axios.get(`${API_URL}/analytics/profit-report?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
};
