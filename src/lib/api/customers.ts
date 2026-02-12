import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface Customer {
  id: string;
  name: string;
  description?: string;
  phone?: string;
  email?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerDto {
  name: string;
  description?: string;
  phone?: string;
  email?: string;
}

export const customersApi = {
  async getAll(token: string): Promise<Customer[]> {
    const response = await axios.get(`${API_URL}/customers`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async search(query: string, token: string): Promise<Customer[]> {
    const response = await axios.get(`${API_URL}/customers/search`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { q: query },
    });
    return response.data;
  },

  async getOne(id: string, token: string): Promise<Customer> {
    const response = await axios.get(`${API_URL}/customers/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async create(data: CreateCustomerDto, token: string): Promise<Customer> {
    const response = await axios.post(`${API_URL}/customers`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async update(id: string, data: Partial<CreateCustomerDto>, token: string): Promise<Customer> {
    const response = await axios.patch(`${API_URL}/customers/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async delete(id: string, token: string): Promise<void> {
    await axios.delete(`${API_URL}/customers/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};
