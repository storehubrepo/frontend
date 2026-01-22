'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { itemsApi, CreateItemDto, Item } from '@/lib/api/items';
import { recipesApi, Recipe } from '@/lib/api/items';
import { getAuthToken } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { NumberInput } from '@/components/ui/NumberInput';
import { PriceDisplay } from '@/components/ui/PriceDisplay';
import { formatNumberWithCommas } from '@/lib/utils/numberFormat';
import { Currency, convertCurrency } from '@/lib/utils/currency';
import { useCurrency } from '@/lib/context/CurrencyContext';
import theme from '@/styles/theme';

interface RecipeIngredient {
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  unit: string;
}

export default function ItemDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { currency } = useCurrency();
  const [itemId, setItemId] = useState<string>('');
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
    // Handle params which might be a Promise in Next.js 15+
    const resolveParams = async () => {
      const resolvedParams = await Promise.resolve(params);
      setItemId(resolvedParams.id);
    };
    resolveParams();
  }, [params]);

  useEffect(() => {
    if (itemId) {
      loadItem();
      loadAvailableItems();
    }
  }, [itemId]);

  const loadItem = async () => {
    try {
      setLoading(true);
      setError('');
      const token = getAuthToken();
      if (!token) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }
      
      const foundItem = await itemsApi.getOne(itemId, token);

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
        purchasePriceCurrency: foundItem.purchasePriceCurrency,
        sellingPrice: foundItem.sellingPrice,
        sellingPriceCurrency: foundItem.sellingPriceCurrency,
        laborCost: foundItem.laborCost || 0,
        laborCostCurrency: foundItem.laborCostCurrency,
        utilitiesCost: foundItem.utilitiesCost || 0,
        utilitiesCostCurrency: foundItem.utilitiesCostCurrency,
        recipeYield: foundItem.recipeYield,
      });

      // Load recipes if manufactured item
      if (foundItem.type === 'manufactured') {
        const itemRecipes = await recipesApi.getByItem(itemId, token);
        setRecipes(itemRecipes);
        
        // Convert recipes to ingredient format
        const ingredients = await Promise.all(
          itemRecipes.map(async (recipe) => {
            try {
              const childItem = await itemsApi.getOne(recipe.childItemId, token);
              return {
                ingredientId: recipe.childItemId,
                ingredientName: childItem?.name || 'Unknown',
                quantity: recipe.quantityNeeded,
                unit: childItem?.unit || 'piece',
              };
            } catch (err) {
              console.error(`Failed to load child item ${recipe.childItemId}:`, err);
              return {
                ingredientId: recipe.childItemId,
                ingredientName: 'Unknown',
                quantity: recipe.quantityNeeded,
                unit: 'piece',
              };
            }
          })
        );
        setRecipeIngredients(ingredients);
      }

      setLoading(false);
    } catch (err: any) {
      console.error('Failed to load item:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to load item';
      setError(errorMessage);
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

      await itemsApi.update(itemId, formData, token);

      // Update recipes if manufactured item
      if (item?.type === 'manufactured') {
        // Delete old recipes
        for (const recipe of recipes) {
          await recipesApi.delete(recipe.id, token);
        }

        // Create new recipes
        const newRecipes = recipeIngredients.map(ing => ({
          parentItemId: itemId,
          childItemId: ing.ingredientId,
          quantityNeeded: ing.quantity,
        }));

        if (newRecipes.length > 0) {
          await recipesApi.bulkCreate(itemId, newRecipes, token);
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

      await itemsApi.delete(itemId, token);
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

  // Calculate total recipe cost
  const calculateRecipeCost = () => {
    return recipeIngredients.reduce((total, ing) => {
      const ingredient = availableItems.find(item => item.id === ing.ingredientId);
      const ingredientCost = ingredient?.purchasePrice || 0;
      const ingredientCurrency = ingredient?.purchasePriceCurrency || Currency.USD;
      const convertedCost = convertCurrency(ingredientCost * ing.quantity, ingredientCurrency, currency);
      return total + convertedCost;
    }, 0);
  };

  // Calculate cost per unit
  const calculateCostPerUnit = () => {
    const totalCost = calculateRecipeCost();
    const yield_ = formData.recipeYield || 1;
    return totalCost / yield_;
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
                    <option value="piece">Piece</option>
                    <option value="dozen">Dozen</option>
                    <option value="box">Box</option>
                    <option value="pack">Pack</option>
                    <option value="kg">Kilogram (kg)</option>
                    <option value="gram">Gram (g)</option>
                    <option value="liter">Liter (L)</option>
                    <option value="ml">Milliliter (ml)</option>
                    <option value="gallon">Gallon</option>
                    <option value="cup">Cup</option>
                    <option value="tablespoon">Tablespoon (tbsp)</option>
                    <option value="teaspoon">Teaspoon (tsp)</option>
                    <option value="ounce">Ounce (oz)</option>
                    <option value="pound">Pound (lb)</option>
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
                  <NumberInput
                    label="Purchase Price"
                    value={formData.purchasePrice || 0}
                    onChange={(value) => setFormData({ ...formData, purchasePrice: value })}
                    min={0}
                    allowDecimals={true}
                    className="w-full"
                    style={{
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
                <NumberInput
                  label="Selling Price"
                  value={formData.sellingPrice || 0}
                  onChange={(value) => setFormData({ ...formData, sellingPrice: value })}
                  min={0}
                  allowDecimals={true}
                  className="w-full"
                  style={{
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
                    <NumberInput
                      label="Labor Cost"
                      value={formData.laborCost || 0}
                      onChange={(value) => setFormData({ ...formData, laborCost: value })}
                      min={0}
                      allowDecimals={true}
                      className="w-full"
                      style={{
                        padding: '0.75rem',
                        border: `1px solid ${theme.colors.border}`,
                        borderRadius: theme.borderRadius.sm,
                        fontSize: '1rem',
                        color: '#000000',
                      }}
                    />
                  </div>

                  <div>
                    <NumberInput
                      label="Utilities Cost"
                      value={formData.utilitiesCost || 0}
                      onChange={(value) => setFormData({ ...formData, utilitiesCost: value })}
                      min={0}
                      allowDecimals={true}
                      className="w-full"
                      style={{
                        padding: '0.75rem',
                        border: `1px solid ${theme.colors.border}`,
                        borderRadius: theme.borderRadius.sm,
                        fontSize: '1rem',
                        color: '#000000',
                      }}
                    />
                  </div>

                  <div>
                    <NumberInput
                      label="Recipe Yield"
                      value={formData.recipeYield || 0}
                      onChange={(value) => setFormData({ ...formData, recipeYield: value })}
                      min={0}
                      allowDecimals={true}
                      className="w-full"
                      style={{
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
                      {ing.ingredientName} - {formatNumberWithCommas(ing.quantity)} {ing.unit}
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

              {/* Cost Breakdown */}
              {recipeIngredients.length > 0 && (
                <div style={{
                  marginTop: '1.5rem',
                  padding: '1rem',
                  backgroundColor: theme.colors.accent.blue + '15',
                  border: `2px solid ${theme.colors.accent.blue}`,
                  borderRadius: theme.borderRadius.sm,
                }}>
                  <h3 style={{ fontWeight: '600', marginBottom: '0.75rem', color: '#000000' }}>
                    💰 Cost Breakdown
                  </h3>
                  <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.9rem' }}>
                    {recipeIngredients.map((ing) => {
                      const ingredient = availableItems.find(item => item.id === ing.ingredientId);
                      const ingredientPrice = ingredient?.purchasePrice || 0;
                      const ingredientCurrency = ingredient?.purchasePriceCurrency || Currency.USD;
                      const ingredientCost = ingredientPrice * ing.quantity;
                      return (
                        <div key={ing.ingredientId} style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: theme.colors.text.secondary }}>
                            {ing.ingredientName}: {formatNumberWithCommas(ing.quantity)} {ing.unit} × <PriceDisplay amount={ingredientPrice} currency={ingredientCurrency} />
                          </span>
                          <span style={{ fontWeight: '600', color: '#000000' }}>
                            <PriceDisplay amount={ingredientCost} currency={ingredientCurrency} />
                          </span>
                        </div>
                      );
                    })}
                    <div style={{ borderTop: `1px solid ${theme.colors.border}`, paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                        <span style={{ color: '#000000' }}>Total Recipe Cost:</span>
                        <span style={{ color: '#000000' }}>
                          <PriceDisplay amount={calculateRecipeCost()} currency={currency} />
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginTop: '0.5rem', color: theme.colors.accent.green }}>
                        <span>Cost Per Unit (÷ {formData.recipeYield || 1}):</span>
                        <span><PriceDisplay amount={calculateCostPerUnit()} currency={currency} /></span>
                      </div>
                      {formData.sellingPrice && (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                            <span style={{ color: theme.colors.text.secondary }}>Selling Price:</span>
                            <span style={{ color: '#000000' }}>
                              <PriceDisplay amount={formData.sellingPrice} currency={item?.sellingPriceCurrency || Currency.USD} />
                            </span>
                          </div>
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            fontWeight: 'bold', 
                            marginTop: '0.5rem',
                            color: convertCurrency(formData.sellingPrice, item?.sellingPriceCurrency || Currency.USD, currency) > calculateCostPerUnit() ? theme.colors.accent.green : theme.colors.accent.red
                          }}>
                            <span>Profit Per Unit:</span>
                            <span>
                              <PriceDisplay 
                                amount={convertCurrency(formData.sellingPrice, item?.sellingPriceCurrency || Currency.USD, currency) - calculateCostPerUnit()} 
                                currency={currency} 
                              />
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                            <span style={{ color: theme.colors.text.secondary }}>Profit Margin:</span>
                            <span style={{ color: theme.colors.text.secondary }}>
                              {((((convertCurrency(formData.sellingPrice, item?.sellingPriceCurrency || Currency.USD, currency) - calculateCostPerUnit()) / convertCurrency(formData.sellingPrice, item?.sellingPriceCurrency || Currency.USD, currency)) * 100) || 0).toFixed(1)}%
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
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
