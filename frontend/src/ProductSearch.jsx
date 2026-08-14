import React, { useState } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const ProductSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);
  const [imageErrors, setImageErrors] = useState({});

  const sampleQueries = [
    'phones under 20000 with rating above 4',
    'headphones under ₹2000',
    'inverter split AC 1.5 ton under 40000',
    'running shoes with rating above 4.2',
  ];

  const handleSearch = async (searchQuery) => {
    const activeQuery = searchQuery !== undefined ? searchQuery : query;
    if (!activeQuery.trim()) return;

    setLoading(true);
    setError(null);
    setSearched(true);
    setImageErrors({});

    try {
      const response = await axios.post(`${API_BASE_URL}/search`, {
        query: activeQuery.trim(),
        top_k: 12,
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

  const handleImageError = (index) => {
    setImageErrors((prev) => ({ ...prev, [index]: true }));
  };

  return (
    <div style={styles.container}>
      {/* Header Section */}
      <header style={styles.header}>
        <div style={styles.badge}>
          <span style={styles.badgePulse}></span>
          AI-Powered Self-Query Search
        </div>
        <h1 style={styles.title}>QueryForge Product Search</h1>
        <p style={styles.subtitle}>
          Search across 36,000+ Amazon products naturally with automated semantic query & structured metadata filtering
        </p>
      </header>

      {/* Search Input Form */}
      <form onSubmit={handleSubmit} style={styles.searchForm}>
        <div style={styles.inputWrapper}>
          <svg
            style={styles.searchIcon}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            width="22"
            height="22"
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
          {loading ? (
            <span style={styles.buttonLoading}>
              <span style={styles.btnSpinner}></span>
              Searching...
            </span>
          ) : (
            'Search'
          )}
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
          <p style={styles.loadingText}>Analyzing Natural Language Query...</p>
          <span style={styles.loadingSubtext}>
            Gemini LLM is extracting semantic terms and building structured Pinecone filters...
          </span>
        </div>
      )}

      {/* Error Message */}
      {error && !loading && (
        <div style={styles.errorContainer}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
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
            <span style={styles.resultsBadge}>Pinecone Vector + Metadata Filter</span>
          </div>

          <div style={styles.grid}>
            {results.map((item, index) => {
              const { title, subCategory } = parseProductContent(item.page_content);
              const { price, rating, category, image, link, no_of_ratings, actual_price } =
                item.metadata || {};

              const hasValidImage = image && !imageErrors[index];

              return (
                <div key={index} style={styles.card}>
                  {/* Product Image Section */}
                  <div style={styles.imageContainer}>
                    {hasValidImage ? (
                      <img
                        src={image}
                        alt={title}
                        onError={() => handleImageError(index)}
                        style={styles.productImage}
                        loading="lazy"
                      />
                    ) : (
                      <div style={styles.imagePlaceholder}>
                        <svg
                          width="36"
                          height="36"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#94a3b8"
                          strokeWidth="1.5"
                        >
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <polyline points="21 15 16 10 5 21" />
                        </svg>
                        <span style={styles.placeholderText}>Image Preview</span>
                      </div>
                    )}

                    {/* Top Category Badge */}
                    <div style={styles.floatingBadges}>
                      <span style={styles.categoryBadge}>{category || 'Product'}</span>
                    </div>
                  </div>

                  {/* Product Content Details */}
                  <div style={styles.cardContent}>
                    {subCategory && (
                      <span style={styles.subCategoryBadge}>{subCategory}</span>
                    )}

                    <h3 style={styles.productTitle} title={title}>
                      {title}
                    </h3>

                    {/* Rating & Review Count */}
                    <div style={styles.ratingRow}>
                      <div style={styles.ratingBadge}>
                        <span style={styles.starIcon}>★</span>
                        <span style={styles.ratingValue}>
                          {rating !== null && rating !== undefined ? Number(rating).toFixed(1) : 'N/A'}
                        </span>
                      </div>
                      {no_of_ratings &&
                        !isNaN(Number(String(no_of_ratings).replace(/,/g, ''))) &&
                        Number(String(no_of_ratings).replace(/,/g, '')) > 0 && (
                          <span style={styles.reviewsCount}>
                            ({Number(String(no_of_ratings).replace(/,/g, '')).toLocaleString('en-IN')} ratings)
                          </span>
                        )}
                    </div>

                    {/* Price & Savings */}
                    <div style={styles.priceRow}>
                      <div style={styles.priceContainer}>
                        <span style={styles.priceValue}>{formatPrice(price)}</span>
                        {actual_price && (
                          <span style={styles.actualPrice}>{actual_price}</span>
                        )}
                      </div>
                    </div>

                    {/* Action Button: View on Amazon */}
                    {link ? (
                      <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={styles.amazonButton}
                      >
                        <span>View on Amazon</span>
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                        >
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          <polyline points="15 3 21 3 21 9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                      </a>
                    ) : (
                      <button disabled style={styles.disabledButton}>
                        Details Available in Catalog
                      </button>
                    )}
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
    maxWidth: '1280px',
    margin: '0 auto',
    padding: '40px 24px 80px 24px',
    color: '#0f172a',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  header: {
    textAlign: 'center',
    marginBottom: '36px',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 16px',
    background: '#e0e7ff',
    color: '#4338ca',
    borderRadius: '9999px',
    fontSize: '0.85rem',
    fontWeight: '600',
    marginBottom: '14px',
    letterSpacing: '0.02em',
  },
  badgePulse: {
    width: '8px',
    height: '8px',
    backgroundColor: '#4f46e5',
    borderRadius: '50%',
    display: 'inline-block',
  },
  title: {
    fontSize: '2.6rem',
    fontWeight: '800',
    color: '#0f172a',
    margin: '0 0 12px 0',
    letterSpacing: '-0.03em',
  },
  subtitle: {
    fontSize: '1.05rem',
    color: '#64748b',
    maxWidth: '680px',
    margin: '0 auto',
    lineHeight: '1.5',
  },
  searchForm: {
    display: 'flex',
    gap: '12px',
    maxWidth: '800px',
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
    left: '18px',
    color: '#94a3b8',
    pointerEvents: 'none',
  },
  input: {
    width: '100%',
    padding: '16px 44px 16px 52px',
    fontSize: '1.02rem',
    border: '1.5px solid #cbd5e1',
    borderRadius: '14px',
    outline: 'none',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    fontFamily: 'inherit',
    backgroundColor: '#ffffff',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
  },
  clearButton: {
    position: 'absolute',
    right: '16px',
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: '15px',
    padding: '4px',
  },
  submitButton: {
    padding: '16px 32px',
    fontSize: '1.02rem',
    fontWeight: '600',
    color: '#ffffff',
    backgroundColor: '#4f46e5',
    border: 'none',
    borderRadius: '14px',
    boxShadow: '0 4px 14px rgba(79, 70, 229, 0.3)',
    fontFamily: 'inherit',
    transition: 'transform 0.15s ease, background-color 0.2s ease',
  },
  buttonLoading: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  btnSpinner: {
    width: '16px',
    height: '16px',
    border: '2px solid #ffffff',
    borderTopColor: 'transparent',
    borderRadius: '50%',
    display: 'inline-block',
    animation: 'spin 0.8s linear infinite',
  },
  suggestionsContainer: {
    maxWidth: '800px',
    margin: '0 auto 40px auto',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
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
    borderRadius: '9999px',
    padding: '6px 14px',
    fontSize: '0.82rem',
    color: '#334155',
    cursor: 'pointer',
    fontFamily: 'inherit',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
    transition: 'all 0.15s ease',
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
    width: '44px',
    height: '44px',
    border: '4px solid #e2e8f0',
    borderTopColor: '#4f46e5',
    borderRadius: '50%',
    animation: 'spin 0.9s linear infinite',
    marginBottom: '18px',
  },
  loadingText: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#1e293b',
    margin: '0 0 8px 0',
  },
  loadingSubtext: {
    fontSize: '0.92rem',
    color: '#64748b',
    maxWidth: '500px',
  },
  errorContainer: {
    maxWidth: '800px',
    margin: '0 auto 30px auto',
    padding: '16px 20px',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  errorText: {
    color: '#b91c1c',
    fontSize: '0.95rem',
    fontWeight: '500',
  },
  resultsWrapper: {
    marginTop: '24px',
  },
  resultsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    paddingBottom: '12px',
    borderBottom: '1.5px solid #e2e8f0',
  },
  resultsCount: {
    fontSize: '1rem',
    color: '#475569',
  },
  resultsBadge: {
    fontSize: '0.78rem',
    fontWeight: '600',
    backgroundColor: '#f1f5f9',
    color: '#475569',
    padding: '4px 10px',
    borderRadius: '6px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '24px',
  },
  card: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '18px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 3px 12px rgba(0, 0, 0, 0.05)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: '210px',
    backgroundColor: '#f8fafc',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
    borderBottom: '1px solid #f1f5f9',
  },
  productImage: {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain',
    transition: 'transform 0.2s ease',
  },
  imagePlaceholder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
  },
  placeholderText: {
    fontSize: '0.75rem',
    color: '#94a3b8',
    fontWeight: '500',
  },
  floatingBadges: {
    position: 'absolute',
    top: '12px',
    left: '12px',
  },
  categoryBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    color: '#4338ca',
    fontSize: '0.72rem',
    fontWeight: '700',
    padding: '4px 10px',
    borderRadius: '6px',
    textTransform: 'capitalize',
    boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
    backdropFilter: 'blur(4px)',
  },
  cardContent: {
    padding: '18px',
    display: 'flex',
    flexDirection: 'column',
    flex: '1',
    justifyContent: 'space-between',
  },
  subCategoryBadge: {
    display: 'inline-block',
    backgroundColor: '#f1f5f9',
    color: '#64748b',
    fontSize: '0.72rem',
    fontWeight: '600',
    padding: '3px 8px',
    borderRadius: '4px',
    marginBottom: '8px',
    width: 'fit-content',
  },
  productTitle: {
    fontSize: '0.96rem',
    fontWeight: '600',
    color: '#0f172a',
    margin: '0 0 14px 0',
    lineHeight: '1.45',
    display: '-webkit-box',
    WebkitLineClamp: '2',
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    minHeight: '2.9em',
  },
  ratingRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '14px',
  },
  ratingBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: '#fef9c3',
    border: '1px solid #fef08a',
    padding: '2px 8px',
    borderRadius: '6px',
  },
  starIcon: {
    color: '#eab308',
    fontSize: '0.82rem',
  },
  ratingValue: {
    fontSize: '0.82rem',
    fontWeight: '700',
    color: '#854d0e',
  },
  reviewsCount: {
    fontSize: '0.78rem',
    color: '#64748b',
  },
  priceRow: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: '16px',
    paddingTop: '8px',
    borderTop: '1px solid #f8fafc',
  },
  priceContainer: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '8px',
  },
  priceValue: {
    fontSize: '1.35rem',
    fontWeight: '800',
    color: '#0f172a',
  },
  actualPrice: {
    fontSize: '0.85rem',
    color: '#94a3b8',
    textDecoration: 'line-through',
    fontWeight: '500',
  },
  amazonButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    width: '100%',
    padding: '10px 14px',
    backgroundColor: '#ff9900',
    color: '#111827',
    fontSize: '0.88rem',
    fontWeight: '700',
    borderRadius: '10px',
    textDecoration: 'none',
    boxShadow: '0 2px 8px rgba(255, 153, 0, 0.25)',
    transition: 'background-color 0.15s ease',
  },
  disabledButton: {
    width: '100%',
    padding: '10px 14px',
    backgroundColor: '#f1f5f9',
    color: '#94a3b8',
    fontSize: '0.82rem',
    fontWeight: '600',
    borderRadius: '10px',
    border: 'none',
  },
  emptyContainer: {
    textAlign: 'center',
    padding: '60px 20px',
    backgroundColor: '#ffffff',
    borderRadius: '18px',
    border: '1px dashed #cbd5e1',
    maxWidth: '600px',
    margin: '30px auto',
  },
  emptyIcon: {
    fontSize: '2.8rem',
    marginBottom: '14px',
  },
  emptyTitle: {
    fontSize: '1.2rem',
    fontWeight: '700',
    color: '#334155',
    margin: '0 0 8px 0',
  },
  emptySubtitle: {
    fontSize: '0.92rem',
    color: '#64748b',
    margin: 0,
  },
};

export default ProductSearch;
