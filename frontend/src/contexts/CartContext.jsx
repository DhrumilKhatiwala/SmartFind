import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  // Load cart on auth change (guest vs registered)
  useEffect(() => {
    if (isGuest) {
      // Guest: load from sessionStorage
      try {
        const stored = sessionStorage.getItem('sf_guest_cart');
        if (stored) {
          const parsed = JSON.parse(stored);
          setCart(computeCartTotals(parsed));
        } else {
          setCart({ items: [], item_count: 0, total_price: 0 });
        }
      } catch {
        setCart({ items: [], item_count: 0, total_price: 0 });
      }
      setSummary(null);
    } else if (isAuthenticated && token) {
      // Registered: fetch from MongoDB
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
  }, [token, isGuest]);

  const addToCart = useCallback(async (product) => {
    if (!isAuthenticated) return false;

    if (isGuest) {
      // Guest mode: update sessionStorage
      try {
        const stored = sessionStorage.getItem('sf_guest_cart');
        const currentItems = stored ? JSON.parse(stored) : [];
        const existingIdx = currentItems.findIndex(it => it.product_id === product.product_id);

        let updatedItems;
        if (existingIdx >= 0) {
          updatedItems = [...currentItems];
          updatedItems[existingIdx].quantity = Math.min((updatedItems[existingIdx].quantity || 1) + (product.quantity || 1), 99);
        } else {
          updatedItems = [...currentItems, { ...product, quantity: product.quantity || 1 }];
        }

        sessionStorage.setItem('sf_guest_cart', JSON.stringify(updatedItems));
        setCart(computeCartTotals(updatedItems));
        setSummary(null);
        return true;
      } catch (err) {
        console.error('Failed to add to guest cart:', err);
        return false;
      }
    }

    // Registered mode: send to MongoDB API
    try {
      const res = await axios.post(`${API_BASE_URL}/cart/add`, product, { headers: authHeaders });
      setCart(res.data);
      setSummary(null);
      return true;
    } catch (err) {
      console.error('Failed to add to cart:', err);
      return false;
    }
  }, [token, isAuthenticated, isGuest]);

  const updateQuantity = useCallback(async (productId, quantity) => {
    if (isGuest) {
      try {
        const stored = sessionStorage.getItem('sf_guest_cart');
        const currentItems = stored ? JSON.parse(stored) : [];
        const updatedItems = currentItems.map(it => 
          it.product_id === productId ? { ...it, quantity } : it
        );
        sessionStorage.setItem('sf_guest_cart', JSON.stringify(updatedItems));
        setCart(computeCartTotals(updatedItems));
        setSummary(null);
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
      setSummary(null);
    } catch (err) {
      console.error('Failed to update quantity:', err);
    }
  }, [token, isGuest]);

  const removeItem = useCallback(async (productId) => {
    if (isGuest) {
      try {
        const stored = sessionStorage.getItem('sf_guest_cart');
        const currentItems = stored ? JSON.parse(stored) : [];
        const updatedItems = currentItems.filter(it => it.product_id !== productId);
        sessionStorage.setItem('sf_guest_cart', JSON.stringify(updatedItems));
        setCart(computeCartTotals(updatedItems));
        setSummary(null);
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
      setSummary(null);
    } catch (err) {
      console.error('Failed to remove item:', err);
    }
  }, [token, isGuest]);

  const clearCart = useCallback(async () => {
    if (isGuest) {
      sessionStorage.removeItem('sf_guest_cart');
      setCart({ items: [], item_count: 0, total_price: 0 });
      setSummary(null);
      return;
    }

    if (!token) return;
    try {
      const res = await axios.delete(`${API_BASE_URL}/cart`, { headers: authHeaders });
      setCart(res.data);
      setSummary(null);
    } catch (err) {
      console.error('Failed to clear cart:', err);
    }
  }, [token, isGuest]);

  const fetchSummary = useCallback(async () => {
    if (cart.item_count === 0) return;

    try {
      setSummaryLoading(true);
      if (isGuest) {
        // Call guest summary endpoint with current cart items
        const res = await axios.post(`${API_BASE_URL}/cart/guest-summary`, { items: cart.items });
        setSummary(res.data);
      } else {
        // Call registered user summary endpoint
        const res = await axios.get(`${API_BASE_URL}/cart/summary`, { headers: authHeaders });
        setSummary(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch summary:', err);
    } finally {
      setSummaryLoading(false);
    }
  }, [token, isGuest, cart.item_count, cart.items]);

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
