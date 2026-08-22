import React from 'react';

/**
 * Ultra-minimal, elegant single-line footer.
 */
const Footer = () => {
  return (
    <footer style={styles.footer} aria-label="SmartFind footer">
      <p style={styles.text}>
        SmartFind — Constraint-Aware Hybrid Product Search
      </p>
    </footer>
  );
};

const styles = {
  footer: {
    marginTop: 'auto',
    paddingTop: '36px',
    paddingBottom: '24px',
    textAlign: 'center',
    width: '100%',
  },
  text: {
    fontSize: '0.78rem',
    color: '#94a3b8',
    fontWeight: '500',
    letterSpacing: '0.01em',
    margin: 0,
  },
};

export default Footer;
