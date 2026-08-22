import React from 'react';
import { IconZap } from './Icons';

/**
 * ResultsHeader displays the search query context, total results count,
 * real measured search latency, and constraint-aware badge.
 */
const ResultsHeader = ({ count, query, latencyMs }) => {
  return (
    <div style={styles.container}>
      <div style={styles.left}>
        <div style={styles.titleRow}>
          <h2 style={styles.countText}>
            {count.toLocaleString('en-IN')} {count === 1 ? 'product' : 'products'} found
          </h2>
          {latencyMs !== undefined && latencyMs !== null && latencyMs > 0 && (
            <span style={styles.latencyBadge} title="Total client-measured round-trip retrieval latency">
              <IconZap size={12} color="#475569" style={{ marginRight: '4px' }} />
              took {latencyMs < 1000 ? `${latencyMs}ms` : `${(latencyMs / 1000).toFixed(2)}s`}
            </span>
          )}
        </div>
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
    paddingBottom: '14px',
    marginBottom: '18px',
    borderBottom: '1.5px solid #e2e8f0',
    width: '100%',
    minWidth: 0,
  },
  left: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    minWidth: 0,
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
  },
  countText: {
    fontSize: '1.22rem',
    fontWeight: '800',
    color: '#0f172a',
    margin: 0,
    letterSpacing: '-0.02em',
  },
  latencyBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: '0.74rem',
    fontWeight: '600',
    color: '#475569',
    backgroundColor: '#f1f5f9',
    border: '1px solid #e2e8f0',
    padding: '2px 8px',
    borderRadius: '6px',
  },
  queryText: {
    fontSize: '0.86rem',
    color: '#64748b',
    margin: 0,
    overflowWrap: 'break-word',
    wordBreak: 'break-word',
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
    fontSize: '0.74rem',
    fontWeight: '600',
    color: '#059669',
    backgroundColor: '#ecfdf5',
    border: '1px solid #a7f3d0',
    padding: '4px 10px',
    borderRadius: '20px',
    whiteSpace: 'nowrap',
  },
  dot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#10b981',
  },
};

export default ResultsHeader;
