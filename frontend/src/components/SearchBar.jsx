import React from 'react';

/**
 * SearchBar component provides natural-language search input, clear button, and suggestions.
 */
const SearchBar = ({
  query,
  setQuery,
  onSearch,
  onClear,
  loading,
  hasResultsOrSearched,
  sampleQueries = [],
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim() || loading) return;
    onSearch();
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.form}>
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
            placeholder="Try: headphones under ₹1500 with rating above 4"
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
              Analyzing query...
            </span>
          ) : (
            'Search'
          )}
        </button>
      </form>

      {/* Suggested Query Chips */}
      {sampleQueries.length > 0 && (
        <div style={styles.suggestionsContainer}>
          <span style={styles.suggestionLabel}>Suggested:</span>
          <div style={styles.chipList}>
            {sampleQueries.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                disabled={loading}
                onClick={() => {
                  setQuery(sample);
                  onSearch(sample);
                }}
                style={styles.chip}
              >
                {sample}
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
    width: '100%',
    maxWidth: '860px',
    margin: '0 auto 28px auto',
  },
  form: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    width: '100%',
  },
  inputWrapper: {
    position: 'relative',
    flex: 1,
    display: 'flex',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: '16px',
    color: '#6366f1',
    pointerEvents: 'none',
  },
  input: {
    width: '100%',
    padding: '14px 75px 14px 48px',
    fontSize: '0.98rem',
    borderRadius: '14px',
    border: '1.5px solid #cbd5e1',
    backgroundColor: '#ffffff',
    color: '#0f172a',
    outline: 'none',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    fontFamily: 'inherit',
  },
  clearBtn: {
    position: 'absolute',
    right: '12px',
    padding: '5px 10px',
    backgroundColor: '#f1f5f9',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    color: '#64748b',
    fontSize: '0.78rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  submitBtn: {
    padding: '14px 26px',
    backgroundColor: '#4f46e5',
    color: '#ffffff',
    fontSize: '0.96rem',
    fontWeight: '700',
    borderRadius: '14px',
    border: 'none',
    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
    transition: 'background-color 0.2s ease, transform 0.1s ease',
    whiteSpace: 'nowrap',
    fontFamily: 'inherit',
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
    alignItems: 'center',
    gap: '10px',
    marginTop: '14px',
    flexWrap: 'wrap',
  },
  suggestionLabel: {
    fontSize: '0.8rem',
    color: '#64748b',
    fontWeight: '600',
  },
  chipList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  chip: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    padding: '5px 12px',
    borderRadius: '20px',
    fontSize: '0.78rem',
    color: '#475569',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
    fontFamily: 'inherit',
    fontWeight: '500',
  },
};

export default SearchBar;
