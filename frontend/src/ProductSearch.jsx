import React, { useState, useRef } from 'react';
import axios from 'axios';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import ResultsHeader from './components/ResultsHeader';
import FilterChips from './components/FilterChips';
import ProductCard from './components/ProductCard';
import Pagination from './components/Pagination';
import LoadingState from './components/LoadingState';
import EmptyState from './components/EmptyState';
import ErrorState from './components/ErrorState';

const API_BASE_URL = 'http://127.0.0.1:8000';
const ITEMS_PER_PAGE = 48;

const sampleQueries = [
  'headphones under ₹1500 with rating above 4',
  'phones under 20000 with rating above 4',
  'inverter split AC 1.5 ton under 40000',
  'running shoes with rating above 4.2',
];

/**
 * Extracts active metadata filter chips from the backend explanation or query.
 */
const extractActiveConstraints = (queryStr, results) => {
  const chips = [];
  if (!queryStr) return chips;

  if (results && results.length > 0) {
    const firstExp = results.find((r) => r.explanation)?.explanation || '';

    // 1. Extract price constraint: e.g. "Price ₹1,499 satisfies filter (< ₹20,000)"
    const priceMatch =
      firstExp.match(/price.*?satisfies\s*filter\s*\(\s*(?:<|<=|≤)\s*₹?([\d,]+)\s*\)/i) ||
      firstExp.match(/filter\s*\(\s*(?:<|<=|≤)\s*₹?([\d,]+)\s*\)/i);
    if (priceMatch) {
      chips.push(`Under ₹${priceMatch[1].replace(/,/g, '')}`);
    }

    // 2. Extract rating constraint: e.g. "Rating 4.2★ satisfies filter (> 4.0★)"
    const ratingMatch =
      firstExp.match(/rating.*?satisfies\s*filter\s*\(\s*(?:>|>=|≥)\s*([\d.]+)\s*★?\s*\)/i) ||
      firstExp.match(/filter\s*\(\s*(?:>|>=|≥)\s*([\d.]+)\s*★?\s*\)/i);
    if (ratingMatch) {
      chips.push(`Rating > ${ratingMatch[1]}★`);
    }

    // 3. Extract category constraint: e.g. "category = 'All Electronics'"
    const catMatch = firstExp.match(/category\s*[:=]\s*['"]?([^'"]+)['"]?/i);
    if (catMatch) {
      chips.push(`Category: ${catMatch[1]}`);
    }
  }

  // Fallback to query string parsing if explanation didn't have filter clause
  if (chips.length === 0) {
    const qLower = queryStr.toLowerCase();
    const priceMatch = qLower.match(/(?:under|below|less than)\s*₹?\s*(\d+k|\d+)/i);
    if (priceMatch) {
      let val = priceMatch[1];
      if (val.endsWith('k')) val = parseInt(val, 10) * 1000;
      chips.push(`Under ₹${Number(val).toLocaleString('en-IN')}`);
    }

    const ratingMatch = qLower.match(/(?:rating\s*(?:above|>|>=|greater than))\s*(\d+(?:\.\d+)?)/i);
    if (ratingMatch) {
      chips.push(`Rating > ${ratingMatch[1]}★`);
    }
  }

  return chips;
};

const ProductSearch = () => {
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [results, setResults] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);
  const [expandedExplanations, setExpandedExplanations] = useState({});

  const resultsRef = useRef(null);

  const handleSearch = async (overrideQuery) => {
    const activeQuery = overrideQuery !== undefined ? overrideQuery : query;
    if (!activeQuery.trim()) return;

    setLoading(true);
    setError(null);
    setSearched(true);
    setSubmittedQuery(activeQuery.trim());
    setCurrentPage(1);
    setExpandedExplanations({});

    try {
      const response = await axios.post(`${API_BASE_URL}/search`, {
        query: activeQuery.trim(),
        top_k: 500,
      });

      setResults(response.data.results || []);
    } catch (err) {
      console.error('Search API Error:', err);
      setError(
        err.response?.data?.detail ||
          'Something went wrong while searching. Please try again.'
      );
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setSubmittedQuery('');
    setResults([]);
    setCurrentPage(1);
    setSearched(false);
    setError(null);
    setExpandedExplanations({});
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    setTimeout(() => {
      if (resultsRef.current) {
        const topPos = resultsRef.current.getBoundingClientRect().top + window.scrollY - 20;
        window.scrollTo({ top: Math.max(0, topPos), behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 50);
  };


  const toggleExplanation = (index) => {
    setExpandedExplanations((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const activeConstraints = extractActiveConstraints(submittedQuery, results);

  // Pagination calculation: 48 items per page
  const totalPages = Math.ceil(results.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedResults = results.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <main style={styles.container}>
      {/* Header */}
      <Header />

      {/* Prominent Search Bar & Suggestions */}
      <SearchBar
        query={query}
        setQuery={setQuery}
        onSearch={handleSearch}
        onClear={handleClear}
        loading={loading}
        hasResultsOrSearched={searched || results.length > 0}
        sampleQueries={sampleQueries}
      />

      {/* Loading State with Skeletons */}
      {loading && <LoadingState />}

      {/* Error State with Retry */}
      {error && !loading && (
        <ErrorState message={error} onRetry={() => handleSearch()} />
      )}

      {/* Search Results */}
      {!loading && searched && results.length > 0 && (
        <section
          ref={resultsRef}
          style={styles.resultsSection}
          aria-label="Search Results"
        >
          {/* Active Filter / Constraint Chips */}
          <FilterChips constraints={activeConstraints} />

          {/* Results Summary Header */}
          <ResultsHeader count={results.length} query={submittedQuery} />

          {/* Responsive 4-Column Product Cards Grid (4 in a row on desktop) */}
          <div className="product-grid">
            {paginatedResults.map((product, index) => {
              const globalIndex = startIndex + index;
              return (
                <ProductCard
                  key={globalIndex}
                  product={product}
                  index={globalIndex}
                  isExplanationOpen={!!expandedExplanations[globalIndex]}
                  onToggleExplanation={() => toggleExplanation(globalIndex)}
                />
              );
            })}
          </div>

          {/* Pagination Controls (48 items per page) */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={results.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={handlePageChange}
          />
        </section>
      )}

      {/* Empty State */}
      {!loading && searched && results.length === 0 && !error && (
        <EmptyState
          query={submittedQuery}
          onSuggestionClick={(suggestedQuery) => {
            setQuery(suggestedQuery);
            handleSearch(suggestedQuery);
          }}
        />
      )}
    </main>
  );
};

const styles = {
  container: {
    maxWidth: '1440px',
    margin: '0 auto',
    padding: '40px 24px 80px 24px',
    color: '#0f172a',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  resultsSection: {
    marginTop: '16px',
    scrollMarginTop: '20px',
  },
};

export default ProductSearch;

