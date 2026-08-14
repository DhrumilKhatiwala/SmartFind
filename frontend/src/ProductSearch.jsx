import React, { useState } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const ProductSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);

  const sampleQueries = [
    'phones under 20000 with rating above 4',
    'headphones under ₹2000',
    'electronics products under 1000',
    'running shoes under 1500',
  ];

  const handleSearch = async (searchQuery) => {
    const activeQuery = searchQuery !== undefined ? searchQuery : query;
    if (!activeQuery.trim()) return;

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/search`, {
        query: activeQuery.trim(),
        top_k: 10,
      });

      setResults(response.data.results || []);
    } catch (err) {
      console.error('Search API Error:', err);
      setError(
        err.response?.data?.detail ||
          'Failed to retrieve products. Please verify that the backend server is running.'
      );
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSearch();
  };

  const formatPrice = (price) => {
    if (price === null || price === undefined) return 'N/A';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const parseProductContent = (pageContent) => {
    if (!pageContent) return { title: 'Unnamed Product', subCategory: '' };
    const parts = pageContent.split(' - ');
    if (parts.length > 1) {
      return {
        title: parts.slice(0, -1).join(' - ').trim(),
        subCategory: parts[parts.length - 1].trim(),
      };
    }
    return { title: pageContent.trim(), subCategory: '' };
  };

  return (
    <div style={styles.container}>
      {/* Header Section */}
      <header style={styles.header}>
        <div style={styles.badge}>AI-Powered Natural Language Search</div>
        <h1 style={styles.title}>QueryForge Product Search</h1>
        <p style={styles.subtitle}>
          Search products naturally using semantic descriptions, price limits, and rating filters
        </p>
      </header>

      {/* Search Input Bar */}
      <form onSubmit={handleSubmit} style={styles.searchForm}>
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
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., phones under 20000 with rating above 4..."
            style={styles.input}
            disabled={loading}
          />
          {query && !loading && (
            <button
              type="button"
              onClick={() => setQuery('')}
              style={styles.clearButton}
              aria-label="Clear input"
            >
              ✕
            </button>
          )}
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          style={{
            ...styles.submitButton,
            opacity: loading || !query.trim() ? 0.7 : 1,
            cursor: loading || !query.trim() ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {/* Suggested Query Chips */}
      <div style={styles.suggestionsContainer}>
        <span style={styles.suggestionLabel}>Try searching:</span>
        <div style={styles.chipList}>
          {sampleQueries.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setQuery(sample);
                handleSearch(sample);
              }}
              style={styles.chip}
            >
              {sample}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Analyzing query...</p>
          <span style={styles.loadingSubtext}>
            Converting natural language to semantic vectors and structured metadata filters
          </span>
        </div>
      )}

      {/* Error Message */}
      {error && !loading && (
        <div style={styles.errorContainer}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span style={styles.errorText}>{error}</span>
        </div>
      )}

      {/* Results Grid */}
      {!loading && searched && results.length > 0 && (
        <div style={styles.resultsWrapper}>
          <div style={styles.resultsHeader}>
            <span style={styles.resultsCount}>
              Found <strong>{results.length}</strong> matching products
            </span>
          </div>

          <div style={styles.grid}>
            {results.map((item, index) => {
              const { title, subCategory } = parseProductContent(item.page_content);
              const { price, rating, category } = item.metadata || {};

              return (
                <div key={index} style={styles.card}>
                  <div>
                    <div style={styles.cardHeader}>
                      <span style={styles.categoryBadge}>
                        {category || 'General'}
                      </span>
                      {subCategory && (
                        <span style={styles.subCategoryBadge}>
                          {subCategory}
                        </span>
                      )}
                    </div>

                    <h3 style={styles.productTitle} title={title}>
                      {title}
                    </h3>
                  </div>

                  <div style={styles.cardFooter}>
                    <div style={styles.priceContainer}>
                      <span style={styles.priceLabel}>Price</span>
                      <span style={styles.priceValue}>
                        {formatPrice(price)}
                      </span>
                    </div>

                    <div style={styles.ratingContainer}>
                      <span style={styles.ratingLabel}>Rating</span>
                      <div style={styles.ratingBadge}>
                        <span style={styles.starIcon}>★</span>
                        <span style={styles.ratingValue}>
                          {rating !== null && rating !== undefined ? Number(rating).toFixed(1) : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && searched && results.length === 0 && !error && (
        <div style={styles.emptyContainer}>
          <div style={styles.emptyIcon}>🔍</div>
          <h3 style={styles.emptyTitle}>No matching products found</h3>
          <p style={styles.emptySubtitle}>
            Try modifying your natural language filters or adjusting price limits.
          </p>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '40px 20px',
    color: '#0f172a',
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  badge: {
    display: 'inline-block',
    padding: '6px 14px',
    background: '#e0e7ff',
    color: '#4338ca',
    borderRadius: '9999px',
    fontSize: '0.85rem',
    fontWeight: '600',
    marginBottom: '12px',
    letterSpacing: '0.02em',
  },
  title: {
    fontSize: '2.5rem',
    fontWeight: '800',
    color: '#0f172a',
    margin: '0 0 10px 0',
    letterSpacing: '-0.025em',
  },
  subtitle: {
    fontSize: '1.05rem',
    color: '#64748b',
    margin: '0',
  },
  searchForm: {
    display: 'flex',
    gap: '12px',
    maxWidth: '760px',
    margin: '0 auto 16px auto',
  },
  inputWrapper: {
    position: 'relative',
    flex: '1',
    display: 'flex',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: '16px',
    color: '#94a3b8',
    pointerEvents: 'none',
  },
  input: {
    width: '100%',
    padding: '14px 44px 14px 48px',
    fontSize: '1rem',
    border: '1.5px solid #cbd5e1',
    borderRadius: '12px',
    outline: 'none',
    boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
    fontFamily: 'inherit',
    backgroundColor: '#ffffff',
  },
  clearButton: {
    position: 'absolute',
    right: '14px',
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: '14px',
    padding: '4px',
  },
  submitButton: {
    padding: '14px 28px',
    fontSize: '1rem',
    fontWeight: '600',
    color: '#ffffff',
    backgroundColor: '#4f46e5',
    border: 'none',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
    fontFamily: 'inherit',
  },
  suggestionsContainer: {
    maxWidth: '760px',
    margin: '0 auto 40px auto',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  suggestionLabel: {
    fontSize: '0.85rem',
    color: '#64748b',
    fontWeight: '500',
  },
  chipList: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  chip: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '5px 12px',
    fontSize: '0.82rem',
    color: '#334155',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  loadingContainer: {
    textAlign: 'center',
    padding: '60px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3.5px solid #e2e8f0',
    borderTopColor: '#4f46e5',
    borderRadius: '50%',
    animation: 'spin 0.9s linear infinite',
    marginBottom: '16px',
  },
  loadingText: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#1e293b',
    margin: '0 0 6px 0',
  },
  loadingSubtext: {
    fontSize: '0.9rem',
    color: '#64748b',
  },
  errorContainer: {
    maxWidth: '760px',
    margin: '0 auto 30px auto',
    padding: '14px 18px',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  errorText: {
    color: '#b91c1c',
    fontSize: '0.92rem',
    fontWeight: '500',
  },
  resultsWrapper: {
    marginTop: '20px',
  },
  resultsHeader: {
    marginBottom: '20px',
    paddingBottom: '10px',
    borderBottom: '1px solid #e2e8f0',
  },
  resultsCount: {
    fontSize: '0.95rem',
    color: '#475569',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '20px',
  },
  card: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '16px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
  },
  cardHeader: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    marginBottom: '12px',
  },
  categoryBadge: {
    backgroundColor: '#eef2ff',
    color: '#4338ca',
    fontSize: '0.75rem',
    fontWeight: '600',
    padding: '4px 10px',
    borderRadius: '6px',
    textTransform: 'capitalize',
  },
  subCategoryBadge: {
    backgroundColor: '#f8fafc',
    color: '#64748b',
    border: '1px solid #e2e8f0',
    fontSize: '0.75rem',
    fontWeight: '500',
    padding: '4px 8px',
    borderRadius: '6px',
  },
  productTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#0f172a',
    margin: '0 0 18px 0',
    lineHeight: '1.45',
    display: '-webkit-box',
    WebkitLineClamp: '3',
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    minHeight: '4.35em',
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: '14px',
    borderTop: '1px solid #f1f5f9',
  },
  priceContainer: {
    display: 'flex',
    flexDirection: 'column',
  },
  priceLabel: {
    fontSize: '0.75rem',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    fontWeight: '600',
    marginBottom: '2px',
  },
  priceValue: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#0f172a',
  },
  ratingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  ratingLabel: {
    fontSize: '0.75rem',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    fontWeight: '600',
    marginBottom: '2px',
  },
  ratingBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: '#fef9c3',
    border: '1px solid #fef08a',
    padding: '3px 8px',
    borderRadius: '6px',
  },
  starIcon: {
    color: '#eab308',
    fontSize: '0.85rem',
  },
  ratingValue: {
    fontSize: '0.85rem',
    fontWeight: '700',
    color: '#854d0e',
  },
  emptyContainer: {
    textAlign: 'center',
    padding: '60px 20px',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px dashed #cbd5e1',
    maxWidth: '600px',
    margin: '30px auto',
  },
  emptyIcon: {
    fontSize: '2.5rem',
    marginBottom: '12px',
  },
  emptyTitle: {
    fontSize: '1.15rem',
    fontWeight: '600',
    color: '#334155',
    margin: '0 0 6px 0',
  },
  emptySubtitle: {
    fontSize: '0.9rem',
    color: '#64748b',
    margin: 0,
  },
};

export default ProductSearch;
