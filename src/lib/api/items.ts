import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface Item {
  id: string;
  name: string;
  description?: string;
  type: 'raw_material' | 'manufactured';
  category?: string;
  unit: 'piece' | 'dozen' | 'box' | 'pack' | 'kg' | 'gram' | 'liter' | 'ml' | 'gallon' | 'cup' | 'tablespoon' | 'teaspoon' | 'ounce' | 'pound';
  purchasePrice?: number;
  sellingPrice?: number;
  laborCost: number;
  utilitiesCost: number;
  stockQuantity: number;
  recipeYield?: number;
  recipes?: Recipe[];
  createdAt: string;
  updatedAt: string;
}

export interface Recipe {
  id: string;
  parentItemId: string;
  childItemId: string;
  childItem?: Item;
  quantityNeeded: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateItemDto {
  name: string;
  description?: string;
  type: 'raw_material' | 'manufactured';
  category?: string;
  unit: 'piece' | 'dozen' | 'box' | 'pack' | 'kg' | 'gram' | 'liter' | 'ml' | 'gallon' | 'cup' | 'tablespoon' | 'teaspoon' | 'ounce' | 'pound';
  purchasePrice?: number;
  sellingPrice?: number;
  laborCost?: number;
  utilitiesCost?: number;
  stockQuantity?: number;
  recipeYield?: number;
}

export interface CreateRecipeDto {
  parentItemId: string;
  childItemId: string;
  quantityNeeded: number;
}

export const itemsApi = {
  async getAll(token: string, type?: string): Promise<Item[]> {
    const params = type ? { type } : {};
    const response = await axios.get(`${API_URL}/items`, {
      headers: { Authorization: `Bearer ${token}` },
      params,
    });
    return response.data;
  },

  async getOne(id: string, token: string): Promise<Item> {
    const response = await axios.get(`${API_URL}/items/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async create(data: CreateItemDto, token: string): Promise<Item> {
    const response = await axios.post(`${API_URL}/items`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async update(id: string, data: Partial<CreateItemDto>, token: string): Promise<Item> {
    const response = await axios.patch(`${API_URL}/items/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async delete(id: string, token: string): Promise<void> {
    await axios.delete(`${API_URL}/items/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  async calculateCost(id: string, token: string): Promise<{ itemId: string; totalCost: number }> {
    const response = await axios.get(`${API_URL}/items/${id}/cost`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
};

export const recipesApi = {
  async getByItem(parentItemId: string, token: string): Promise<Recipe[]> {
    const response = await axios.get(`${API_URL}/recipes/item/${parentItemId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async create(data: CreateRecipeDto, token: string): Promise<Recipe> {
    const response = await axios.post(`${API_URL}/recipes`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async bulkCreate(parentItemId: string, recipes: CreateRecipeDto[], token: string): Promise<Recipe[]> {
    const response = await axios.post(
      `${API_URL}/recipes/bulk`,
      { parentItemId, recipes },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  async delete(id: string, token: string): Promise<void> {
    await axios.delete(`${API_URL}/recipes/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};
