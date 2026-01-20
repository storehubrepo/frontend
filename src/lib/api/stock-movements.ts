import axios from 'axios';
import { Currency } from '../utils/currency';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface StockMovement {
  id: string;
  type: 'purchase' | 'sale' | 'production' | 'adjustment' | 'waste';
  quantity: number;
  unitCost?: number;
  unitCostCurrency?: Currency;
  totalCost?: number;
  date?: string;
  notes?: string;
  itemId: string;
  item?: any;
  createdAt: string;
}

export interface CreateStockMovementDto {
  type: 'purchase' | 'sale' | 'production' | 'adjustment' | 'waste';
  itemId: string;
  quantity: number;
  unitCost?: number;
  unitCostCurrency?: Currency;
  notes?: string;
}

export const stockMovementsApi = {
  async getAll(token: string, itemId?: string): Promise<StockMovement[]> {
    const params = itemId ? { itemId } : {};
    const response = await axios.get(`${API_URL}/stock-movements`, {
      headers: { Authorization: `Bearer ${token}` },
      params,
    });
    return response.data;
  },

  async getSummary(token: string): Promise<any> {
    const response = await axios.get(`${API_URL}/stock-movements/summary`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async getByDateRange(token: string, startDate: string, endDate: string): Promise<StockMovement[]> {
    const response = await axios.get(`${API_URL}/stock-movements/date-range`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { startDate, endDate },
    });
    return response.data;
  },

  async create(data: CreateStockMovementDto, token: string): Promise<StockMovement> {
    const response = await axios.post(`${API_URL}/stock-movements`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async delete(id: string, token: string): Promise<void> {
    await axios.delete(`${API_URL}/stock-movements/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};
