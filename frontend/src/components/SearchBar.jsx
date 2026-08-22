import React from 'react';

const defaultSamples = [
  { text: 'headphones under ₹1,500 with rating above 4', label: 'Price + Rating' },
  { text: 'running shoes with rating above 4.2', label: 'Rating Floor' },
  { text: 'laptops under ₹45,000 in electronics', label: 'Category + Budget' },
  { text: 'wireless earbuds under ₹2,000', label: 'Price Constraint' },
  { text: 'air fryer under ₹5,000 with rating above 4', label: 'Multi-Constraint' },
];

const SearchBar = ({
  query,
  setQuery,
  onSearch,
  onClear,
  loading,
  hasResultsOrSearched,
  sampleQueries = defaultSamples,
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim() || loading) return;
    onSearch();
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} className="search-form" style={styles.form}>
        <div style={styles.inputWrapper}>
          <svg
            style={styles.searchIcon}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            width="20"
            height="20"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Try: headphones under ₹1,500 with rating above 4"
            style={styles.input}
            disabled={loading}
            aria-label="Search products naturally with natural language filters"
          />

          {(query || hasResultsOrSearched) && !loading && (
            <button
              type="button"
              onClick={onClear}
              style={styles.clearBtn}
              title="Clear search"
              aria-label="Clear search input and results"
            >
              Clear
            </button>
          )}
        </div>

        <button
          type="submit"
          className="search-submit-btn"
          disabled={loading || !query.trim()}
          style={{
            ...styles.submitBtn,
            opacity: loading || !query.trim() ? 0.7 : 1,
            cursor: loading || !query.trim() ? 'not-allowed' : 'pointer',
          }}
          aria-label="Execute search"
        >
          {loading ? (
            <span style={styles.btnLoading}>
              <span style={styles.spinner}></span>
              Searching...
            </span>
          ) : (
            'Search'
          )}
        </button>
      </form>

      {/* Suggested Query Chips with Badges */}
      {sampleQueries.length > 0 && (
        <div style={styles.suggestionsContainer}>
          <span style={styles.suggestionLabel}>Try Examples:</span>
          <div style={styles.chipList}>
            {sampleQueries.map((item, idx) => {
              const queryText = typeof item === 'string' ? item : item.text;
              const badgeLabel = typeof item === 'object' ? item.label : null;

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    setQuery(queryText);
                    onSearch(queryText);
                  }}
                  style={styles.chip}
                  title={`Search: "${queryText}"`}
                >
                  <span style={styles.chipText}>{queryText}</span>
                  {badgeLabel && (
                    <span style={styles.chipBadge}>{badgeLabel}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    width: '100%',
    maxWidth: '880px',
    margin: '0 auto 24px auto',
    minWidth: 0,
  },
  form: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
    width: '100%',
    minWidth: 0,
  },
  inputWrapper: {
    position: 'relative',
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    minWidth: 0,
  },
  searchIcon: {
    position: 'absolute',
    left: '14px',
    color: '#6366f1',
    pointerEvents: 'none',
    flexShrink: 0,
  },
  input: {
    width: '100%',
    padding: '13px 68px 13px 44px',
    fontSize: '0.94rem',
    borderRadius: '14px',
    border: '1.5px solid #cbd5e1',
    backgroundColor: '#ffffff',
    color: '#0f172a',
    outline: 'none',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    fontFamily: 'inherit',
    minWidth: 0,
    boxSizing: 'border-box',
  },
  clearBtn: {
    position: 'absolute',
    right: '10px',
    padding: '5px 9px',
    backgroundColor: '#f1f5f9',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    color: '#64748b',
    fontSize: '0.75rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    flexShrink: 0,
  },
  submitBtn: {
    padding: '13px 24px',
    backgroundColor: '#4f46e5',
    color: '#ffffff',
    fontSize: '0.94rem',
    fontWeight: '700',
    borderRadius: '14px',
    border: 'none',
    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
    transition: 'background-color 0.2s ease, transform 0.1s ease',
    whiteSpace: 'nowrap',
    fontFamily: 'inherit',
    flexShrink: 0,
  },
  btnLoading: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  spinner: {
    width: '14px',
    height: '14px',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: '#ffffff',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    display: 'inline-block',
  },
  suggestionsContainer: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    marginTop: '12px',
    flexWrap: 'wrap',
    width: '100%',
    minWidth: 0,
  },
  suggestionLabel: {
    fontSize: '0.78rem',
    color: '#64748b',
    fontWeight: '700',
    paddingTop: '4px',
    flexShrink: 0,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  chipList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    flex: 1,
    minWidth: 0,
  },
  chip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    padding: '4px 10px',
    borderRadius: '16px',
    fontSize: '0.76rem',
    color: '#334155',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
    fontFamily: 'inherit',
    fontWeight: '500',
    maxWidth: '100%',
    overflowWrap: 'break-word',
    wordBreak: 'break-word',
    textAlign: 'left',
  },
  chipText: {
    overflowWrap: 'break-word',
  },
  chipBadge: {
    fontSize: '0.68rem',
    fontWeight: '600',
    backgroundColor: '#eff6ff',
    color: '#2563eb',
    padding: '1px 6px',
    borderRadius: '10px',
    border: '1px solid #bfdbfe',
    whiteSpace: 'nowrap',
  },
};

export default SearchBar;
