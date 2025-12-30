'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { itemsApi, Item } from '@/lib/api/items';
import { stockMovementsApi } from '@/lib/api/stock-movements';
import { getAuthToken } from '@/lib/auth';
import theme from '@/styles/theme';

interface CartItem {
  item: Item;
  quantity: number;
}

interface Cart {
  id: string;
  name: string;
  type: 'table' | 'delivery' | 'takeaway';
  items: CartItem[];
  createdAt: Date;
}

export default function POSPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Item[]>([]);
  const [carts, setCarts] = useState<Cart[]>([]);
  const [activeCartId, setActiveCartId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewCartModal, setShowNewCartModal] = useState(false);
  const [showCartTypesModal, setShowCartTypesModal] = useState(false);
  const [showProductsModal, setShowProductsModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cartTypes, setCartTypes] = useState<string[]>(['table', 'delivery', 'takeaway']);
  const [newCartType, setNewCartType] = useState('');
  
  const [newCart, setNewCart] = useState({
    name: '',
    type: 'table' as 'table' | 'delivery' | 'takeaway',
  });

  useEffect(() => {
    loadProducts();
    loadCartsFromStorage();
    loadCartTypesFromStorage();
  }, []);

  const loadProducts = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        router.push('/login');
        return;
      }

      const items = await itemsApi.getAll(token);
      const manufacturedProducts = items.filter((item: Item) => item.type === 'manufactured');
      setProducts(manufacturedProducts);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCartsFromStorage = () => {
    const savedCarts = localStorage.getItem('pos_carts');
    if (savedCarts) {
      const parsedCarts = JSON.parse(savedCarts);
      setCarts(parsedCarts);
      if (parsedCarts.length > 0 && !activeCartId) {
        setActiveCartId(parsedCarts[0].id);
      }
    }
  };

  const loadCartTypesFromStorage = () => {
    const savedTypes = localStorage.getItem('pos_cart_types');
    if (savedTypes) {
      setCartTypes(JSON.parse(savedTypes));
    }
  };

  const saveCartsToStorage = (updatedCarts: Cart[]) => {
    localStorage.setItem('pos_carts', JSON.stringify(updatedCarts));
    setCarts(updatedCarts);
  };

  const saveCartTypesToStorage = (types: string[]) => {
    localStorage.setItem('pos_cart_types', JSON.stringify(types));
    setCartTypes(types);
  };

  const createCart = () => {
    const cart: Cart = {
      id: Date.now().toString(),
      name: newCart.name || `${newCart.type.charAt(0).toUpperCase() + newCart.type.slice(1)} ${carts.length + 1}`,
      type: newCart.type,
      items: [],
      createdAt: new Date(),
    };

    const updatedCarts = [...carts, cart];
    saveCartsToStorage(updatedCarts);
    setActiveCartId(cart.id);
    setShowNewCartModal(false);
    setNewCart({ name: '', type: 'table' });
  };

  const addCartType = () => {
    if (newCartType.trim() && !cartTypes.includes(newCartType.toLowerCase())) {
      const updatedTypes = [...cartTypes, newCartType.toLowerCase()];
      saveCartTypesToStorage(updatedTypes);
      setNewCartType('');
    }
  };

  const removeCartType = (type: string) => {
    if (['table', 'delivery', 'takeaway'].includes(type)) {
      alert('Cannot remove default cart types');
      return;
    }
    const updatedTypes = cartTypes.filter(t => t !== type);
    saveCartTypesToStorage(updatedTypes);
  };

  const deleteCart = (cartId: string) => {
    const updatedCarts = carts.filter(c => c.id !== cartId);
    saveCartsToStorage(updatedCarts);
    if (activeCartId === cartId) {
      setActiveCartId(updatedCarts.length > 0 ? updatedCarts[0].id : null);
    }
  };

  const addToCart = (product: Item) => {
    const cart = carts.find(c => c.id === activeCartId);
    if (!cart) return;

    const existingItem = cart.items.find(item => item.item.id === product.id);
    
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.items.push({ item: product, quantity: 1 });
    }

    const updatedCarts = carts.map(c => c.id === activeCartId ? cart : c);
    saveCartsToStorage(updatedCarts);
    setShowProductsModal(false);
  };

  // Get unique categories from products
  const getCategories = () => {
    const categories = products
      .map(p => p.category)
      .filter((category): category is string => !!category);
    return Array.from(new Set(categories));
  };

  // Get products by category
  const getProductsByCategory = (category: string) => {
    return products.filter(p => p.category === category);
  };

  // Category emojis mapping
  const categoryEmojis: { [key: string]: string } = {
    'Dairy': '🥛',
    'Desserts': '🍰',
    'Grains': '🌾',
    'Ingredients': '🧂',
    'Beverages': '☕',
    'Bakery': '🥖',
  };

  const updateQuantity = (productId: string, delta: number) => {
    const cart = carts.find(c => c.id === activeCartId);
    if (!cart) return;

    const item = cart.items.find(item => item.item.id === productId);
    if (!item) return;

    item.quantity += delta;
    
    if (item.quantity <= 0) {
      cart.items = cart.items.filter(i => i.item.id !== productId);
    }

    const updatedCarts = carts.map(c => c.id === activeCartId ? cart : c);
    saveCartsToStorage(updatedCarts);
  };

  const removeFromCart = (productId: string) => {
    const cart = carts.find(c => c.id === activeCartId);
    if (!cart) return;

    cart.items = cart.items.filter(item => item.item.id !== productId);
    const updatedCarts = carts.map(c => c.id === activeCartId ? cart : c);
    saveCartsToStorage(updatedCarts);
  };

  const getCartTotal = (cart: Cart) => {
    return cart.items.reduce((total, item) => {
      return total + (Number(item.item.sellingPrice || 0) * item.quantity);
    }, 0);
  };

  const printReceipt = () => {
    const cart = carts.find(c => c.id === activeCartId);
    if (!cart) return;

    const receipt = `
═══════════════════════════════════
         STOREHUB RECEIPT
═══════════════════════════════════

Cart: ${cart.name}
Type: ${cart.type.toUpperCase()}
Date: ${new Date().toLocaleString()}

───────────────────────────────────
ITEMS
───────────────────────────────────

${cart.items.map(item => `
${item.item.name}
  ${item.quantity} x $${Number(item.item.sellingPrice || 0).toFixed(2)} = $${(item.quantity * Number(item.item.sellingPrice || 0)).toFixed(2)}
`).join('')}

───────────────────────────────────
TOTAL: $${getCartTotal(cart).toFixed(2)}
═══════════════════════════════════

Thank you for your business!

═══════════════════════════════════
    `.trim();

    const blob = new Blob([receipt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${cart.name}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const saveCartAsSale = async () => {
    const cart = carts.find(c => c.id === activeCartId);
    if (!cart || cart.items.length === 0) return;

    try {
      const token = getAuthToken();
      if (!token) return;

      // Create sale stock movements for each item
      for (const cartItem of cart.items) {
        await stockMovementsApi.create({
          type: 'sale',
          itemId: cartItem.item.id,
          quantity: cartItem.quantity,
          unitCost: Number(cartItem.item.sellingPrice || 0),
          notes: `POS Sale - ${cart.name} (${cart.type})`,
        }, token);
      }

      // Remove the cart after successful save
      deleteCart(cart.id);
      
      alert('Sale saved successfully! Stock has been updated.');
    } catch (error) {
      console.error('Failed to save sale:', error);
      alert('Failed to save sale. Please try again.');
    }
  };

  const activeCart = carts.find(c => c.id === activeCartId);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl animate-pulse" style={{ color: '#000000' }}>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8" style={{ background: theme.colors.background.secondary }}>
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2" style={{ color: '#000000' }}>
                Point of Sale
              </h1>
              <p style={{ color: '#000000' }}>
                Manage orders and sales
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCartTypesModal(true)}
                className="px-6 py-3 rounded-xl hover:opacity-90 transition-opacity font-semibold"
                style={{ background: theme.colors.accent.purple, color: 'white' }}
              >
                Manage Types
              </button>
              <button
                onClick={() => setShowNewCartModal(true)}
                className="px-6 py-3 rounded-xl hover:opacity-90 transition-opacity font-semibold"
                style={{ background: theme.colors.primary.black, color: 'white' }}
              >
                + New Order
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Categories Grid - Left Side */}
          <div className="col-span-7">
            <div
              className="rounded-xl p-6"
              style={{
                background: theme.colors.background.card,
                border: `1px solid ${theme.colors.border}`,
                boxShadow: theme.shadows.sm,
              }}
            >
              <h2 className="text-xl font-bold mb-6" style={{ color: '#000000' }}>
                Product Categories
              </h2>
              
              {getCategories().length === 0 ? (
                <div className="text-center py-12" style={{ color: '#000000' }}>
                  No categories available
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {getCategories().map((category) => {
                    const productsInCategory = getProductsByCategory(category);
                    return (
                      <button
                        key={category}
                        onClick={() => {
                          if (!activeCartId) {
                            alert('Please create an order first');
                            return;
                          }
                          setSelectedCategory(category);
                          setShowProductsModal(true);
                        }}
                        className="group relative p-6 rounded-2xl text-center hover:scale-105 transition-all duration-300"
                        style={{
                          background: `linear-gradient(135deg, ${theme.colors.background.secondary} 0%, ${theme.colors.background.card} 100%)`,
                          border: `2px solid ${theme.colors.border}`,
                          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                        }}
                      >
                        <div className="text-6xl mb-3 group-hover:scale-110 transition-transform duration-300">
                          {categoryEmojis[category] || '📦'}
                        </div>
                        <div className="font-bold text-lg mb-2" style={{ color: '#000000' }}>
                          {category}
                        </div>
                        <div 
                          className="text-sm font-semibold px-3 py-1 rounded-full inline-block"
                          style={{ 
                            background: theme.colors.accent.purple + '20',
                            color: theme.colors.accent.purple,
                          }}
                        >
                          {productsInCategory.length} {productsInCategory.length === 1 ? 'item' : 'items'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Cart Management - Right Side */}
          <div className="col-span-5">
            {/* Cart Tabs */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              {carts.map((cart) => (
                <div key={cart.id} className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveCartId(cart.id)}
                    className="px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-all"
                    style={{
                      background: activeCartId === cart.id ? theme.colors.primary.black : theme.colors.background.card,
                      color: activeCartId === cart.id ? 'white' : '#000000',
                      border: `1px solid ${activeCartId === cart.id ? theme.colors.primary.black : theme.colors.border}`,
                    }}
                  >
                    {cart.name}
                  </button>
                  <button
                    onClick={() => deleteCart(cart.id)}
                    className="p-2 rounded-lg hover:bg-red-100 transition-colors"
                    style={{ color: theme.colors.accent.red }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {/* Active Cart */}
            {activeCart ? (
              <div
                className="rounded-xl p-6"
                style={{
                  background: theme.colors.background.card,
                  border: `1px solid ${theme.colors.border}`,
                  boxShadow: theme.shadows.sm,
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold" style={{ color: '#000000' }}>
                      {activeCart.name}
                    </h2>
                    <p className="text-sm" style={{ color: '#000000' }}>
                      Type: {activeCart.type.charAt(0).toUpperCase() + activeCart.type.slice(1)}
                    </p>
                  </div>
                </div>

                {/* Cart Items */}
                <div className="space-y-3 mb-6 max-h-[400px] overflow-y-auto">
                  {activeCart.items.length === 0 ? (
                    <div className="text-center py-8" style={{ color: '#000000' }}>
                      Cart is empty
                    </div>
                  ) : (
                    activeCart.items.map((cartItem) => (
                      <div
                        key={cartItem.item.id}
                        className="p-4 rounded-lg"
                        style={{ background: theme.colors.background.secondary }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-semibold" style={{ color: '#000000' }}>
                            {cartItem.item.name}
                          </div>
                          <button
                            onClick={() => removeFromCart(cartItem.item.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            🗑️
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => updateQuantity(cartItem.item.id, -1)}
                              className="w-8 h-8 rounded-lg font-bold hover:opacity-70 transition-opacity"
                              style={{ background: theme.colors.accent.red, color: 'white' }}
                            >
                              -
                            </button>
                            <span className="font-semibold w-8 text-center" style={{ color: '#000000' }}>
                              {cartItem.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(cartItem.item.id, 1)}
                              className="w-8 h-8 rounded-lg font-bold hover:opacity-70 transition-opacity"
                              style={{ background: theme.colors.accent.green, color: 'white' }}
                            >
                              +
                            </button>
                          </div>
                          <div className="text-right">
                            <div className="text-sm" style={{ color: '#000000' }}>
                              ${Number(cartItem.item.sellingPrice || 0).toFixed(2)} each
                            </div>
                            <div className="font-bold" style={{ color: theme.colors.accent.green }}>
                              ${(cartItem.quantity * Number(cartItem.item.sellingPrice || 0)).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Cart Total */}
                <div
                  className="p-4 rounded-lg mb-4"
                  style={{ background: theme.colors.background.secondary }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold" style={{ color: '#000000' }}>
                      Total
                    </span>
                    <span className="text-2xl font-bold" style={{ color: theme.colors.accent.green }}>
                      ${getCartTotal(activeCart).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <button
                    onClick={saveCartAsSale}
                    disabled={activeCart.items.length === 0}
                    className="px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: theme.colors.accent.green, color: 'white' }}
                  >
                    💾 Save Sale
                  </button>
                  <button
                    onClick={printReceipt}
                    disabled={activeCart.items.length === 0}
                    className="px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: theme.colors.accent.blue, color: 'white' }}
                  >
                    🖨️ Print
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Clear this cart?')) {
                        const cart = carts.find(c => c.id === activeCartId);
                        if (cart) {
                          cart.items = [];
                          const updatedCarts = carts.map(c => c.id === activeCartId ? cart : c);
                          saveCartsToStorage(updatedCarts);
                        }
                      }
                    }}
                    disabled={activeCart.items.length === 0}
                    className="px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: theme.colors.accent.red, color: 'white' }}
                  >
                    🗑️ Clear
                  </button>
                </div>
                
                {/* Combined Action */}
                <button
                  onClick={async () => {
                    await saveCartAsSale();
                    printReceipt();
                  }}
                  disabled={activeCart.items.length === 0}
                  className="w-full px-6 py-4 rounded-xl font-bold text-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: theme.colors.primary.black, color: 'white' }}
                >
                  💾 Save & Print Receipt
                </button>
              </div>
            ) : (
              <div
                className="rounded-xl p-12 text-center"
                style={{
                  background: theme.colors.background.card,
                  border: `1px solid ${theme.colors.border}`,
                }}
              >
                <p className="text-xl mb-4" style={{ color: '#000000' }}>
                  No active cart
                </p>
                <button
                  onClick={() => setShowNewCartModal(true)}
                  className="px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
                  style={{ background: theme.colors.primary.black, color: 'white' }}
                >
                  Create New Order
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Cart Modal */}
      {showNewCartModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            className="rounded-xl p-8 max-w-md w-full"
            style={{ background: theme.colors.background.card }}
          >
            <h2 className="text-2xl font-bold mb-6" style={{ color: '#000000' }}>
              Create New Order
            </h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#000000' }}>
                  Order Name (Optional)
                </label>
                <input
                  type="text"
                  value={newCart.name}
                  onChange={(e) => setNewCart({ ...newCart, name: e.target.value })}
                  placeholder="e.g., Table 5, John Doe"
                  className="w-full px-4 py-3 rounded-lg"
                  style={{
                    background: theme.colors.background.secondary,
                    border: `1px solid ${theme.colors.border}`,
                    color: '#000000',
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#000000' }}>
                  Order Type
                </label>
                <select
                  value={newCart.type}
                  onChange={(e) => setNewCart({ ...newCart, type: e.target.value as any })}
                  className="w-full px-4 py-3 rounded-lg"
                  style={{
                    background: theme.colors.background.secondary,
                    border: `1px solid ${theme.colors.border}`,
                    color: '#000000',
                  }}
                >
                  {cartTypes.map(type => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowNewCartModal(false)}
                className="flex-1 px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
                style={{
                  background: theme.colors.background.secondary,
                  border: `1px solid ${theme.colors.border}`,
                  color: '#000000',
                }}
              >
                Cancel
              </button>
              <button
                onClick={createCart}
                className="flex-1 px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
                style={{ background: theme.colors.primary.black, color: 'white' }}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Cart Types Modal */}
      {showCartTypesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            className="rounded-xl p-8 max-w-md w-full"
            style={{ background: theme.colors.background.card }}
          >
            <h2 className="text-2xl font-bold mb-6" style={{ color: '#000000' }}>
              Manage Order Types
            </h2>

            <div className="space-y-3 mb-6">
              {cartTypes.map(type => (
                <div
                  key={type}
                  className="flex items-center justify-between p-3 rounded-lg"
                  style={{ background: theme.colors.background.secondary }}
                >
                  <span className="font-semibold" style={{ color: '#000000' }}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </span>
                  {!['table', 'delivery', 'takeaway'].includes(type) && (
                    <button
                      onClick={() => removeCartType(type)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2" style={{ color: '#000000' }}>
                Add New Type
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCartType}
                  onChange={(e) => setNewCartType(e.target.value)}
                  placeholder="e.g., catering, wholesale"
                  className="flex-1 px-4 py-3 rounded-lg"
                  style={{
                    background: theme.colors.background.secondary,
                    border: `1px solid ${theme.colors.border}`,
                    color: '#000000',
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && addCartType()}
                />
                <button
                  onClick={addCartType}
                  className="px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
                  style={{ background: theme.colors.accent.green, color: 'white' }}
                >
                  Add
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowCartTypesModal(false)}
              className="w-full px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
              style={{ background: theme.colors.primary.black, color: 'white' }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Products Modal */}
      {showProductsModal && selectedCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            className="rounded-2xl p-8 max-w-4xl w-full max-h-[85vh] overflow-y-auto"
            style={{ 
              background: theme.colors.background.card,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6 pb-4" style={{ borderBottom: `2px solid ${theme.colors.border}` }}>
              <div className="flex items-center gap-4">
                <div className="text-5xl">
                  {categoryEmojis[selectedCategory] || '📦'}
                </div>
                <div>
                  <h2 className="text-3xl font-bold" style={{ color: '#000000' }}>
                    {selectedCategory}
                  </h2>
                  <p className="text-sm mt-1" style={{ color: '#000000' }}>
                    Select items to add to your cart
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowProductsModal(false)}
                className="text-3xl hover:opacity-70 transition-opacity p-2"
                style={{ color: '#000000' }}
              >
                ×
              </button>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getProductsByCategory(selectedCategory).map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="group p-5 rounded-xl text-left hover:scale-105 transition-all duration-300"
                  style={{
                    background: theme.colors.background.secondary,
                    border: `2px solid ${theme.colors.border}`,
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  }}
                >
                  {/* Product Image/Icon */}
                  <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">
                    🍰
                  </div>

                  {/* Product Name */}
                  <div className="font-bold text-lg mb-2" style={{ color: '#000000' }}>
                    {product.name}
                  </div>

                  {/* Stock Info */}
                  <div className="flex items-center gap-2 mb-3">
                    <div 
                      className="text-xs font-semibold px-2 py-1 rounded-full"
                      style={{ 
                        background: Number(product.stockQuantity || 0) > 10 
                          ? theme.colors.accent.green + '20'
                          : theme.colors.accent.red + '20',
                        color: Number(product.stockQuantity || 0) > 10 
                          ? theme.colors.accent.green
                          : theme.colors.accent.red,
                      }}
                    >
                      {Number(product.stockQuantity || 0) > 0 
                        ? `${Number(product.stockQuantity || 0).toFixed(0)} ${product.unit} in stock`
                        : 'Out of stock'}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="flex items-center justify-between pt-3" style={{ borderTop: `1px solid ${theme.colors.border}` }}>
                    <div className="text-2xl font-bold" style={{ color: theme.colors.accent.green }}>
                      ${Number(product.sellingPrice || 0).toFixed(2)}
                    </div>
                    <div 
                      className="text-xs font-semibold px-3 py-1 rounded-full"
                      style={{ 
                        background: theme.colors.primary.black,
                        color: 'white',
                      }}
                    >
                      + Add
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Empty State */}
            {getProductsByCategory(selectedCategory).length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📭</div>
                <p className="text-lg font-semibold" style={{ color: '#000000' }}>
                  No products in this category
                </p>
              </div>
            )}

            {/* Close Button */}
            <div className="mt-6 pt-4" style={{ borderTop: `2px solid ${theme.colors.border}` }}>
              <button
                onClick={() => setShowProductsModal(false)}
                className="w-full px-6 py-4 rounded-xl font-bold text-lg hover:opacity-90 transition-opacity"
                style={{ background: theme.colors.primary.black, color: 'white' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
