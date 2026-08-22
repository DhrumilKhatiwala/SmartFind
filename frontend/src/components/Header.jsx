import React from 'react';

const Header = () => {
  return (
    <header style={styles.header}>
      <h1 className="header-title" style={styles.title}>SmartFind</h1>
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
