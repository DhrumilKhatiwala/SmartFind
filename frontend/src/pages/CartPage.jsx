import React from 'react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const CartPage = () => {
  const { cart, loading, summary, summaryLoading, updateQuantity, removeItem, clearCart, fetchSummary } = useCart();
  const { user, isGuest } = useAuth();
  const navigate = useNavigate();

  const formatPrice = (val) => {
    if (val === null || val === undefined) return 'N/A';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  const secureUrl = (url) => url ? String(url).replace(/^http:\/\//i, 'https://') : null;

  return (
    <div className="cart-page-wrapper" style={styles.wrapper}>
      <div style={styles.container}>
        {/* Header Row */}
        <div className="cart-header-row" style={styles.headerRow}>
          <div>
            <h1 className="cart-header-title" style={styles.title}>Your Cart</h1>
            <p style={styles.subtitle}>
              {user && <span>Hey <strong>{user.username}</strong> — </span>}
              {cart.item_count === 0 ? 'Your cart is empty.' : `${cart.item_count} item${cart.item_count > 1 ? 's' : ''} in your cart.`}
            </p>
          </div>
          <div className="cart-header-actions" style={styles.headerActions}>
            <button onClick={() => navigate('/')} style={styles.backBtn}>
              ← Back to Search
            </button>
            {cart.items.length > 0 && (
              <button onClick={clearCart} style={styles.clearBtn}>
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Guest Session Notice */}
        {isGuest && (
          <div className="cart-guest-alert" style={styles.guestAlert}>
            <div style={styles.guestAlertIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            </div>
            <div style={styles.guestAlertContent}>
              <strong style={{ color: '#92400e' }}>Guest Session:</strong>{' '}
              <span style={{ color: '#78350f' }}>
                Your cart is stored temporarily for this session and will be lost when you close this browser tab.{' '}
              </span>
              <button onClick={() => navigate('/login')} style={styles.guestAlertLink}>
                Sign In or Register to Save
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div style={styles.loadingBox}>
            <div style={styles.loadingSpinner}></div>
            <p style={{ color: '#64748b' }}>Loading your cart...</p>
          </div>
        ) : cart.items.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>🛒</div>
            <h2 style={styles.emptyTitle}>Your cart is empty</h2>
            <p style={styles.emptySubtitle}>Find great products using natural language and add them here!</p>
            <button onClick={() => navigate('/')} style={styles.startShoppingBtn}>
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="cart-layout">
            {/* Left: Items List */}
            <div className="cart-items-list" style={styles.itemsList}>
              {cart.items.map((item) => (
                <div key={item.product_id} className="cart-item-card" style={styles.itemCard}>
                  <div className="cart-item-top" style={styles.itemTop}>
                    {item.image && (
                      <img
                        src={secureUrl(item.image)}
                        alt={item.title}
                        className="cart-item-image"
                        style={styles.itemImage}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    )}
                    <div className="cart-item-details" style={styles.itemDetails}>
                      <h3 style={styles.itemTitle}>{item.title}</h3>
                      {item.category && <span style={styles.itemCat}>{item.category}</span>}
                      <div style={styles.itemPriceRow}>
                        <span style={styles.itemPrice}>{formatPrice(item.price)}</span>
                        {item.quantity > 1 && (
                          <span style={styles.itemSubtotal}>
                            Total: {formatPrice(item.price * item.quantity)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="cart-item-actions" style={styles.itemActions}>
                    <div style={styles.quantityPicker}>
                      <button
                        onClick={() => {
                          if (item.quantity > 1) updateQuantity(item.product_id, item.quantity - 1);
                          else removeItem(item.product_id);
                        }}
                        style={styles.qtyBtn}
                        aria-label="Decrease quantity"
                      >
                        -
                      </button>
                      <span style={styles.qtyNum}>{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                        style={styles.qtyBtn}
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={() => removeItem(item.product_id)}
                      style={styles.removeBtn}
                      title="Remove product"
                      aria-label="Remove item"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                      </svg>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Right: Cart Summary & Groq AI Assistant */}
            <div className="cart-summary-sidebar" style={styles.summarySidebar}>
              <div style={styles.summaryCard}>
                <h2 style={styles.summaryHeading}>Order Summary</h2>
                <div style={styles.summaryRow}>
                  <span style={styles.summaryLabel}>Total Items:</span>
                  <span style={styles.summaryValue}>{cart.item_count}</span>
                </div>
                <div style={styles.summaryRow}>
                  <span style={styles.summaryLabel}>Subtotal:</span>
                  <span style={styles.summaryValue}>{formatPrice(cart.total_price)}</span>
                </div>
                <div style={styles.summaryRow}>
                  <span style={styles.summaryLabel}>Shipping:</span>
                  <span style={{ color: '#059669', fontWeight: '700' }}>FREE</span>
                </div>

                <hr style={styles.divider} />

                <div style={{ ...styles.summaryRow, marginBottom: '20px' }}>
                  <span style={{ ...styles.summaryLabel, fontWeight: '700', color: '#0f172a' }}>Estimated Total:</span>
                  <span style={styles.summaryTotal}>{formatPrice(cart.total_price)}</span>
                </div>

                {/* Groq AI Cart Intelligence */}
                <div style={styles.aiSection}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                    <span style={styles.summaryTitle}>AI Cart Assistant</span>
                  </div>

                  {summary ? (
                    <div style={styles.aiSummaryBox}>
                      <p style={styles.aiText}>{summary.summary || summary.summary_text}</p>
                      {summary.category_breakdown && summary.category_breakdown.length > 0 && (
                        <div style={styles.catBreakdown}>
                          <h4 style={styles.catHeading}>Category Breakdown:</h4>
                          {summary.category_breakdown.map((cat) => (
                            <div key={cat.category} style={styles.catRow}>
                              <span>{cat.category} ({cat.item_count})</span>
                              <strong>{formatPrice(cat.subtotal)}</strong>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={fetchSummary}
                      disabled={summaryLoading}
                      style={styles.aiBtn}
                    >
                      {summaryLoading ? (
                        <span>Analyzing cart...</span>
                      ) : (
                        <span>Generate AI Cart Summary</span>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  wrapper: {
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    padding: '30px 20px',
  },
  container: {
    maxWidth: '1100px',
    margin: '0 auto',
    width: '100%',
  },
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  title: {
    fontSize: '2rem',
    fontWeight: '800',
    color: '#0f172a',
    margin: 0,
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: '0.95rem',
    color: '#64748b',
    marginTop: '4px',
  },
  headerActions: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
  },
  backBtn: {
    padding: '9px 16px',
    backgroundColor: '#ffffff',
    color: '#334155',
    border: '1px solid #cbd5e1',
    borderRadius: '10px',
    fontSize: '0.88rem',
    fontWeight: '600',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.15s ease',
  },
  clearBtn: {
    padding: '9px 16px',
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    border: '1px solid #fecaca',
    borderRadius: '10px',
    fontSize: '0.88rem',
    fontWeight: '600',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.15s ease',
  },
  guestAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: '#fffbeb',
    border: '1px solid #fde68a',
    borderRadius: '14px',
    padding: '12px 18px',
    marginBottom: '22px',
  },
  guestAlertIcon: {
    display: 'flex',
    alignItems: 'center',
  },
  guestAlertContent: {
    fontSize: '0.88rem',
    lineHeight: '1.4',
  },
  guestAlertLink: {
    background: 'none',
    border: 'none',
    color: '#b45309',
    fontWeight: '700',
    textDecoration: 'underline',
    cursor: 'pointer',
    padding: 0,
    marginLeft: '6px',
  },
  loadingBox: {
    textAlign: 'center',
    padding: '60px 20px',
  },
  loadingSpinner: {
    width: '32px',
    height: '32px',
    border: '3px solid #e2e8f0',
    borderTopColor: '#4f46e5',
    borderRadius: '50%',
    margin: '0 auto 12px auto',
    animation: 'spin 0.8s linear infinite',
  },
  emptyState: {
    textAlign: 'center',
    padding: '80px 20px',
    backgroundColor: '#ffffff',
    borderRadius: '20px',
    border: '1px solid #e2e8f0',
  },
  emptyIcon: {
    fontSize: '3.5rem',
    marginBottom: '16px',
  },
  emptyTitle: {
    fontSize: '1.4rem',
    fontWeight: '700',
    color: '#0f172a',
    margin: '0 0 8px 0',
  },
  emptySubtitle: {
    fontSize: '0.95rem',
    color: '#64748b',
    margin: '0 0 20px 0',
  },
  startShoppingBtn: {
    padding: '12px 24px',
    backgroundColor: '#4f46e5',
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '0.95rem',
    fontWeight: '700',
    cursor: 'pointer',
  },
  itemsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  itemCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '16px 20px',
    border: '1px solid #e2e8f0',
  },
  itemTop: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flex: 1,
    minWidth: 0,
  },
  itemImage: {
    width: '80px',
    height: '80px',
    objectFit: 'contain',
    borderRadius: '8px',
    backgroundColor: '#f8fafc',
    flexShrink: 0,
  },
  itemDetails: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    minWidth: 0,
  },
  itemTitle: {
    fontSize: '0.95rem',
    fontWeight: '600',
    color: '#0f172a',
    margin: 0,
    lineHeight: '1.35',
    overflowWrap: 'break-word',
    wordBreak: 'break-word',
  },
  itemCat: {
    fontSize: '0.75rem',
    color: '#64748b',
    backgroundColor: '#f1f5f9',
    padding: '2px 8px',
    borderRadius: '6px',
    alignSelf: 'flex-start',
    maxWidth: '100%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  itemPriceRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginTop: '4px',
    flexWrap: 'wrap',
  },
  itemPrice: {
    fontSize: '1rem',
    fontWeight: '700',
    color: '#0f172a',
  },
  itemSubtotal: {
    fontSize: '0.82rem',
    color: '#64748b',
  },
  itemActions: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '10px',
  },
  quantityPicker: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#f1f5f9',
    borderRadius: '10px',
    padding: '4px 8px',
  },
  qtyBtn: {
    background: 'none',
    border: 'none',
    fontWeight: '700',
    fontSize: '1.1rem',
    color: '#334155',
    cursor: 'pointer',
    padding: '2px 8px',
    minWidth: '28px',
    minHeight: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyNum: {
    fontSize: '0.92rem',
    fontWeight: '700',
    color: '#0f172a',
    minWidth: '20px',
    textAlign: 'center',
  },
  removeBtn: {
    background: 'none',
    border: 'none',
    color: '#dc2626',
    fontSize: '0.82rem',
    fontWeight: '600',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    transition: 'all 0.15s ease',
  },
  summarySidebar: {
    position: 'sticky',
    top: '20px',
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: '18px',
    padding: '24px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
  },
  summaryHeading: {
    fontSize: '1.2rem',
    fontWeight: '700',
    color: '#0f172a',
    margin: '0 0 16px 0',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.95rem',
    marginBottom: '10px',
  },
  summaryLabel: {
    color: '#64748b',
  },
  summaryValue: {
    fontWeight: '600',
    color: '#0f172a',
  },
  summaryTotal: {
    fontSize: '1.25rem',
    fontWeight: '800',
    color: '#0f172a',
  },
  divider: {
    border: 'none',
    borderTop: '1px solid #e2e8f0',
    margin: '18px 0',
  },
  aiSection: {
    marginTop: '12px',
  },
  summaryTitle: {
    fontSize: '0.88rem',
    fontWeight: '700',
    color: '#4f46e5',
    margin: 0,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  aiSummaryBox: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '14px',
    marginTop: '8px',
  },
  aiText: {
    fontSize: '0.88rem',
    lineHeight: '1.5',
    color: '#334155',
    margin: '0 0 12px 0',
  },
  catBreakdown: {
    borderTop: '1px dashed #cbd5e1',
    paddingTop: '10px',
  },
  catHeading: {
    fontSize: '0.8rem',
    fontWeight: '700',
    color: '#64748b',
    margin: '0 0 6px 0',
  },
  catRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.8rem',
    color: '#475569',
    marginBottom: '4px',
  },
  aiBtn: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#4f46e5',
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '0.9rem',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  },
};

export default CartPage;
