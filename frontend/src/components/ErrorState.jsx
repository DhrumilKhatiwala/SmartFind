import React from 'react';

/**
 * ErrorState renders a clean error banner with retry option.
 */
const ErrorState = ({ message, onRetry }) => {
  const isQuotaError = message && message.includes('Quota Exceeded');

  return (
    <div style={styles.container} role="alert">
      <div style={styles.content}>
        <div style={styles.iconCircle}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ef4444"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        <div style={styles.textContainer}>
          <h4 style={styles.title}>
            {isQuotaError ? 'API Quota Exceeded' : 'Search Unavailable'}
          </h4>
          <p style={styles.message}>
            {message || 'Something went wrong while searching. Please try again.'}
          </p>
        </div>

        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            style={styles.retryBtn}
            aria-label="Retry search"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    backgroundColor: '#fef2f2',
    border: '1.5px solid #fecaca',
    borderRadius: '14px',
    padding: '16px 20px',
    margin: '20px auto',
    maxWidth: '760px',
    boxShadow: '0 2px 8px rgba(239, 68, 68, 0.06)',
  },
  content: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    flexWrap: 'wrap',
  },
  iconCircle: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textContainer: {
    flex: 1,
    minWidth: '240px',
  },
  title: {
    fontSize: '0.95rem',
    fontWeight: '700',
    color: '#991b1b',
    margin: '0 0 2px 0',
  },
  message: {
    fontSize: '0.84rem',
    color: '#b91c1c',
    margin: 0,
    lineHeight: '1.4',
  },
  retryBtn: {
    padding: '8px 16px',
    backgroundColor: '#ffffff',
    border: '1px solid #fca5a5',
    borderRadius: '8px',
    color: '#b91c1c',
    fontSize: '0.82rem',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    fontFamily: 'inherit',
  },
};

export default ErrorState;
