'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { itemsApi, Item, ItemSize, SizePrice } from '@/lib/api/items';
import { stockMovementsApi } from '@/lib/api/stock-movements';
import { customersApi, Customer, CreateCustomerDto } from '@/lib/api/customers';
import { ordersApi, CreateOrderDto, OrderItem } from '@/lib/api/orders';
import { posSettingsApi } from '@/lib/api/pos-settings';
import { getAuthToken } from '@/lib/auth';
import { formatNumberWithCommas } from '@/lib/utils/numberFormat';
import { useCurrency } from '@/lib/context/CurrencyContext';
import { formatPrice, convertCurrency, Currency } from '@/lib/utils/currency';
import { PriceDisplay } from '@/components/ui/PriceDisplay';
import theme from '@/styles/theme';

interface CartItem {
  item: Item;
  quantity: number;
  size?: ItemSize;
  sizePrice?: number;
}

interface Cart {
  id: string;
  name: string;
  type: 'table' | 'delivery' | 'takeaway';
  items: CartItem[];
  createdAt: Date;
  customerId?: string;
  customerName?: string;
}

export default function POSPage() {
  const router = useRouter();
  const { currency: displayCurrency } = useCurrency();
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

  // Drag & drop ordering state
  const [categoryOrder, setCategoryOrder] = useState<string[]>([]);
  const [productOrder, setProductOrder] = useState<Record<string, string[]>>({});
  const [draggedCategory, setDraggedCategory] = useState<string | null>(null);
  const [dragOverCategory, setDragOverCategory] = useState<string | null>(null);
  const [draggedProduct, setDraggedProduct] = useState<string | null>(null);
  const [dragOverProduct, setDragOverProduct] = useState<string | null>(null);
  
  // Customer state
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showQuickAddCustomer, setShowQuickAddCustomer] = useState(false);
  const [quickCustomerName, setQuickCustomerName] = useState('');
  const [quickCustomerPhone, setQuickCustomerPhone] = useState('');
  const customerSearchRef = useRef<HTMLDivElement>(null);
  
  const [newCart, setNewCart] = useState({
    name: '',
    type: 'table' as 'table' | 'delivery' | 'takeaway',
  });

  useEffect(() => {
    loadProducts();
    loadCartsFromStorage();
    loadPosSettings();
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

  const loadPosSettings = async () => {
    // Load from localStorage first for instant display
    const savedCatOrder = localStorage.getItem('pos_category_order');
    if (savedCatOrder) setCategoryOrder(JSON.parse(savedCatOrder));
    const savedProdOrder = localStorage.getItem('pos_product_order');
    if (savedProdOrder) setProductOrder(JSON.parse(savedProdOrder));
    const savedTypes = localStorage.getItem('pos_cart_types');
    if (savedTypes) setCartTypes(JSON.parse(savedTypes));

    // Then load from backend and override
    try {
      const token = getAuthToken();
      if (!token) return;
      const settings = await posSettingsApi.get(token);
      if (settings.categoryOrder && settings.categoryOrder.length > 0) {
        setCategoryOrder(settings.categoryOrder);
        localStorage.setItem('pos_category_order', JSON.stringify(settings.categoryOrder));
      }
      if (settings.productOrder && Object.keys(settings.productOrder).length > 0) {
        setProductOrder(settings.productOrder);
        localStorage.setItem('pos_product_order', JSON.stringify(settings.productOrder));
      }
      if (settings.cartTypes && settings.cartTypes.length > 0) {
        setCartTypes(settings.cartTypes);
        localStorage.setItem('pos_cart_types', JSON.stringify(settings.cartTypes));
      }
    } catch (error) {
      console.error('Failed to load POS settings from backend:', error);
    }
  };

  const loadOrderingFromStorage = () => {
    const savedCatOrder = localStorage.getItem('pos_category_order');
    if (savedCatOrder) setCategoryOrder(JSON.parse(savedCatOrder));
    const savedProdOrder = localStorage.getItem('pos_product_order');
    if (savedProdOrder) setProductOrder(JSON.parse(savedProdOrder));
  };

  const saveCategoryOrder = (order: string[]) => {
    setCategoryOrder(order);
    localStorage.setItem('pos_category_order', JSON.stringify(order));
    const token = getAuthToken();
    if (token) posSettingsApi.update({ categoryOrder: order }, token).catch(console.error);
  };

  const saveProductOrder = (updated: Record<string, string[]>) => {
    setProductOrder(updated);
    localStorage.setItem('pos_product_order', JSON.stringify(updated));
    const token = getAuthToken();
    if (token) posSettingsApi.update({ productOrder: updated }, token).catch(console.error);
  };

  // Category drag handlers
  const handleCategoryDragStart = (category: string) => {
    setDraggedCategory(category);
  };

  const handleCategoryDragOver = (e: React.DragEvent, category: string) => {
    e.preventDefault();
    if (draggedCategory && draggedCategory !== category) {
      setDragOverCategory(category);
    }
  };

  const handleCategoryDrop = (targetCategory: string) => {
    if (!draggedCategory || draggedCategory === targetCategory) {
      setDraggedCategory(null);
      setDragOverCategory(null);
      return;
    }
    const ordered = getCategories();
    const fromIdx = ordered.indexOf(draggedCategory);
    const toIdx = ordered.indexOf(targetCategory);
    if (fromIdx === -1 || toIdx === -1) return;
    const newOrder = [...ordered];
    newOrder.splice(fromIdx, 1);
    newOrder.splice(toIdx, 0, draggedCategory);
    saveCategoryOrder(newOrder);
    setDraggedCategory(null);
    setDragOverCategory(null);
  };

  // Product drag handlers
  const handleProductDragStart = (productId: string) => {
    setDraggedProduct(productId);
  };

  const handleProductDragOver = (e: React.DragEvent, productId: string) => {
    e.preventDefault();
    if (draggedProduct && draggedProduct !== productId) {
      setDragOverProduct(productId);
    }
  };

  const handleProductDrop = (targetProductId: string, category: string) => {
    if (!draggedProduct || draggedProduct === targetProductId) {
      setDraggedProduct(null);
      setDragOverProduct(null);
      return;
    }
    const ordered = getProductsByCategory(category);
    const ids = ordered.map(p => p.id);
    const fromIdx = ids.indexOf(draggedProduct);
    const toIdx = ids.indexOf(targetProductId);
    if (fromIdx === -1 || toIdx === -1) return;
    const newIds = [...ids];
    newIds.splice(fromIdx, 1);
    newIds.splice(toIdx, 0, draggedProduct);
    const updated = { ...productOrder, [category]: newIds };
    saveProductOrder(updated);
    setDraggedProduct(null);
    setDragOverProduct(null);
  };

  // Close customer dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (customerSearchRef.current && !customerSearchRef.current.contains(event.target as Node)) {
        setShowCustomerDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchCustomers = async (query: string) => {
    setCustomerSearch(query);
    if (query.length < 1) {
      setCustomerResults([]);
      setShowCustomerDropdown(false);
      return;
    }
    try {
      const token = getAuthToken();
      if (!token) return;
      const results = await customersApi.search(query, token);
      setCustomerResults(results);
      setShowCustomerDropdown(true);
    } catch (error) {
      console.error('Failed to search customers:', error);
    }
  };

  const selectCustomer = (customer: Customer) => {
    if (!activeCartId) return;
    const updatedCarts = carts.map(c => {
      if (c.id === activeCartId) {
        return { ...c, customerId: customer.id, customerName: customer.name };
      }
      return c;
    });
    saveCartsToStorage(updatedCarts);
    setCustomerSearch(customer.name);
    setShowCustomerDropdown(false);
  };

  const removeCustomerFromCart = () => {
    if (!activeCartId) return;
    const updatedCarts = carts.map(c => {
      if (c.id === activeCartId) {
        return { ...c, customerId: undefined, customerName: undefined };
      }
      return c;
    });
    saveCartsToStorage(updatedCarts);
    setCustomerSearch('');
  };

  const quickAddCustomer = async () => {
    if (!quickCustomerName.trim()) return;
    try {
      const token = getAuthToken();
      if (!token) return;
      const newCustomer = await customersApi.create({
        name: quickCustomerName.trim(),
        phone: quickCustomerPhone.trim() || undefined,
      }, token);
      selectCustomer(newCustomer);
      setQuickCustomerName('');
      setQuickCustomerPhone('');
      setShowQuickAddCustomer(false);
    } catch (error) {
      console.error('Failed to create customer:', error);
      alert('Failed to create customer. Please try again.');
    }
  };

  // Calculate cost per unit for manufactured products
  const calculateCostPerUnit = (item: Item) => {
    if (item.type !== 'manufactured' || !item.recipes || item.recipes.length === 0) {
      return 0;
    }
    const totalCost = item.recipes.reduce((sum, recipe) => {
      const ingredientCost = recipe.childItem?.purchasePrice || 0;
      const ingredientCurrency = recipe.childItem?.purchasePriceCurrency || Currency.USD;
      // Convert ingredient cost to display currency
      const convertedCost = convertCurrency(ingredientCost, ingredientCurrency, displayCurrency);
      return sum + (convertedCost * recipe.quantityNeeded);
    }, 0);
    const yield_ = item.recipeYield || 1;
    return totalCost / yield_;
  };

  const saveCartsToStorage = (updatedCarts: Cart[]) => {
    localStorage.setItem('pos_carts', JSON.stringify(updatedCarts));
    setCarts(updatedCarts);
  };

  const saveCartTypesToStorage = (types: string[]) => {
    localStorage.setItem('pos_cart_types', JSON.stringify(types));
    setCartTypes(types);
    const token = getAuthToken();
    if (token) posSettingsApi.update({ cartTypes: types }, token).catch(console.error);
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

  const addToCart = (product: Item, size?: ItemSize, sizePrice?: number) => {
    const cart = carts.find(c => c.id === activeCartId);
    if (!cart) return;

    // Match by both item ID and size
    const existingItem = cart.items.find(item => item.item.id === product.id && item.size === size);
    
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.items.push({ item: product, quantity: 1, size, sizePrice });
    }

    const updatedCarts = carts.map(c => c.id === activeCartId ? cart : c);
    saveCartsToStorage(updatedCarts);
    setShowProductsModal(false);
  };

  // Get unique categories from products, respecting saved order
  const getCategories = () => {
    const categories = products
      .map(p => p.category)
      .filter((category): category is string => !!category);
    const unique = Array.from(new Set(categories));
    if (categoryOrder.length > 0) {
      const ordered: string[] = [];
      // Add categories in saved order (that still exist)
      for (const cat of categoryOrder) {
        if (unique.includes(cat)) ordered.push(cat);
      }
      // Append any new categories not yet in saved order
      for (const cat of unique) {
        if (!ordered.includes(cat)) ordered.push(cat);
      }
      return ordered;
    }
    return unique;
  };

  // Get products by category, respecting saved order
  const getProductsByCategory = (category: string) => {
    const prods = products.filter(p => p.category === category);
    const savedOrder = productOrder[category];
    if (savedOrder && savedOrder.length > 0) {
      const ordered: Item[] = [];
      for (const id of savedOrder) {
        const found = prods.find(p => p.id === id);
        if (found) ordered.push(found);
      }
      // Append any new products not yet in saved order
      for (const p of prods) {
        if (!ordered.find(o => o.id === p.id)) ordered.push(p);
      }
      return ordered;
    }
    return prods;
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

  const updateQuantity = (productId: string, delta: number, size?: ItemSize) => {
    const cart = carts.find(c => c.id === activeCartId);
    if (!cart) return;

    const item = cart.items.find(item => item.item.id === productId && item.size === size);
    if (!item) return;

    item.quantity += delta;
    
    if (item.quantity <= 0) {
      cart.items = cart.items.filter(i => !(i.item.id === productId && i.size === size));
    }

    const updatedCarts = carts.map(c => c.id === activeCartId ? cart : c);
    saveCartsToStorage(updatedCarts);
  };

  const removeFromCart = (productId: string, size?: ItemSize) => {
    const cart = carts.find(c => c.id === activeCartId);
    if (!cart) return;

    cart.items = cart.items.filter(item => !(item.item.id === productId && item.size === size));
    const updatedCarts = carts.map(c => c.id === activeCartId ? cart : c);
    saveCartsToStorage(updatedCarts);
  };

  const getCartTotal = (cart: Cart) => {
    return cart.items.reduce((total, item) => {
      const itemPrice = item.sizePrice != null ? item.sizePrice : Number(item.item.sellingPrice || 0);
      const itemCurrency = item.item.sellingPriceCurrency || Currency.USD;
      // Convert item price to display currency
      const convertedPrice = convertCurrency(itemPrice, itemCurrency, displayCurrency);
      return total + (convertedPrice * item.quantity);
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

${cart.items.map(item => {
  const price = item.sizePrice != null ? item.sizePrice : Number(item.item.sellingPrice || 0);
  return `
${item.item.name}${item.size ? ` (${item.size})` : ''}
  ${item.quantity} x $${formatNumberWithCommas(price)} = $${formatNumberWithCommas(item.quantity * price)}
`;
}).join('')}

───────────────────────────────────
TOTAL: $${formatNumberWithCommas(getCartTotal(cart))}
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
          unitCost: cartItem.sizePrice != null ? cartItem.sizePrice : Number(cartItem.item.sellingPrice || 0),
          notes: `POS Sale - ${cart.name} (${cart.type})${cartItem.size ? ` [Size: ${cartItem.size}]` : ''}`,
        }, token);
      }

      // Create an Order record
      const orderItems: OrderItem[] = cart.items.map(cartItem => ({
        itemId: cartItem.item.id,
        name: cartItem.item.name,
        quantity: cartItem.quantity,
        size: cartItem.size,
        price: cartItem.sizePrice != null ? cartItem.sizePrice : Number(cartItem.item.sellingPrice || 0),
        currency: cartItem.item.sellingPriceCurrency || Currency.USD,
      }));

      const orderData: CreateOrderDto = {
        cartName: cart.name,
        cartType: cart.type,
        items: orderItems,
        total: getCartTotal(cart),
        currency: displayCurrency,
        customerId: cart.customerId || undefined,
      };

      await ordersApi.create(orderData, token);

      // Remove the cart after successful save
      deleteCart(cart.id);
      
      alert('Sale saved successfully! Stock has been updated.');
    } catch (error) {
      console.error('Failed to save sale:', error);
      alert('Failed to save sale. Please try again.');
    }
  };

  const activeCart = carts.find(c => c.id === activeCartId);

  // Sync customer search display with active cart
  useEffect(() => {
    if (activeCart?.customerName) {
      setCustomerSearch(activeCart.customerName);
    } else {
      setCustomerSearch('');
    }
  }, [activeCartId]);

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
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ background: theme.colors.background.secondary }}>
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2" style={{ color: '#000000' }}>
                Point of Sale
              </h1>
              <p className="text-sm sm:text-base" style={{ color: '#000000' }}>
                Manage orders and sales
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowCartTypesModal(true)}
                className="w-full sm:w-auto px-6 py-3 rounded-xl hover:opacity-90 transition-opacity font-semibold"
                style={{ background: theme.colors.accent.purple, color: 'white' }}
              >
                Manage Types
              </button>
              <button
                onClick={() => setShowNewCartModal(true)}
                className="w-full sm:w-auto px-6 py-3 rounded-xl hover:opacity-90 transition-opacity font-semibold"
                style={{ background: theme.colors.primary.black, color: 'white' }}
              >
                + New Order
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Categories Grid - Left Side */}
          <div className="lg:col-span-7">
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
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3">
                  {getCategories().map((category) => {
                    const productsInCategory = getProductsByCategory(category);
                    return (
                      <button
                        key={category}
                        draggable
                        onDragStart={() => handleCategoryDragStart(category)}
                        onDragOver={(e) => handleCategoryDragOver(e, category)}
                        onDrop={() => handleCategoryDrop(category)}
                        onDragEnd={() => { setDraggedCategory(null); setDragOverCategory(null); }}
                        onClick={() => {
                          if (!activeCartId) {
                            alert('Please create an order first');
                            return;
                          }
                          setSelectedCategory(category);
                          setShowProductsModal(true);
                        }}
                        className="group relative p-3 rounded-xl text-center hover:scale-105 transition-all duration-300"
                        style={{
                          background: `linear-gradient(135deg, ${theme.colors.background.secondary} 0%, ${theme.colors.background.card} 100%)`,
                          border: dragOverCategory === category ? `2px solid ${theme.colors.accent.blue}` : `2px solid ${theme.colors.border}`,
                          boxShadow: dragOverCategory === category ? `0 0 12px ${theme.colors.accent.blue}40` : '0 2px 4px rgba(0, 0, 0, 0.08)',
                          opacity: draggedCategory === category ? 0.5 : 1,
                          cursor: 'grab',
                        }}
                      >
                        <div className="absolute top-1 right-1 text-xs opacity-20">⋮</div>
                        <div className="text-3xl mb-1 group-hover:scale-110 transition-transform duration-300">
                          {categoryEmojis[category] || '📦'}
                        </div>
                        <div className="font-semibold text-sm mb-1" style={{ color: '#000000' }}>
                          {category}
                        </div>
                        <div 
                          className="text-xs font-semibold px-2 py-0.5 rounded-full inline-block"
                          style={{ 
                            background: theme.colors.accent.purple + '20',
                            color: theme.colors.accent.purple,
                          }}
                        >
                          {productsInCategory.length}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Cart Management - Right Side */}
          <div className="lg:col-span-5">
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

                {/* Customer Search Section */}
                <div className="mb-4" ref={customerSearchRef}>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#000000' }}>
                    👤 Customer
                  </label>
                  {activeCart.customerId ? (
                    <div 
                      className="flex items-center justify-between p-3 rounded-lg"
                      style={{ background: theme.colors.accent.blue + '15', border: `1px solid ${theme.colors.accent.blue}30` }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">👤</span>
                        <span className="font-semibold" style={{ color: '#000000' }}>{activeCart.customerName}</span>
                      </div>
                      <button
                        onClick={removeCustomerFromCart}
                        className="text-sm px-2 py-1 rounded hover:opacity-70 transition-opacity"
                        style={{ color: theme.colors.accent.red }}
                      >
                        ✕ Remove
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={customerSearch}
                          onChange={(e) => searchCustomers(e.target.value)}
                          onFocus={() => customerSearch.length >= 1 && setShowCustomerDropdown(true)}
                          placeholder="Search customer by name or phone..."
                          className="flex-1 px-3 py-2 rounded-lg text-sm"
                          style={{
                            background: theme.colors.background.secondary,
                            border: `1px solid ${theme.colors.border}`,
                            color: '#000000',
                          }}
                        />
                        <button
                          onClick={() => setShowQuickAddCustomer(true)}
                          className="px-3 py-2 rounded-lg font-bold text-sm hover:opacity-90 transition-opacity"
                          style={{ background: theme.colors.accent.green, color: 'white' }}
                          title="Add new customer"
                        >
                          +
                        </button>
                      </div>
                      {showCustomerDropdown && customerResults.length > 0 && (
                        <div
                          className="absolute z-50 w-full mt-1 rounded-lg overflow-hidden max-h-48 overflow-y-auto"
                          style={{
                            background: theme.colors.background.card,
                            border: `1px solid ${theme.colors.border}`,
                            boxShadow: theme.shadows.md || '0 4px 12px rgba(0,0,0,0.15)',
                          }}
                        >
                          {customerResults.map(customer => (
                            <button
                              key={customer.id}
                              onClick={() => selectCustomer(customer)}
                              className="w-full text-left px-4 py-3 hover:opacity-80 transition-opacity"
                              style={{ borderBottom: `1px solid ${theme.colors.border}` }}
                            >
                              <div className="font-semibold text-sm" style={{ color: '#000000' }}>{customer.name}</div>
                              {customer.phone && (
                                <div className="text-xs" style={{ color: theme.colors.text.secondary || '#666' }}>📱 {customer.phone}</div>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                      {showCustomerDropdown && customerSearch.length >= 1 && customerResults.length === 0 && (
                        <div
                          className="absolute z-50 w-full mt-1 rounded-lg p-3 text-center text-sm"
                          style={{
                            background: theme.colors.background.card,
                            border: `1px solid ${theme.colors.border}`,
                            color: '#000000',
                          }}
                        >
                          No customers found. Click + to add new.
                        </div>
                      )}
                    </div>
                  )}
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
                        key={`${cartItem.item.id}-${cartItem.size || 'no-size'}`}
                        className="p-4 rounded-lg"
                        style={{ background: theme.colors.background.secondary }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="font-semibold" style={{ color: '#000000' }}>
                              {cartItem.item.name}
                            </span>
                            {cartItem.size && (
                              <span 
                                className="ml-2 text-xs font-bold px-2 py-0.5 rounded-full"
                                style={{ 
                                  background: theme.colors.accent.purple + '20',
                                  color: theme.colors.accent.purple,
                                }}
                              >
                                {cartItem.size}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => removeFromCart(cartItem.item.id, cartItem.size)}
                            className="text-red-500 hover:text-red-700"
                          >
                            🗑️
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => updateQuantity(cartItem.item.id, -1, cartItem.size)}
                              className="w-8 h-8 rounded-lg font-bold hover:opacity-70 transition-opacity"
                              style={{ background: theme.colors.accent.red, color: 'white' }}
                            >
                              -
                            </button>
                            <span className="font-semibold w-8 text-center" style={{ color: '#000000' }}>
                              {cartItem.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(cartItem.item.id, 1, cartItem.size)}
                              className="w-8 h-8 rounded-lg font-bold hover:opacity-70 transition-opacity"
                              style={{ background: theme.colors.accent.green, color: 'white' }}
                            >
                              +
                            </button>
                          </div>
                          <div className="text-right">
                            <div className="text-sm" style={{ color: '#000000' }}>
                              <PriceDisplay 
                                amount={cartItem.sizePrice != null ? cartItem.sizePrice : Number(cartItem.item.sellingPrice || 0)}
                                currency={cartItem.item.sellingPriceCurrency || Currency.USD}
                              /> each
                            </div>
                            <div className="font-bold" style={{ color: theme.colors.accent.green }}>
                              <PriceDisplay 
                                amount={cartItem.quantity * (cartItem.sizePrice != null ? cartItem.sizePrice : Number(cartItem.item.sellingPrice || 0))}
                                currency={cartItem.item.sellingPriceCurrency || Currency.USD}
                              />
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
                      {formatPrice(getCartTotal(activeCart), displayCurrency)}
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
            className="rounded-2xl p-6 max-w-3xl w-full max-h-[85vh] overflow-y-auto"
            style={{ 
              background: theme.colors.background.card,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-4 pb-3" style={{ borderBottom: `1px solid ${theme.colors.border}` }}>
              <div className="flex items-center gap-3">
                <div className="text-3xl">
                  {categoryEmojis[selectedCategory] || '📦'}
                </div>
                <div>
                  <h2 className="text-xl font-bold" style={{ color: '#000000' }}>
                    {selectedCategory}
                  </h2>
                </div>
              </div>
              <button
                onClick={() => setShowProductsModal(false)}
                className="text-2xl hover:opacity-70 transition-opacity p-1"
                style={{ color: '#000000' }}
              >
                ×
              </button>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {getProductsByCategory(selectedCategory).map((product) => (
                <div
                  key={product.id}
                  draggable
                  onDragStart={() => handleProductDragStart(product.id)}
                  onDragOver={(e) => handleProductDragOver(e, product.id)}
                  onDrop={() => handleProductDrop(product.id, selectedCategory)}
                  onDragEnd={() => { setDraggedProduct(null); setDragOverProduct(null); }}
                  className="group p-3 rounded-lg text-left transition-all duration-200"
                  style={{
                    background: theme.colors.background.secondary,
                    border: dragOverProduct === product.id ? `2px solid ${theme.colors.accent.blue}` : `1px solid ${theme.colors.border}`,
                    opacity: draggedProduct === product.id ? 0.5 : 1,
                    cursor: 'grab',
                  }}
                >
                  {/* Product Name */}
                  <div className="font-semibold text-sm mb-1" style={{ color: '#000000' }}>
                    {product.name}
                  </div>

                  {/* Stock */}
                  <div className="text-[11px] font-semibold mb-1" style={{
                    color: Number(product.stockQuantity || 0) > 10 ? theme.colors.accent.green : theme.colors.accent.red,
                  }}>
                    {Number(product.stockQuantity || 0) > 0
                      ? `${formatNumberWithCommas(Number(product.stockQuantity || 0), 0)} ${product.unit} left`
                      : 'Out of stock'}
                  </div>

                  {/* Price */}
                  <div className="text-lg font-bold mb-2" style={{ color: theme.colors.accent.green }}>
                    ${formatNumberWithCommas(Number(product.sellingPrice || 0))}
                  </div>

                    {/* Size buttons or regular Add button */}
                    {product.sizes && product.sizes.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                          {product.sizes.map((sp) => (
                            <button
                              key={sp.size}
                              type="button"
                              onClick={() => addToCart(product, sp.size, sp.price)}
                              className="flex-1 min-w-[48px] px-2 py-1.5 rounded-md font-bold text-xs hover:scale-105 transition-all duration-200"
                              style={{
                                background: theme.colors.primary.black,
                                color: 'white',
                              }}
                            >
                              <div>{sp.size}</div>
                              <div className="text-[10px] font-normal opacity-80">${formatNumberWithCommas(sp.price)}</div>
                            </button>
                          ))}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => addToCart(product)}
                        className="w-full py-1.5 rounded-md font-bold text-xs hover:opacity-90 transition-opacity"
                        style={{
                          background: theme.colors.primary.black,
                          color: 'white',
                        }}
                      >
                        + Add
                      </button>
                    )}
                </div>
              ))}
            </div>

            {/* Empty State */}
            {getProductsByCategory(selectedCategory).length === 0 && (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">📭</div>
                <p className="text-sm font-semibold" style={{ color: '#000000' }}>
                  No products in this category
                </p>
              </div>
            )}

            {/* Close Button */}
            <div className="mt-4 pt-3" style={{ borderTop: `1px solid ${theme.colors.border}` }}>
              <button
                onClick={() => setShowProductsModal(false)}
                className="w-full px-4 py-3 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
                style={{ background: theme.colors.primary.black, color: 'white' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Add Customer Modal */}
      {showQuickAddCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            className="rounded-xl p-8 max-w-md w-full"
            style={{ background: theme.colors.background.card }}
          >
            <h2 className="text-2xl font-bold mb-6" style={{ color: '#000000' }}>
              👤 Add New Customer
            </h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#000000' }}>
                  Name *
                </label>
                <input
                  type="text"
                  value={quickCustomerName}
                  onChange={(e) => setQuickCustomerName(e.target.value)}
                  placeholder="Customer name"
                  className="w-full px-4 py-3 rounded-lg"
                  style={{
                    background: theme.colors.background.secondary,
                    border: `1px solid ${theme.colors.border}`,
                    color: '#000000',
                  }}
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#000000' }}>
                  Phone (Optional)
                </label>
                <input
                  type="text"
                  value={quickCustomerPhone}
                  onChange={(e) => setQuickCustomerPhone(e.target.value)}
                  placeholder="Phone number"
                  className="w-full px-4 py-3 rounded-lg"
                  style={{
                    background: theme.colors.background.secondary,
                    border: `1px solid ${theme.colors.border}`,
                    color: '#000000',
                  }}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowQuickAddCustomer(false);
                  setQuickCustomerName('');
                  setQuickCustomerPhone('');
                }}
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
                onClick={quickAddCustomer}
                disabled={!quickCustomerName.trim()}
                className="flex-1 px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                style={{ background: theme.colors.accent.green, color: 'white' }}
              >
                Add & Select
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
