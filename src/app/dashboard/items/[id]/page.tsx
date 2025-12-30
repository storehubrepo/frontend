'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { itemsApi, CreateItemDto, Item } from '@/lib/api/items';
import { recipesApi, Recipe } from '@/lib/api/items';
import { getAuthToken } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import theme from '@/styles/theme';

interface RecipeIngredient {
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  unit: string;
}

export default function ItemDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [item, setItem] = useState<Item | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<Partial<CreateItemDto>>({
    name: '',
    description: '',
    category: '',
    unit: 'piece',
    purchasePrice: undefined,
    sellingPrice: undefined,
    laborCost: 0,
    utilitiesCost: 0,
    recipeYield: undefined,
  });
  const [availableItems, setAvailableItems] = useState<Item[]>([]);
  const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredient[]>([]);

  useEffect(() => {
    loadItem();
    loadAvailableItems();
  }, [params.id]);

  const loadItem = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      if (!token) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }
      const items = await itemsApi.getAll(token);
      const foundItem = items.find(i => i.id === params.id);
      
      if (!foundItem) {
        setError('Item not found');
        setLoading(false);
        return;
      }

      setItem(foundItem);
      setFormData({
        name: foundItem.name,
        description: foundItem.description || '',
        category: foundItem.category,
        unit: foundItem.unit,
        purchasePrice: foundItem.purchasePrice,
        sellingPrice: foundItem.sellingPrice,
        laborCost: foundItem.laborCost || 0,
        utilitiesCost: foundItem.utilitiesCost || 0,
        recipeYield: foundItem.recipeYield,
      });

      // Load recipes if manufactured item
      if (foundItem.type === 'manufactured') {
        const itemRecipes = await recipesApi.getByItem(params.id, token);
        setRecipes(itemRecipes);
        
        // Convert recipes to ingredient format
        const ingredients = await Promise.all(
          itemRecipes.map(async (recipe) => {
            const childItem = (await itemsApi.getAll(token)).find(i => i.id === recipe.childItemId);
            return {
              ingredientId: recipe.childItemId,
              ingredientName: childItem?.name || 'Unknown',
              quantity: recipe.quantityNeeded,
              unit: childItem?.unit || 'piece',
            };
          })
        );
        setRecipeIngredients(ingredients);
      }

      setLoading(false);
    } catch (err) {
      console.error('Failed to load item:', err);
      setError('Failed to load item');
      setLoading(false);
    }
  };

  const loadAvailableItems = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;
      const items = await itemsApi.getAll(token);
      setAvailableItems(items.filter(i => i.type === 'raw_material'));
    } catch (err) {
      console.error('Failed to load items:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError('');

      const token = getAuthToken();
      if (!token) {
        setError('Not authenticated');
        setSaving(false);
        return;
      }

      await itemsApi.update(params.id, formData, token);

      // Update recipes if manufactured item
      if (item?.type === 'manufactured') {
        // Delete old recipes
        for (const recipe of recipes) {
          await recipesApi.delete(recipe.id, token);
        }

        // Create new recipes
        const newRecipes = recipeIngredients.map(ing => ({
          parentItemId: params.id,
          childItemId: ing.ingredientId,
          quantityNeeded: ing.quantity,
        }));

        if (newRecipes.length > 0) {
          await recipesApi.bulkCreate(params.id, newRecipes, token);
        }
      }

      router.push('/dashboard/items');
    } catch (err: any) {
      console.error('Failed to update item:', err);
      setError(err.message || 'Failed to update item');
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this item?')) {
      return;
    }

    try {
      setSaving(true);
      
      const token = getAuthToken();
      if (!token) {
        setError('Not authenticated');
        setSaving(false);
        return;
      }

      // Delete recipes first if manufactured
      if (item?.type === 'manufactured') {
        for (const recipe of recipes) {
          await recipesApi.delete(recipe.id, token);
        }
      }

      await itemsApi.delete(params.id, token);
      router.push('/dashboard/items');
    } catch (err: any) {
      console.error('Failed to delete item:', err);
      setError(err.message || 'Failed to delete item');
      setSaving(false);
    }
  };

  const addIngredient = (ingredientId: string, quantity: number) => {
    const ingredient = availableItems.find(i => i.id === ingredientId);
    if (!ingredient) return;

    setRecipeIngredients([
      ...recipeIngredients,
      {
        ingredientId,
        ingredientName: ingredient.name,
        quantity,
        unit: ingredient.unit,
      },
    ]);
  };

  const removeIngredient = (ingredientId: string) => {
    setRecipeIngredients(recipeIngredients.filter(ing => ing.ingredientId !== ingredientId));
  };

  if (loading) {
    return (
      <div style={{ 
        padding: '2rem',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px',
      }}>
        <p style={{ color: '#000000', fontSize: '1.1rem' }}>Loading item...</p>
      </div>
    );
  }

  if (error && !item) {
    return (
      <div style={{ padding: '2rem' }}>
        <p style={{ color: theme.colors.status.error, marginBottom: '1rem' }}>{error}</p>
        <Button onClick={() => router.push('/dashboard/items')}>Back to Items</Button>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '2rem',
      maxWidth: '1000px',
      margin: '0 auto',
    }}>
      <div style={{ marginBottom: '2rem' }}>
        <Button 
          onClick={() => router.push('/dashboard/items')}
          style={{ marginBottom: '1rem' }}
        >
          ← Back to Items
        </Button>
        <h1 style={{ 
          fontSize: '2rem',
          fontWeight: 'bold',
          marginBottom: '0.5rem',
          color: '#000000',
        }}>
          Edit Item
        </h1>
        <p style={{ color: '#000000' }}>
          {item?.type === 'raw_material' ? 'Raw Material' : 'Manufactured Product'}
        </p>
      </div>

      {error && (
        <div style={{
          padding: '1rem',
          backgroundColor: '#fee',
          border: `1px solid ${theme.colors.status.error}`,
          borderRadius: theme.borderRadius.md,
          marginBottom: '1.5rem',
        }}>
          <p style={{ color: theme.colors.status.error }}>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ 
          display: 'grid',
          gap: '1.5rem',
        }}>
          {/* Basic Information */}
          <div style={{
            padding: '1.5rem',
            backgroundColor: theme.colors.background.card,
            borderRadius: theme.borderRadius.md,
            border: `1px solid ${theme.colors.border}`,
          }}>
            <h2 style={{ 
              fontSize: '1.25rem',
              fontWeight: '600',
              marginBottom: '1rem',
              color: '#000000',
            }}>
              Basic Information
            </h2>

            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={{ 
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  color: '#000000',
                }}>
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: theme.borderRadius.sm,
                    fontSize: '1rem',
                    color: '#000000',
                  }}
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  color: '#000000',
                }}>
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: theme.borderRadius.sm,
                    fontSize: '1rem',
                    color: '#000000',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ 
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '500',
                    color: '#000000',
                  }}>
                    Category
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: theme.borderRadius.sm,
                      fontSize: '1rem',
                      color: '#000000',
                    }}
                  />
                </div>

                <div>
                  <label style={{ 
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '500',
                    color: '#000000',
                  }}>
                    Unit *
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value as any })}
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: theme.borderRadius.sm,
                      fontSize: '1rem',
                      color: '#000000',
                    }}
                  >
                    <option value="kg">Kilogram (kg)</option>
                    <option value="gram">Gram (g)</option>
                    <option value="liter">Liter (L)</option>
                    <option value="ml">Milliliter (ml)</option>
                    <option value="piece">Piece</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div style={{
            padding: '1.5rem',
            backgroundColor: theme.colors.background.card,
            borderRadius: theme.borderRadius.md,
            border: `1px solid ${theme.colors.border}`,
          }}>
            <h2 style={{ 
              fontSize: '1.25rem',
              fontWeight: '600',
              marginBottom: '1rem',
              color: '#000000',
            }}>
              Pricing
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {item?.type === 'raw_material' && (
                <div>
                  <label style={{ 
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '500',
                    color: '#000000',
                  }}>
                    Purchase Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.purchasePrice || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      purchasePrice: e.target.value ? parseFloat(e.target.value) : undefined 
                    })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: theme.borderRadius.sm,
                      fontSize: '1rem',
                      color: '#000000',
                    }}
                  />
                </div>
              )}

              <div>
                <label style={{ 
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  color: '#000000',
                }}>
                  Selling Price
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.sellingPrice || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    sellingPrice: e.target.value ? parseFloat(e.target.value) : undefined 
                  })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: theme.borderRadius.sm,
                    fontSize: '1rem',
                    color: '#000000',
                  }}
                />
              </div>

              {item?.type === 'manufactured' && (
                <>
                  <div>
                    <label style={{ 
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontWeight: '500',
                      color: '#000000',
                    }}>
                      Labor Cost
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.laborCost || 0}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        laborCost: parseFloat(e.target.value) || 0 
                      })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: `1px solid ${theme.colors.border}`,
                        borderRadius: theme.borderRadius.sm,
                        fontSize: '1rem',
                        color: '#000000',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ 
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontWeight: '500',
                      color: '#000000',
                    }}>
                      Utilities Cost
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.utilitiesCost || 0}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        utilitiesCost: parseFloat(e.target.value) || 0 
                      })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: `1px solid ${theme.colors.border}`,
                        borderRadius: theme.borderRadius.sm,
                        fontSize: '1rem',
                        color: '#000000',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ 
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontWeight: '500',
                      color: '#000000',
                    }}>
                      Recipe Yield
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.recipeYield || ''}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        recipeYield: e.target.value ? parseFloat(e.target.value) : undefined 
                      })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: `1px solid ${theme.colors.border}`,
                        borderRadius: theme.borderRadius.sm,
                        fontSize: '1rem',
                        color: '#000000',
                      }}
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Recipe (for manufactured items) */}
          {item?.type === 'manufactured' && (
            <div style={{
              padding: '1.5rem',
              backgroundColor: theme.colors.background.card,
              borderRadius: theme.borderRadius.md,
              border: `1px solid ${theme.colors.border}`,
            }}>
              <h2 style={{ 
                fontSize: '1.25rem',
                fontWeight: '600',
                marginBottom: '1rem',
                color: '#000000',
              }}>
                Recipe
              </h2>

              <div style={{ marginBottom: '1rem' }}>
                {recipeIngredients.map((ing) => (
                  <div
                    key={ing.ingredientId}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.75rem',
                      marginBottom: '0.5rem',
                      backgroundColor: theme.colors.background.secondary,
                      borderRadius: theme.borderRadius.sm,
                    }}
                  >
                    <span style={{ color: '#000000' }}>
                      {ing.ingredientName} - {ing.quantity} {ing.unit}
                    </span>
                    <Button
                      type="button"
                      onClick={() => removeIngredient(ing.ingredientId)}
                      style={{
                        padding: '0.25rem 0.75rem',
                        backgroundColor: theme.colors.status.error,
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ 
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '500',
                    color: '#000000',
                  }}>
                    Ingredient
                  </label>
                  <select
                    value=""
                    onChange={(e) => {
                      const quantity = prompt('Enter quantity:');
                      if (quantity && e.target.value) {
                        addIngredient(e.target.value, parseFloat(quantity));
                        e.target.value = '';
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: theme.borderRadius.sm,
                      fontSize: '1rem',
                      color: '#000000',
                    }}
                  >
                    <option value="">Select ingredient...</option>
                    {availableItems
                      .filter(i => !recipeIngredients.find(ing => ing.ingredientId === i.id))
                      .map(item => (
                        <option key={item.id} value={item.id}>
                          {item.name} ({item.unit})
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ 
            display: 'flex',
            gap: '1rem',
            justifyContent: 'space-between',
          }}>
            <Button
              type="button"
              onClick={handleDelete}
              disabled={saving}
              style={{
                backgroundColor: theme.colors.status.error,
              }}
            >
              Delete Item
            </Button>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <Button
                type="button"
                onClick={() => router.push('/dashboard/items')}
                disabled={saving}
                style={{
                  backgroundColor: theme.colors.text.secondary,
                }}
              >
                Cancel
              </Button>

              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
