import React, { createContext, useContext, useState } from 'react';

const SearchContext = createContext(null);

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) throw new Error('useSearch must be used within SearchProvider');
  return context;
};

export const SearchProvider = ({ children }) => {
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

  const value = {
    query,
    setQuery,
    submittedQuery,
    setSubmittedQuery,
    results,
    setResults,
    semanticIntent,
    setSemanticIntent,
    detectedConstraints,
    setDetectedConstraints,
    currentPage,
    setCurrentPage,
    loading,
    setLoading,
    error,
    setError,
    searched,
    setSearched,
    latencyMs,
    setLatencyMs,
    expandedExplanations,
    setExpandedExplanations,
  };

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
};
