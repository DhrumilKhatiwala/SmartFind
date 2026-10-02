import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const CartContext = createContext(null);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};

// Helper to compute item_count and total_price
const computeCartTotals = (items = []) => {
  const item_count = items.reduce((sum, it) => sum + (it.quantity || 1), 0);
  const total_price = Math.round(items.reduce((sum, it) => sum + ((it.price || 0) * (it.quantity || 1)), 0) * 100) / 100;
  return { items, item_count, total_price };
};

export const CartProvider = ({ children }) => {
  const { token, isAuthenticated, isGuest } = useAuth();
  const [cart, setCart] = useState({ items: [], item_count: 0, total_price: 0 });
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const authHeaders = useMemo(() => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, [token]);

  // Load cart on auth change (guest vs registered)
  useEffect(() => {
    if (isGuest) {
      try {
        const stored = sessionStorage.getItem('sf_guest_cart');
        if (stored) {
          setCart(computeCartTotals(JSON.parse(stored)));
        } else {
          setCart({ items: [], item_count: 0, total_price: 0 });
        }
      } catch {
        setCart({ items: [], item_count: 0, total_price: 0 });
      }
      setSummary(null);
    } else if (isAuthenticated && token) {
      fetchCart();
    } else {
      setCart({ items: [], item_count: 0, total_price: 0 });
      setSummary(null);
    }
  }, [isAuthenticated, token, isGuest]);

  const fetchCart = useCallback(async () => {
    if (isGuest) {
      try {
        const stored = sessionStorage.getItem('sf_guest_cart');
        const parsed = stored ? JSON.parse(stored) : [];
        setCart(computeCartTotals(parsed));
      } catch {
        setCart({ items: [], item_count: 0, total_price: 0 });
      }
      return;
    }
    if (!token) return;
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/cart`, { headers: authHeaders });
      setCart(res.data);
    } catch (err) {
      console.error('Failed to fetch cart:', err);
    } finally {
      setLoading(false);
    }
  }, [token, isGuest, authHeaders]);

  // Optimistic Add to Cart (0ms instant UI feedback)
  const addToCart = useCallback(async (product) => {
    if (!isAuthenticated) return false;

    // 1. Immediately calculate and update UI optimistically
    const prevCart = cart;
    const existingIdx = cart.items.findIndex(it => it.product_id === product.product_id);
    let optimisticItems;

    if (existingIdx >= 0) {
      optimisticItems = [...cart.items];
      optimisticItems[existingIdx] = {
        ...optimisticItems[existingIdx],
        quantity: Math.min((optimisticItems[existingIdx].quantity || 1) + (product.quantity || 1), 99),
      };
    } else {
      optimisticItems = [...cart.items, { ...product, quantity: product.quantity || 1 }];
    }

    setCart(computeCartTotals(optimisticItems));
    setSummary(null);

    // If guest: save to sessionStorage and return immediately
    if (isGuest) {
      try {
        sessionStorage.setItem('sf_guest_cart', JSON.stringify(optimisticItems));
      } catch (err) {
        console.error('Failed to store guest cart:', err);
      }
      return true;
    }

    // If registered: sync with backend in background
    try {
      const res = await axios.post(`${API_BASE_URL}/cart/add`, product, { headers: authHeaders });
      // Keep server response in sync
      setCart(res.data);
      return true;
    } catch (err) {
      console.error('Failed to add to cart, rolling back:', err);
      setCart(prevCart);
      return false;
    }
  }, [isAuthenticated, isGuest, cart, authHeaders]);

  // Optimistic Update Quantity (0ms instant UI feedback)
  const updateQuantity = useCallback(async (productId, quantity) => {
    const prevCart = cart;
    const optimisticItems = cart.items.map(it =>
      it.product_id === productId ? { ...it, quantity } : it
    );
    setCart(computeCartTotals(optimisticItems));
    setSummary(null);

    if (isGuest) {
      try {
        sessionStorage.setItem('sf_guest_cart', JSON.stringify(optimisticItems));
      } catch (err) {
        console.error('Failed to update guest quantity:', err);
      }
      return;
    }

    if (!token) return;
    try {
      const res = await axios.patch(
        `${API_BASE_URL}/cart/${encodeURIComponent(productId)}`,
        { quantity },
        { headers: authHeaders }
      );
      setCart(res.data);
    } catch (err) {
      console.error('Failed to update quantity, rolling back:', err);
      setCart(prevCart);
    }
  }, [token, isGuest, cart, authHeaders]);

  // Optimistic Remove Item (0ms instant UI feedback)
  const removeItem = useCallback(async (productId) => {
    const prevCart = cart;
    const optimisticItems = cart.items.filter(it => it.product_id !== productId);
    setCart(computeCartTotals(optimisticItems));
    setSummary(null);

    if (isGuest) {
      try {
        sessionStorage.setItem('sf_guest_cart', JSON.stringify(optimisticItems));
      } catch (err) {
        console.error('Failed to remove guest item:', err);
      }
      return;
    }

    if (!token) return;
    try {
      const res = await axios.delete(
        `${API_BASE_URL}/cart/${encodeURIComponent(productId)}`,
        { headers: authHeaders }
      );
      setCart(res.data);
    } catch (err) {
      console.error('Failed to remove item, rolling back:', err);
      setCart(prevCart);
    }
  }, [token, isGuest, cart, authHeaders]);

  // Optimistic Clear Cart (0ms instant UI feedback)
  const clearCart = useCallback(async () => {
    const prevCart = cart;
    setCart({ items: [], item_count: 0, total_price: 0 });
    setSummary(null);

    if (isGuest) {
      sessionStorage.removeItem('sf_guest_cart');
      return;
    }

    if (!token) return;
    try {
      const res = await axios.delete(`${API_BASE_URL}/cart`, { headers: authHeaders });
      setCart(res.data);
    } catch (err) {
      console.error('Failed to clear cart, rolling back:', err);
      setCart(prevCart);
    }
  }, [token, isGuest, cart, authHeaders]);

  const fetchSummary = useCallback(async () => {
    if (cart.item_count === 0) return;

    try {
      setSummaryLoading(true);
      if (isGuest) {
        const res = await axios.post(`${API_BASE_URL}/cart/guest-summary`, { items: cart.items });
        setSummary(res.data);
      } else {
        const res = await axios.get(`${API_BASE_URL}/cart/summary`, { headers: authHeaders });
        setSummary(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch summary:', err);
    } finally {
      setSummaryLoading(false);
    }
  }, [token, isGuest, cart.item_count, cart.items, authHeaders]);

  const value = {
    cart,
    loading,
    summary,
    summaryLoading,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    fetchSummary,
    fetchCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
