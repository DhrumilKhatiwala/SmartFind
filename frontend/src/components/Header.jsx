import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import CartIcon from './CartIcon';
import Logo from './Logo';

const Header = () => {
  const { user, logout, isAuthenticated, isGuest } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="header-container" style={styles.header}>
      <div className="header-top-row" style={styles.topRow}>
        {/* Spacer for desktop balance */}
        <div className="header-spacer" style={styles.spacer} />

        {/* Center title with Brand Logo */}
        <div className="header-brand-block" style={styles.centerBlock}>
          <div style={styles.brandRow} onClick={() => navigate('/')}>
            <Logo size={38} />
            <h1 className="header-title" style={styles.title}>
              SmartFind
            </h1>
          </div>
        </div>

        {/* Right actions */}
        <div className="header-actions" style={styles.actions}>
          {isAuthenticated ? (
            <>
              <CartIcon />
              {isGuest ? (
                /* Guest Session Pill */
                <div className="guest-pill" style={styles.guestPill}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#b45309', flexShrink: 0 }}>
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <span className="guest-badge-text" style={styles.guestBadge}>Guest</span>
                  <button
                    onClick={() => navigate('/login')}
                    className="save-cart-btn"
                    style={styles.saveCartBtn}
                    title="Sign up to keep your cart permanently"
                  >
                    Save Cart
                  </button>
                  <button onClick={logout} style={styles.logoutBtn} title="End Guest Session">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                /* Registered User Pill */
                <div className="user-pill" style={styles.userPill}>
                  <span style={styles.avatar}>{user?.username?.[0]?.toUpperCase() || '?'}</span>
                  <span style={styles.username}>{user?.username}</span>
                  <button onClick={logout} style={styles.logoutBtn} title="Sign Out">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                  </button>
                </div>
              )}
            </>
          ) : (
            /* Unauthenticated Visitor Options */
            <div style={styles.visitorActions}>
              <button onClick={() => navigate('/login')} style={styles.signInBtn}>
                Sign In
              </button>
            </div>
          )}
        </div>
      </div>

      <p className="header-subtitle" style={styles.subtitle}>
        Natural-language product search with automatic semantic matching and structured metadata constraints.
      </p>
    </header>
  );
};

const styles = {
  header: {
    textAlign: 'center',
    marginBottom: '28px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
  },
  topRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: '10px',
  },
  spacer: { flex: 1 },
  brandRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    cursor: 'pointer',
    userSelect: 'none',
  },
  centerBlock: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
  },
  title: {
    fontSize: '2.4rem',
    fontWeight: '800',
    letterSpacing: '-0.03em',
    color: '#0f172a',
    margin: 0,
    cursor: 'pointer',
    lineHeight: '1.2',
  },
  actions: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '10px',
  },
  userPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#f1f5f9',
    padding: '5px 12px 5px 6px',
    borderRadius: '28px',
    border: '1px solid #e2e8f0',
  },
  avatar: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
    color: '#fff',
    fontWeight: '700',
    fontSize: '0.82rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  username: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: '#334155',
  },
  guestPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#fffbeb',
    padding: '5px 10px',
    borderRadius: '24px',
    border: '1px solid #fde68a',
  },
  guestBadge: {
    fontSize: '0.78rem',
    fontWeight: '700',
    color: '#b45309',
  },
  saveCartBtn: {
    background: '#d97706',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    padding: '4px 10px',
    fontSize: '0.75rem',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    whiteSpace: 'nowrap',
  },
  logoutBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#94a3b8',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    transition: 'color 0.2s ease',
  },
  visitorActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  signInBtn: {
    padding: '8px 16px',
    backgroundColor: '#4f46e5',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '0.88rem',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  },
  subtitle: {
    fontSize: '1rem',
    color: '#64748b',
    maxWidth: '620px',
    lineHeight: '1.5',
    margin: 0,
  },
};

export default Header;
