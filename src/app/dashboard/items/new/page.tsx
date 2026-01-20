'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { itemsApi, CreateItemDto, Item } from '@/lib/api/items';
import { recipesApi } from '@/lib/api/items';
import { getAuthToken } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { NumberInput } from '@/components/ui/NumberInput';
import { formatNumberWithCommas } from '@/lib/utils/numberFormat';
import theme from '@/styles/theme';

interface RecipeIngredient {
  ingredientId: string;
  quantity: number;
}

export default function NewItemPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<CreateItemDto>({
    name: '',
    description: '',
    type: 'raw_material',
    category: '',
    unit: 'piece',
    purchasePrice: undefined,
    sellingPrice: undefined,
    laborCost: 0,
    utilitiesCost: 0,
    stockQuantity: 0,
    recipeYield: undefined,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Recipe builder state
  const [availableItems, setAvailableItems] = useState<Item[]>([]);
  const [recipe, setRecipe] = useState<RecipeIngredient[]>([]);
  const [selectedIngredientId, setSelectedIngredientId] = useState('');
  const [ingredientQuantity, setIngredientQuantity] = useState<number>(0);
  
  // Categories management
  const [rawMaterialCategories, setRawMaterialCategories] = useState<string[]>([]);
  const [productCategories, setProductCategories] = useState<string[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  useEffect(() => {
    loadAvailableItems();
    loadCategoriesFromStorage();
  }, []);

  const loadAvailableItems = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;
      
      const items = await itemsApi.getAll(token);
      setAvailableItems(items);
      
      // Extract unique categories from existing items - separated by type
      const rawMaterialItems = items.filter(item => item.type === 'raw_material');
      const productItems = items.filter(item => item.type === 'manufactured');
      
      const uniqueRawCategories = Array.from(new Set(rawMaterialItems.map(item => item.category).filter(Boolean))) as string[];
      const uniqueProductCategories = Array.from(new Set(productItems.map(item => item.category).filter(Boolean))) as string[];
      
      if (uniqueRawCategories.length > 0) {
        const savedRawCategories = JSON.parse(localStorage.getItem('raw_material_categories') || '[]');
        const mergedRawCategories = Array.from(new Set([...savedRawCategories, ...uniqueRawCategories]));
        setRawMaterialCategories(mergedRawCategories);
        localStorage.setItem('raw_material_categories', JSON.stringify(mergedRawCategories));
      }
      
      if (uniqueProductCategories.length > 0) {
        const savedProductCategories = JSON.parse(localStorage.getItem('product_categories') || '[]');
        const mergedProductCategories = Array.from(new Set([...savedProductCategories, ...uniqueProductCategories]));
        setProductCategories(mergedProductCategories);
        localStorage.setItem('product_categories', JSON.stringify(mergedProductCategories));
      }
    } catch (error) {
      console.error('Failed to load items:', error);
    }
  };

  const loadCategoriesFromStorage = () => {
    const savedRawCategories = localStorage.getItem('raw_material_categories');
    const savedProductCategories = localStorage.getItem('product_categories');
    
    if (savedRawCategories) {
      setRawMaterialCategories(JSON.parse(savedRawCategories));
    }
    if (savedProductCategories) {
      setProductCategories(JSON.parse(savedProductCategories));
    }
  };

  const addCategory = () => {
    const isRawMaterial = formData.type === 'raw_material';
    const currentCategories = isRawMaterial ? rawMaterialCategories : productCategories;
    
    if (newCategory.trim() && !currentCategories.includes(newCategory.trim())) {
      const updatedCategories = [...currentCategories, newCategory.trim()];
      
      if (isRawMaterial) {
        setRawMaterialCategories(updatedCategories);
        localStorage.setItem('raw_material_categories', JSON.stringify(updatedCategories));
      } else {
        setProductCategories(updatedCategories);
        localStorage.setItem('product_categories', JSON.stringify(updatedCategories));
      }
      
      setFormData({ ...formData, category: newCategory.trim() });
      setNewCategory('');
      setShowCategoryModal(false);
    }
  };

  const deleteCategory = (categoryToDelete: string) => {
    const isRawMaterial = formData.type === 'raw_material';
    const currentCategories = isRawMaterial ? rawMaterialCategories : productCategories;
    const updatedCategories = currentCategories.filter(c => c !== categoryToDelete);
    
    if (isRawMaterial) {
      setRawMaterialCategories(updatedCategories);
      localStorage.setItem('raw_material_categories', JSON.stringify(updatedCategories));
    } else {
      setProductCategories(updatedCategories);
      localStorage.setItem('product_categories', JSON.stringify(updatedCategories));
    }
    
    if (formData.category === categoryToDelete) {
      setFormData({ ...formData, category: '' });
    }
  };

  const addIngredientToRecipe = () => {
    if (!selectedIngredientId || ingredientQuantity <= 0) {
      alert('Please select an ingredient and enter a valid quantity');
      return;
    }

    const alreadyExists = recipe.find(r => r.ingredientId === selectedIngredientId);
    if (alreadyExists) {
      alert('This ingredient is already in the recipe. Remove it first to change quantity.');
      return;
    }

    setRecipe([...recipe, { ingredientId: selectedIngredientId, quantity: ingredientQuantity }]);
    setSelectedIngredientId('');
    setIngredientQuantity(0);
  };

  const removeIngredient = (ingredientId: string) => {
    setRecipe(recipe.filter(r => r.ingredientId !== ingredientId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation for manufactured products
    if (formData.type === 'manufactured' && recipe.length === 0) {
      setError('Manufactured products must have at least one ingredient in the recipe');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const token = getAuthToken();
      if (!token) {
        router.push('/login');
        return;
      }

      // Create the item first
      const createdItem = await itemsApi.create(formData, token);
      
      // If it's a manufactured product with recipe, create the recipe
      if (formData.type === 'manufactured' && recipe.length > 0) {
        const recipeDto = recipe.map(r => ({
          parentItemId: createdItem.id,
          childItemId: r.ingredientId,
          quantityNeeded: r.quantity,
        }));
        await recipesApi.bulkCreate(createdItem.id, recipeDto, token);
      }
      
      router.push('/dashboard/items');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create item');
    } finally {
      setLoading(false);
    }
  };

  const getIngredientById = (id: string) => availableItems.find(item => item.id === id);

  // Calculate total recipe cost
  const calculateRecipeCost = () => {
    return recipe.reduce((total, recipeItem) => {
      const ingredient = getIngredientById(recipeItem.ingredientId);
      const ingredientCost = ingredient?.purchasePrice || 0;
      return total + (ingredientCost * recipeItem.quantity);
    }, 0);
  };

  // Calculate cost per unit (total cost / yield)
  const calculateCostPerUnit = () => {
    const totalCost = calculateRecipeCost();
    const yield_ = formData.recipeYield || 1;
    return totalCost / yield_;
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ background: theme.colors.background.secondary }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center mb-4 hover:opacity-70 transition-opacity text-sm sm:text-base"
            style={{ color: theme.colors.text.secondary }}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: theme.colors.text.primary }}>
            Add New Item
          </h1>
          <p className="text-sm sm:text-base" style={{ color: theme.colors.text.secondary }}>
            Create a new raw material or product
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div
              className="p-4 rounded-lg"
              style={{ background: `${theme.colors.accent.red}20`, border: `1px solid ${theme.colors.accent.red}` }}
            >
              <p className="text-sm" style={{ color: theme.colors.accent.red }}>{error}</p>
            </div>
          )}

          <div
            className="rounded-xl p-6"
            style={{
              background: theme.colors.background.card,
              border: `1px solid ${theme.colors.border}`,
              boxShadow: theme.shadows.sm,
            }}
          >
            {/* Item Type */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text.primary }}>
                Item Type *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, type: 'raw_material' });
                    setRecipe([]);
                  }}
                  className="p-4 rounded-xl transition-all"
                  style={{
                    background: formData.type === 'raw_material' ? theme.colors.primary.black : theme.colors.background.secondary,
                    border: `2px solid ${formData.type === 'raw_material' ? theme.colors.primary.black : theme.colors.border}`,
                    color: formData.type === 'raw_material' ? 'white' : theme.colors.text.primary,
                  }}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">📦</div>
                    <div className="font-semibold">Raw Material</div>
                    <div className="text-xs mt-1 opacity-70">Ingredients you purchase</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'manufactured' })}
                  className="p-4 rounded-xl transition-all"
                  style={{
                    background: formData.type === 'manufactured' ? theme.colors.primary.black : theme.colors.background.secondary,
                    border: `2px solid ${formData.type === 'manufactured' ? theme.colors.primary.black : theme.colors.border}`,
                    color: formData.type === 'manufactured' ? 'white' : theme.colors.text.primary,
                  }}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">🏭</div>
                    <div className="font-semibold">Product</div>
                    <div className="text-xs mt-1 opacity-70">Items you make & sell</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Basic Info */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text.primary }}>
                Item Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full h-12 px-4 rounded-xl"
                style={{
                  background: theme.colors.background.secondary,
                  border: `2px solid ${theme.colors.border}`,
                  color: theme.colors.text.primary,
                }}
                placeholder="e.g., Coffee Beans, Latte Cup"
                required
              />
            </div>

            {/* Category */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium" style={{ color: theme.colors.text.primary }}>
                  Category
                </label>
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(true)}
                  className="text-xs px-3 py-1 rounded-lg hover:opacity-70 transition-opacity"
                  style={{ background: theme.colors.accent.blue, color: 'white' }}
                >
                  + Manage Categories
                </button>
              </div>
              <select
                value={formData.category || ''}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full h-12 px-4 rounded-xl"
                style={{
                  background: theme.colors.background.secondary,
                  border: `2px solid ${theme.colors.border}`,
                  color: theme.colors.text.primary,
                }}
              >
                <option value="">No Category</option>
                {(formData.type === 'raw_material' ? rawMaterialCategories : productCategories).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text.primary }}>
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full h-24 px-4 py-3 rounded-xl resize-none"
                style={{
                  background: theme.colors.background.secondary,
                  border: `2px solid ${theme.colors.border}`,
                  color: theme.colors.text.primary,
                }}
                placeholder="Optional description..."
              />
            </div>

            {/* Unit */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text.primary }}>
                Unit of Measurement *
              </label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value as any })}
                className="w-full h-12 px-4 rounded-xl"
                style={{
                  background: theme.colors.background.secondary,
                  border: `2px solid ${theme.colors.border}`,
                  color: theme.colors.text.primary,
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

            {/* Price Fields */}
            {formData.type === 'raw_material' ? (
              <div className="mb-6">
                <NumberInput
                  label="Purchase Price per Unit ($)"
                  value={formData.purchasePrice || 0}
                  onChange={(value) => setFormData({ ...formData, purchasePrice: value })}
                  min={0}
                  allowDecimals={true}
                  className="w-full h-12 px-4 rounded-xl"
                  style={{
                    background: theme.colors.background.secondary,
                    border: `2px solid ${theme.colors.border}`,
                    color: theme.colors.text.primary,
                  }}
                  placeholder="0.00"
                />
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <NumberInput
                    label="Selling Price ($) *"
                    value={formData.sellingPrice || 0}
                    onChange={(value) => setFormData({ ...formData, sellingPrice: value })}
                    min={0}
                    allowDecimals={true}
                    className="w-full h-12 px-4 rounded-xl"
                    style={{
                      background: theme.colors.background.secondary,
                      border: `2px solid ${theme.colors.border}`,
                      color: theme.colors.text.primary,
                    }}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div>
                    <NumberInput
                      label="Labor Cost ($)"
                      value={formData.laborCost}
                      onChange={(value) => setFormData({ ...formData, laborCost: value })}
                      min={0}
                      allowDecimals={true}
                      className="w-full h-12 px-4 rounded-xl"
                      style={{
                        background: theme.colors.background.secondary,
                        border: `2px solid ${theme.colors.border}`,
                        color: theme.colors.text.primary,
                      }}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <NumberInput
                      label="Utilities Cost ($)"
                      value={formData.utilitiesCost}
                      onChange={(value) => setFormData({ ...formData, utilitiesCost: value })}
                      min={0}
                      allowDecimals={true}
                      className="w-full h-12 px-4 rounded-xl"
                      style={{
                        background: theme.colors.background.secondary,
                        border: `2px solid ${theme.colors.border}`,
                        color: theme.colors.text.primary,
                      }}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <NumberInput
                    label="Recipe Yield *"
                    value={formData.recipeYield || 0}
                    onChange={(value) => setFormData({ ...formData, recipeYield: value })}
                    min={0}
                    allowDecimals={true}
                    className="w-full h-12 px-4 rounded-xl"
                    style={{
                      background: theme.colors.background.secondary,
                      border: `2px solid ${theme.colors.border}`,
                      color: theme.colors.text.primary,
                    }}
                    placeholder="e.g., 24 (if recipe makes 24 units)"
                    required
                  />
                  <p className="text-xs mt-1" style={{ color: theme.colors.text.secondary }}>
                    How many units this recipe produces
                  </p>
                </div>
              </>
            )}

            {/* Stock */}
            <div>
              <NumberInput
                label="Initial Stock Quantity"
                value={formData.stockQuantity}
                onChange={(value) => setFormData({ ...formData, stockQuantity: value })}
                min={0}
                allowDecimals={true}
                className="w-full h-12 px-4 rounded-xl"
                style={{
                  background: theme.colors.background.secondary,
                  border: `2px solid ${theme.colors.border}`,
                  color: theme.colors.text.primary,
                }}
                placeholder="0"
              />
            </div>
          </div>

          {/* Recipe Builder - Only for Manufactured Products */}
          {formData.type === 'manufactured' && (
            <div
              className="rounded-xl p-6"
              style={{
                background: theme.colors.background.card,
                border: `2px solid ${theme.colors.accent.blue}`,
                boxShadow: theme.shadows.sm,
              }}
            >
              <h2 className="text-xl font-bold mb-4" style={{ color: theme.colors.text.primary }}>
                Recipe Builder *
              </h2>
              <p className="text-sm mb-4" style={{ color: theme.colors.text.secondary }}>
                Add ingredients or components that make up this product
              </p>

              {/* Add Ingredient Form */}
              <div className="mb-6 p-4 rounded-lg" style={{ background: theme.colors.background.secondary }}>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-6">
                    <label className="block text-xs font-medium mb-2" style={{ color: theme.colors.text.primary }}>
                      Select Ingredient
                    </label>
                    <select
                      value={selectedIngredientId}
                      onChange={(e) => setSelectedIngredientId(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg text-sm"
                      style={{
                        background: theme.colors.background.card,
                        border: `1px solid ${theme.colors.border}`,
                        color: theme.colors.text.primary,
                      }}
                    >
                      <option value="">Choose ingredient...</option>
                      {availableItems
                        .filter(item => !recipe.find(r => r.ingredientId === item.id))
                        .map(item => (
                          <option key={item.id} value={item.id}>
                            {item.name} ({item.unit})
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="sm:col-span-4">
                    <label className="block text-xs font-medium mb-2" style={{ color: theme.colors.text.primary }}>
                      Quantity
                    </label>
                    <NumberInput
                      value={ingredientQuantity}
                      onChange={(value) => setIngredientQuantity(value)}
                      min={0}
                      allowDecimals={true}
                      className="w-full h-10 px-3 rounded-lg text-sm"
                      style={{
                        background: theme.colors.background.card,
                        border: `1px solid ${theme.colors.border}`,
                        color: theme.colors.text.primary,
                      }}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="sm:col-span-2 flex items-end">
                    <button
                      type="button"
                      onClick={addIngredientToRecipe}
                      className="w-full h-10 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity"
                      style={{ background: theme.colors.accent.green, color: 'white' }}
                    >
                      + Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Recipe List */}
              {recipe.length === 0 ? (
                <div
                  className="p-8 rounded-lg text-center"
                  style={{
                    background: `${theme.colors.accent.red}10`,
                    border: `1px dashed ${theme.colors.accent.red}`,
                  }}
                >
                  <p style={{ color: theme.colors.accent.red }}>
                    ⚠️ No ingredients added yet. Products must have at least one ingredient.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recipe.map((recipeItem) => {
                    const ingredient = getIngredientById(recipeItem.ingredientId);
                    return (
                      <div
                        key={recipeItem.ingredientId}
                        className="flex items-center justify-between p-3 rounded-lg"
                        style={{ background: theme.colors.background.secondary }}
                      >
                        <div>
                          <div className="font-semibold" style={{ color: theme.colors.text.primary }}>
                            {ingredient?.name || 'Unknown'}
                          </div>
                          <div className="text-sm" style={{ color: theme.colors.text.secondary }}>
                            {formatNumberWithCommas(recipeItem.quantity)} {ingredient?.unit}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeIngredient(recipeItem.ingredientId)}
                          className="px-3 py-1 rounded-lg text-sm font-semibold hover:opacity-70 transition-opacity"
                          style={{ background: theme.colors.accent.red, color: 'white' }}
                        >
                          Remove
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Cost Breakdown - Only show if recipe has ingredients */}
              {recipe.length > 0 && (
                <div className="mt-6 p-4 rounded-lg" style={{ background: theme.colors.accent.blue + '15', border: `2px solid ${theme.colors.accent.blue}` }}>
                  <h3 className="font-bold mb-3" style={{ color: theme.colors.text.primary }}>💰 Cost Breakdown</h3>
                  <div className="space-y-2">
                    {recipe.map((recipeItem) => {
                      const ingredient = getIngredientById(recipeItem.ingredientId);
                      const ingredientCost = (ingredient?.purchasePrice || 0) * recipeItem.quantity;
                      return (
                        <div key={recipeItem.ingredientId} className="flex justify-between text-sm">
                          <span style={{ color: theme.colors.text.secondary }}>
                            {ingredient?.name}: {formatNumberWithCommas(recipeItem.quantity)} {ingredient?.unit} × ${formatNumberWithCommas(ingredient?.purchasePrice || 0)}
                          </span>
                          <span className="font-semibold" style={{ color: theme.colors.text.primary }}>
                            ${formatNumberWithCommas(ingredientCost)}
                          </span>
                        </div>
                      );
                    })}
                    <div className="border-t pt-2 mt-2" style={{ borderColor: theme.colors.border }}>
                      <div className="flex justify-between font-bold">
                        <span style={{ color: theme.colors.text.primary }}>Total Recipe Cost:</span>
                        <span style={{ color: theme.colors.text.primary }}>${formatNumberWithCommas(calculateRecipeCost())}</span>
                      </div>
                      <div className="flex justify-between font-bold mt-2" style={{ color: theme.colors.accent.green }}>
                        <span>Cost Per Unit (÷ {formData.recipeYield || 1}):</span>
                        <span>${formatNumberWithCommas(calculateCostPerUnit())}</span>
                      </div>
                      {formData.sellingPrice && (
                        <>
                          <div className="flex justify-between mt-2">
                            <span style={{ color: theme.colors.text.secondary }}>Selling Price:</span>
                            <span style={{ color: theme.colors.text.primary }}>${formatNumberWithCommas(formData.sellingPrice)}</span>
                          </div>
                          <div className="flex justify-between font-bold mt-2" style={{ color: formData.sellingPrice > calculateCostPerUnit() ? theme.colors.accent.green : theme.colors.accent.red }}>
                            <span>Profit Per Unit:</span>
                            <span>${formatNumberWithCommas(formData.sellingPrice - calculateCostPerUnit())}</span>
                          </div>
                          <div className="flex justify-between text-sm mt-1">
                            <span style={{ color: theme.colors.text.secondary }}>Profit Margin:</span>
                            <span style={{ color: theme.colors.text.secondary }}>
                              {((((formData.sellingPrice - calculateCostPerUnit()) / formData.sellingPrice) * 100) || 0).toFixed(1)}%
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button
              type="submit"
              disabled={loading || (formData.type === 'manufactured' && recipe.length === 0)}
              className="flex-1 h-12 rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: theme.colors.primary.black, color: 'white' }}
            >
              {loading ? 'Creating...' : 'Create Item'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 h-12 rounded-xl font-medium hover:opacity-70 transition-opacity"
              style={{
                background: theme.colors.background.secondary,
                border: `2px solid ${theme.colors.border}`,
                color: theme.colors.text.primary,
              }}
            >
              Cancel
            </button>
          </div>
        </form>

        {/* Category Management Modal */}
        {showCategoryModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div
              className="rounded-xl p-8 max-w-md w-full"
              style={{ background: theme.colors.background.card }}
            >
              <h2 className="text-2xl font-bold mb-6" style={{ color: theme.colors.text.primary }}>
                Manage Categories - {formData.type === 'raw_material' ? 'Raw Materials' : 'Products'}
              </h2>

              <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
                {(formData.type === 'raw_material' ? rawMaterialCategories : productCategories).length === 0 ? (
                  <p className="text-center py-4" style={{ color: theme.colors.text.secondary }}>
                    No categories yet for {formData.type === 'raw_material' ? 'raw materials' : 'products'}
                  </p>
                ) : (
                  (formData.type === 'raw_material' ? rawMaterialCategories : productCategories).map(cat => (
                    <div
                      key={cat}
                      className="flex items-center justify-between p-3 rounded-lg"
                      style={{ background: theme.colors.background.secondary }}
                    >
                      <span className="font-semibold" style={{ color: theme.colors.text.primary }}>
                        {cat}
                      </span>
                      <button
                        onClick={() => deleteCategory(cat)}
                        className="px-3 py-1 rounded-lg text-sm hover:opacity-70 transition-opacity"
                        style={{ background: theme.colors.accent.red, color: 'white' }}
                      >
                        Delete
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2" style={{ color: theme.colors.text.primary }}>
                  Add New Category
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="e.g., Beverages, Desserts"
                    className="flex-1 px-4 py-3 rounded-lg"
                    style={{
                      background: theme.colors.background.secondary,
                      border: `1px solid ${theme.colors.border}`,
                      color: theme.colors.text.primary,
                    }}
                    onKeyPress={(e) => e.key === 'Enter' && addCategory()}
                  />
                  <button
                    onClick={addCategory}
                    className="px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
                    style={{ background: theme.colors.accent.green, color: 'white' }}
                  >
                    Add
                  </button>
                </div>
              </div>

              <button
                onClick={() => setShowCategoryModal(false)}
                className="w-full px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
                style={{ background: theme.colors.primary.black, color: 'white' }}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
