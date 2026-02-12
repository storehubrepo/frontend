import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface PosSettingsData {
  categoryOrder: string[];
  productOrder: Record<string, string[]>;
  cartTypes: string[];
}

export const posSettingsApi = {
  async get(token: string): Promise<PosSettingsData> {
    const response = await axios.get(`${API_URL}/pos-settings`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async update(data: Partial<PosSettingsData>, token: string): Promise<PosSettingsData> {
    const response = await axios.put(`${API_URL}/pos-settings`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
};
