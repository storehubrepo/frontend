import axios from 'axios';
import { Customer } from './customers';
import { Currency } from '../utils/currency';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface OrderItem {
  itemId: string;
  name: string;
  quantity: number;
  size?: string;
  price: number;
  currency: string;
}

export interface Order {
  id: string;
  cartName?: string;
  cartType?: string;
  items: OrderItem[];
  total: number;
  currency: Currency;
  customerId?: string;
  customer?: Customer;
  userId: string;
  createdAt: string;
}

export interface CreateOrderDto {
  cartName?: string;
  cartType?: string;
  items: OrderItem[];
  total: number;
  currency?: Currency;
  customerId?: string;
}

export interface CustomerStats {
  totalOrders: number;
  totalSpent: number;
  mostOrdered: { name: string; count: number }[];
  lastOrderDate: string | null;
}

export const ordersApi = {
  async getAll(token: string): Promise<Order[]> {
    const response = await axios.get(`${API_URL}/orders`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async getOne(id: string, token: string): Promise<Order> {
    const response = await axios.get(`${API_URL}/orders/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async getByCustomer(customerId: string, token: string): Promise<Order[]> {
    const response = await axios.get(`${API_URL}/orders/by-customer/${customerId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async getCustomerStats(customerId: string, token: string): Promise<CustomerStats> {
    const response = await axios.get(`${API_URL}/orders/customer-stats/${customerId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async create(data: CreateOrderDto, token: string): Promise<Order> {
    const response = await axios.post(`${API_URL}/orders`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async delete(id: string, token: string): Promise<void> {
    await axios.delete(`${API_URL}/orders/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};
