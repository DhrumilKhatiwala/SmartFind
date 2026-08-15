import React from 'react';

/**
 * LoadingState displays status spinner and skeleton placeholder cards during search.
 */
const LoadingState = () => {
  return (
    <div style={styles.container} aria-live="polite" aria-busy="true">
      <div style={styles.statusBox}>
        <div style={styles.spinner}></div>
        <div style={styles.statusContent}>
          <h3 style={styles.statusTitle}>Analyzing query...</h3>
          <p style={styles.statusSubtitle}>
            Gemini is parsing constraints and searching 36,000+ vector embeddings
          </p>
        </div>
      </div>

      {/* Skeleton Cards Grid */}
      <div style={styles.skeletonGrid}>
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div key={item} style={styles.skeletonCard}>
            <div style={styles.skeletonImage}></div>
            <div style={styles.skeletonContent}>
              <div style={styles.skeletonBadge}></div>
              <div style={styles.skeletonTitle}></div>
              <div style={styles.skeletonSubTitle}></div>
              <div style={styles.skeletonRating}></div>
              <div style={styles.skeletonPrice}></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = {
  container: {
    width: '100%',
    padding: '16px 0',
  },
  statusBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    backgroundColor: '#ffffff',
    border: '1px solid #e0e7ff',
    borderRadius: '16px',
    padding: '24px 32px',
    maxWidth: '560px',
    margin: '0 auto 36px auto',
    boxShadow: '0 4px 16px rgba(79, 70, 229, 0.08)',
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3.5px solid #e0e7ff',
    borderTopColor: '#4f46e5',
    borderRadius: '50%',
    animation: 'spin 0.9s linear infinite',
    flexShrink: 0,
  },
  statusContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  statusTitle: {
    fontSize: '1.05rem',
    fontWeight: '700',
    color: '#1e1b4b',
    margin: 0,
  },
  statusSubtitle: {
    fontSize: '0.82rem',
    color: '#64748b',
    margin: 0,
  },
  skeletonGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '24px',
    alignItems: 'start',
  },
  skeletonCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '18px',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
  },
  skeletonImage: {
    height: '210px',
    backgroundColor: '#f1f5f9',
    animation: 'pulse 1.5s infinite ease-in-out',
  },
  skeletonContent: {
    padding: '18px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  skeletonBadge: {
    width: '60px',
    height: '16px',
    backgroundColor: '#f1f5f9',
    borderRadius: '4px',
    animation: 'pulse 1.5s infinite ease-in-out',
  },
  skeletonTitle: {
    width: '90%',
    height: '18px',
    backgroundColor: '#f1f5f9',
    borderRadius: '4px',
    animation: 'pulse 1.5s infinite ease-in-out',
  },
  skeletonSubTitle: {
    width: '70%',
    height: '14px',
    backgroundColor: '#f1f5f9',
    borderRadius: '4px',
    animation: 'pulse 1.5s infinite ease-in-out',
  },
  skeletonRating: {
    width: '80px',
    height: '22px',
    backgroundColor: '#f1f5f9',
    borderRadius: '6px',
    animation: 'pulse 1.5s infinite ease-in-out',
  },
  skeletonPrice: {
    width: '100px',
    height: '28px',
    backgroundColor: '#f1f5f9',
    borderRadius: '4px',
    marginTop: '4px',
    animation: 'pulse 1.5s infinite ease-in-out',
  },
};

export default LoadingState;
