import React from 'react';

/**
 * EmptyState renders a helpful message when zero products match the user's constraints.
 */
const EmptyState = ({ query, onSuggestionClick }) => {
  const suggestions = [
    'headphones with rating above 4',
    'smartphones under 30000',
    'wireless earbuds under 2000',
    'laptop backpacks',
  ];

  return (
    <div style={styles.container} role="status">
      <div style={styles.iconCircle}>
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#6366f1"
          strokeWidth="1.75"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
          <line x1="8" y1="11" x2="14" y2="11" />
        </svg>
      </div>

      <h3 style={styles.title}>No products matched your constraints</h3>
      <p style={styles.subtitle}>
        Try relaxing your price, rating, or category requirements to see more items.
      </p>

      {onSuggestionClick && (
        <div style={styles.suggestionBox}>
          <span style={styles.suggestionTitle}>Try one of these relaxed searches:</span>
          <div style={styles.suggestionList}>
            {suggestions.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onSuggestionClick(item)}
                style={styles.suggestionBtn}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    padding: '60px 24px',
    backgroundColor: '#ffffff',
    borderRadius: '20px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.03)',
    maxWidth: '680px',
    margin: '30px auto',
  },
  iconCircle: {
    width: '72px',
    height: '72px',
    borderRadius: '50%',
    backgroundColor: '#eef2ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '20px',
  },
  title: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '0.92rem',
    color: '#64748b',
    maxWidth: '480px',
    lineHeight: '1.5',
    marginBottom: '28px',
  },
  suggestionBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    paddingTop: '20px',
    borderTop: '1px solid #f1f5f9',
    width: '100%',
  },
  suggestionTitle: {
    fontSize: '0.82rem',
    fontWeight: '600',
    color: '#475569',
  },
  suggestionList: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: '8px',
  },
  suggestionBtn: {
    backgroundColor: '#f8fafc',
    border: '1px solid #cbd5e1',
    color: '#334155',
    padding: '6px 14px',
    borderRadius: '16px',
    fontSize: '0.8rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    fontFamily: 'inherit',
  },
};

export default EmptyState;
