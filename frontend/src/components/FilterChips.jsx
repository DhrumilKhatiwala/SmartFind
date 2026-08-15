import React from 'react';

/**
 * FilterChips component renders visually distinct chips for detected query constraints.
 * Extracts constraints dynamically from explanation or results metadata.
 */
const FilterChips = ({ constraints }) => {
  if (!constraints || constraints.length === 0) return null;

  return (
    <div style={styles.container} aria-label="Active Search Constraints">
      <span style={styles.label}>Active Filters:</span>
      <div style={styles.chipList}>
        {constraints.map((chip, idx) => {
          const label = typeof chip === 'string' ? chip : chip.label;
          return (
            <span key={idx} style={styles.chip}>
              {label}
            </span>
          );
        })}
      </div>
    </div>
  );
};


const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '16px',
    padding: '8px 14px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
  },
  label: {
    fontSize: '0.78rem',
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginRight: '4px',
  },
  chipList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
  },
  chip: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 12px',
    backgroundColor: '#eef2ff',
    color: '#4338ca',
    border: '1px solid #c7d2fe',
    borderRadius: '8px',
    fontSize: '0.82rem',
    fontWeight: '600',
    lineHeight: 1.3,
  },
};

export default FilterChips;

