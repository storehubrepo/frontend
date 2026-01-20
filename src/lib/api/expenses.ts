import axios from 'axios';
import { Currency } from '../utils/currency';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export enum RecurrenceCycle {
  ONCE = 'once',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
}

export interface Expense {
  id: string;
  description: string;
  type: string;
  cost: number;
  currency?: Currency;
  date: string;
  recurrenceCycle: RecurrenceCycle;
  recurrenceEndDate: string | null;
  isActive: boolean;
  notes?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExpenseDto {
  description: string;
  type: string;
  cost: number;
  currency?: Currency;
  date: string;
  recurrenceCycle?: RecurrenceCycle;
  recurrenceEndDate?: string;
  isActive?: boolean;
  notes?: string;
}

export interface UpdateExpenseDto extends Partial<CreateExpenseDto> {}

export const expensesApi = {
  async getAll(token: string): Promise<Expense[]> {
    const response = await axios.get(`${API_URL}/expenses`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async getOne(id: string, token: string): Promise<Expense> {
    const response = await axios.get(`${API_URL}/expenses/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async create(data: CreateExpenseDto, token: string): Promise<Expense> {
    const response = await axios.post(`${API_URL}/expenses`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async update(id: string, data: UpdateExpenseDto, token: string): Promise<Expense> {
    const response = await axios.patch(`${API_URL}/expenses/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async delete(id: string, token: string): Promise<void> {
    await axios.delete(`${API_URL}/expenses/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  async getTypes(token: string): Promise<string[]> {
    const response = await axios.get(`${API_URL}/expenses/types`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async calculateTotal(
    startDate: string,
    endDate: string,
    token: string,
    includeRecurring = true,
    excludeTypes: string[] = [],
  ): Promise<{ total: number }> {
    const params = new URLSearchParams({
      startDate,
      endDate,
      includeRecurring: includeRecurring.toString(),
    });
    if (excludeTypes.length > 0) {
      params.append('excludeTypes', excludeTypes.join(','));
    }
    const response = await axios.get(`${API_URL}/expenses/calculate?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
};
