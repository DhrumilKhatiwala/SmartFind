import React from 'react';

/**
 * Header component displays the SmartFind brand, badge, and descriptive subtitle.
 */
const Header = () => {
  return (
    <header style={styles.header}>
      <div style={styles.badge}>
        <span style={styles.badgePulse}></span>
        Constraint-Aware Hybrid Search
      </div>
      <h1 style={styles.title}>SmartFind</h1>
      <p style={styles.subtitle}>

        Natural-language product search with automatic semantic matching and structured metadata constraints.
      </p>
    </header>
  );
};

const styles = {
  header: {
    textAlign: 'center',
    marginBottom: '32px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 14px',
    backgroundColor: '#eef2ff',
    color: '#4338ca',
    borderRadius: '20px',
    fontSize: '0.78rem',
    fontWeight: '700',
    letterSpacing: '0.03em',
    marginBottom: '12px',
    border: '1px solid #c7d2fe',
  },
  badgePulse: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#6366f1',
    animation: 'pulse 2s infinite ease-in-out',
  },
  title: {
    fontSize: '2.4rem',
    fontWeight: '800',
    letterSpacing: '-0.03em',
    color: '#0f172a',
    margin: '0 0 10px 0',
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
