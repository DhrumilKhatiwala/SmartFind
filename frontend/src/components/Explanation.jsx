import React from 'react';

/**
 * Explanation component displays the backend explainability reasoning.
 * Initially collapsed, expandable on click.
 */
const Explanation = ({ explanation, isOpen, onToggle }) => {
  if (!explanation) return null;

  return (
    <div style={styles.container}>
      <button
        type="button"
        onClick={onToggle}
        style={styles.toggleButton}
        aria-expanded={isOpen}
        aria-label="Toggle explanation of why this product matched"
      >
        <span style={styles.label}>
          <span style={styles.icon}>💡</span>
          Why this matched
        </span>
        <span style={styles.chevron}>
          {isOpen ? '▲' : '▼'}
        </span>
      </button>

      {isOpen && (
        <div style={styles.contentBox}>
          <p style={styles.text}>{explanation}</p>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    marginTop: '10px',
    paddingTop: '8px',
    borderTop: '1px dashed #e2e8f0',
    width: '100%',
    minWidth: 0,
  },
  toggleButton: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'none',
    border: 'none',
    padding: '4px 0',
    cursor: 'pointer',
    color: '#4f46e5',
    fontSize: '0.8rem',
    fontWeight: '600',
    fontFamily: 'inherit',
    textAlign: 'left',
    transition: 'color 0.15s ease',
  },
  label: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    minWidth: 0,
    fontSize: '0.78rem',
  },
  icon: {
    fontSize: '0.85rem',
    flexShrink: 0,
  },
  chevron: {
    fontSize: '0.65rem',
    color: '#6366f1',
    marginLeft: '6px',
    flexShrink: 0,
  },
  contentBox: {
    marginTop: '8px',
    padding: '10px 12px',
    backgroundColor: '#f8fafc',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    animation: 'fadeIn 0.2s ease-in-out',
    width: '100%',
    minWidth: 0,
    boxSizing: 'border-box',
  },
  text: {
    fontSize: '0.76rem',
    color: '#334155',
    lineHeight: '1.5',
    margin: 0,
    fontWeight: '500',
    overflowWrap: 'break-word',
    wordBreak: 'break-word',
    hyphens: 'auto',
  },
};

export default Explanation;
