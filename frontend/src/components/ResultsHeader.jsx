import React from 'react';

/**
 * ResultsHeader displays the search query context and total results count.
 */
const ResultsHeader = ({ count, query }) => {
  return (
    <div style={styles.container}>
      <div style={styles.left}>
        <h2 style={styles.countText}>
          {count} {count === 1 ? 'product' : 'products'} found
        </h2>
        {query && (
          <p style={styles.queryText}>
            For: <span style={styles.queryHighlight}>"{query}"</span>
          </p>
        )}
      </div>

      <div style={styles.right}>
        <span style={styles.badge}>
          <span style={styles.dot}></span>
          Constraint-Aware Search
        </span>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    gap: '12px',
    paddingBottom: '16px',
    marginBottom: '20px',
    borderBottom: '1.5px solid #e2e8f0',
  },
  left: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  countText: {
    fontSize: '1.25rem',
    fontWeight: '800',
    color: '#0f172a',
    margin: 0,
  },
  queryText: {
    fontSize: '0.88rem',
    color: '#64748b',
    margin: 0,
  },
  queryHighlight: {
    color: '#4f46e5',
    fontWeight: '600',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.75rem',
    fontWeight: '600',
    color: '#059669',
    backgroundColor: '#ecfdf5',
    border: '1px solid #a7f3d0',
    padding: '4px 10px',
    borderRadius: '20px',
  },
  dot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#10b981',
  },
};

export default ResultsHeader;
