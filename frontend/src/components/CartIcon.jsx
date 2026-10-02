import React from 'react';
import { useCart } from '../contexts/CartContext';
import { useNavigate } from 'react-router-dom';

const CartIcon = () => {
  const { cart } = useCart();
  const navigate = useNavigate();

  return (
    <button onClick={() => navigate('/cart')} style={styles.btn} title="View Cart" aria-label="Shopping cart">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
      </svg>
      {cart.item_count > 0 && (
        <span style={styles.badge}>{cart.item_count > 99 ? '99+' : cart.item_count}</span>
      )}
    </button>
  );
};

const styles = {
  btn: {
    position: 'relative',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#334155',
    padding: '8px',
    borderRadius: '10px',
    transition: 'background-color 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: '0',
    right: '0',
    backgroundColor: '#4f46e5',
    color: '#fff',
    fontSize: '0.65rem',
    fontWeight: '800',
    minWidth: '18px',
    height: '18px',
    borderRadius: '9px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 4px',
    border: '2px solid #f8fafc',
  },
};

export default CartIcon;
