import React, { useState, useRef } from 'react';
import axios from 'axios';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import QueryUnderstandingPanel from './components/QueryUnderstandingPanel';
import ResultsHeader from './components/ResultsHeader';
import ProductCard from './components/ProductCard';
import Pagination from './components/Pagination';
import LoadingState from './components/LoadingState';
import EmptyState from './components/EmptyState';
import ErrorState from './components/ErrorState';
import Footer from './components/Footer';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '');
const ITEMS_PER_PAGE = 48;

/**
 * Fallback parser for extracting semantic intent and constraints if the backend
 * does not return structured intent/constraints in the payload.
 */
const parseSearchInsightsFallback = (queryStr, results) => {
  let semanticIntent = '';
  const constraints = [];

  if (results && results.length > 0) {
    const firstExp = results.find((r) => r.explanation)?.explanation || '';

    // 1. Extract Semantic Intent: e.g. Matched keywords: "wireless earbuds"
    const intentMatch =
      firstExp.match(/matched\s+(?:keywords:?\s*)?["']?([^"•]+?)["']?\s*(?:via|•|$)/i) ||
      firstExp.match(/matched\s+["']([^"']+)["']/i);
    if (intentMatch) {
      semanticIntent = intentMatch[1].trim();
    }

    // 2. Extract Price Constraint: e.g. Price ₹2,499 satisfies filter (> ₹2,000) or (< ₹1,500)
    const priceUnderMatch = firstExp.match(/price.*?satisfies\s*filter\s*\(\s*(?:<|<=|≤)\s*₹?([\d,]+)\s*\)/i);
    if (priceUnderMatch) {
      constraints.push(`Under ₹${Number(priceUnderMatch[1].replace(/,/g, '')).toLocaleString('en-IN')}`);
    }
    const priceAboveMatch = firstExp.match(/price.*?satisfies\s*filter\s*\(\s*(?:>|>=|≥)\s*₹?([\d,]+)\s*\)/i);
    if (priceAboveMatch) {
      constraints.push(`Above ₹${Number(priceAboveMatch[1].replace(/,/g, '')).toLocaleString('en-IN')}`);
    }

    // 3. Extract Rating Constraint: e.g. Rating 4.6★ satisfies filter (> 4.0★)
    const ratingMatch =
      firstExp.match(/rating.*?satisfies\s*filter\s*\(\s*(?:>|>=|≥)\s*([\d.]+)\s*★?\s*\)/i) ||
      firstExp.match(/filter\s*\(\s*(?:>|>=|≥)\s*([\d.]+)\s*★?\s*\)/i);
    if (ratingMatch) {
      constraints.push(`Rating > ${ratingMatch[1]}★`);
    }

    // 4. Extract Category Constraint: e.g. category = 'tv, audio & cameras'
    const catMatch = firstExp.match(/category\s*[:=]\s*['"]?([^'"]+)['"]?/i);
    if (catMatch) {
      constraints.push(`Category: ${catMatch[1]}`);
    }
  }

  // Fallback to query string analysis
  if (constraints.length === 0 && queryStr) {
    const qLower = queryStr.toLowerCase();

    // Price Under
    const priceUnder = qLower.match(/(?:under|below|less than|max)\s*₹?\s*(\d+k|\d+)/i);
    if (priceUnder) {
      let val = priceUnder[1];
      if (val.endsWith('k')) val = parseInt(val, 10) * 1000;
      constraints.push(`Under ₹${Number(val).toLocaleString('en-IN')}`);
    }

    // Price Above
    const priceAbove = qLower.match(/(?:above|over|more than|greater than|min|at least)\s*(?:price\s*)?₹?\s*(\d+k|\d+)/i);
    if (priceAbove) {
      let val = priceAbove[1];
      if (val.endsWith('k')) val = parseInt(val, 10) * 1000;
      constraints.push(`Above ₹${Number(val).toLocaleString('en-IN')}`);
    }

    // Rating
    const ratingMatch = qLower.match(/(?:rating\s*(?:above|>|>=|greater than|more than))\s*(\d+(?:\.\d+)?)/i);
    if (ratingMatch) {
      constraints.push(`Rating > ${ratingMatch[1]}★`);
    }
  }

  if (!semanticIntent && queryStr) {
    semanticIntent = queryStr
      .replace(/(?:under|below|less than|above|over|more than|greater than)\s*(?:price\s*)?₹?\s*[\d,k]+/gi, '')
      .replace(/(?:rating\s*(?:above|>|>=|greater than|more than))\s*[\d.]+(?:\s*stars?)?/gi, '')
      .replace(/(?:in|category)\s+[a-z\s,&]+/gi, '')
      .replace(/\s+with\s*$/i, '')
      .replace(/\s+and\s*$/i, '')
      .trim();
  }

  return { semanticIntent, constraints };
};

const ProductSearch = () => {
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [results, setResults] = useState([]);
  const [semanticIntent, setSemanticIntent] = useState('');
  const [detectedConstraints, setDetectedConstraints] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);
  const [latencyMs, setLatencyMs] = useState(null);
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

    const startTime = performance.now();

    try {
      const response = await axios.post(`${API_BASE_URL}/search`, {
        query: activeQuery.trim(),
        top_k: 500,
      });

      const elapsed = Math.round(performance.now() - startTime);
      setLatencyMs(elapsed);

      const resList = response.data.results || [];
      setResults(resList);

      // Prefer structured backend extraction from AST if available
      const backendIntent = response.data.semantic_intent;
      const backendConstraints = response.data.detected_constraints;

      if (backendIntent || (backendConstraints && backendConstraints.length > 0)) {
        setSemanticIntent(backendIntent || activeQuery.trim());
        setDetectedConstraints(backendConstraints || []);
      } else {
        const fallback = parseSearchInsightsFallback(activeQuery.trim(), resList);
        setSemanticIntent(fallback.semanticIntent || activeQuery.trim());
        setDetectedConstraints(fallback.constraints || []);
      }
    } catch (err) {
      console.error('Search API Error:', err);
      setError(
        err.response?.data?.detail ||
          'Something went wrong while searching. Please try again.'
      );
      setResults([]);
      setLatencyMs(null);
      setSemanticIntent('');
      setDetectedConstraints([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setSubmittedQuery('');
    setResults([]);
    setSemanticIntent('');
    setDetectedConstraints([]);
    setCurrentPage(1);
    setSearched(false);
    setError(null);
    setLatencyMs(null);
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

  const hasActiveConstraints = detectedConstraints && detectedConstraints.length > 0;

  // Pagination calculation: 48 items per page
  const totalPages = Math.ceil(results.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedResults = results.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <main className="app-container" style={styles.container}>
      {/* Main Content Area (pushes footer to bottom on short pages) */}
      <div style={styles.mainContent}>
        {/* Header */}
        <Header />

        {/* Prominent Search Bar & Categorized Example Chips */}
        <SearchBar
          query={query}
          setQuery={setQuery}
          onSearch={handleSearch}
          onClear={handleClear}
          loading={loading}
          hasResultsOrSearched={searched || results.length > 0}
        />

        {/* Loading State with Skeletons */}
        {loading && <LoadingState />}

        {/* Error State with Retry */}
        {error && !loading && (
          <ErrorState message={error} onRetry={() => handleSearch()} />
        )}

        {/* Search Results & Recruiter Showcase Panel */}
        {!loading && searched && results.length > 0 && (
          <section
            ref={resultsRef}
            style={styles.resultsSection}
            aria-label="Search Results"
          >
            {/* Query Understanding Panel with Pipeline Walkthrough */}
            <QueryUnderstandingPanel
              query={submittedQuery}
              semanticIntent={semanticIntent}
              constraints={detectedConstraints}
              count={results.length}
              latencyMs={latencyMs}
            />

            {/* Results Summary Header */}
            <ResultsHeader
              count={results.length}
              query={submittedQuery}
              latencyMs={latencyMs}
            />

            {/* Responsive 4-Column Product Cards Grid */}
            <div className="product-grid">
              {paginatedResults.map((product, index) => {
                const globalIndex = startIndex + index;
                return (
                  <ProductCard
                    key={globalIndex}
                    product={product}
                    index={globalIndex}
                    hasActiveConstraints={hasActiveConstraints}
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
              pageSize={ITEMS_PER_PAGE}
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
      </div>

      {/* Minimal Bottom Footer */}
      <Footer />
    </main>
  );
};

const styles = {
  container: {
    maxWidth: '1440px',
    margin: '0 auto',
    padding: '36px 20px 0 20px',
    color: '#0f172a',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    minWidth: 0,
    width: '100%',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
  },
  mainContent: {
    flex: '1 0 auto',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  resultsSection: {
    marginTop: '16px',
    scrollMarginTop: '20px',
    width: '100%',
    minWidth: 0,
    flex: 1,
  },
};

export default ProductSearch;
