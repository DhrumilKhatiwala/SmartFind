import React from 'react';

/**
 * Pagination component for navigating 48 items per page with page numbers and next/prev controls.
 */
const Pagination = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage = 48,
  onPageChange,
}) => {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers array with ellipses for large page counts
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 7;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      if (currentPage <= 3) {
        start = 2;
        end = 4;
      } else if (currentPage >= totalPages - 2) {
        start = totalPages - 3;
        end = totalPages - 1;
      }

      if (start > 2) {
        pages.push('...');
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages - 1) {
        pages.push('...');
      }

      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <nav style={styles.container} aria-label="Search results pagination">
      <div style={styles.summaryText}>
        Showing <strong>{startItem}–{endItem}</strong> of <strong>{totalItems}</strong> products (Page {currentPage} of {totalPages})
      </div>

      <div style={styles.controls}>
        {/* Previous Button */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          style={{
            ...styles.navButton,
            opacity: currentPage === 1 ? 0.4 : 1,
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
          }}
          aria-label="Go to previous page"
        >
          ← Previous
        </button>

        {/* Page Numbers */}
        <div style={styles.pagesList}>
          {pageNumbers.map((p, idx) => {
            if (p === '...') {
              return (
                <span key={`dots-${idx}`} style={styles.dots}>
                  ...
                </span>
              );
            }

            const isActive = p === currentPage;
            return (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                style={{
                  ...styles.pageButton,
                  ...(isActive ? styles.activePageButton : {}),
                }}
                aria-current={isActive ? 'page' : undefined}
                aria-label={`Page ${p}`}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Next Button */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          style={{
            ...styles.navButton,
            opacity: currentPage === totalPages ? 0.4 : 1,
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
          }}
          aria-label="Go to next page"
        >
          Next →
        </button>
      </div>
    </nav>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
    marginTop: '40px',
    paddingTop: '24px',
    borderTop: '1px solid #e2e8f0',
  },
  summaryText: {
    fontSize: '0.88rem',
    color: '#64748b',
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  navButton: {
    padding: '8px 16px',
    backgroundColor: '#ffffff',
    border: '1.5px solid #cbd5e1',
    borderRadius: '10px',
    color: '#0f172a',
    fontSize: '0.84rem',
    fontWeight: '600',
    transition: 'all 0.15s ease',
    fontFamily: 'inherit',
  },
  pagesList: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  pageButton: {
    width: '38px',
    height: '38px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    border: '1.5px solid #e2e8f0',
    borderRadius: '10px',
    color: '#334155',
    fontSize: '0.86rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    fontFamily: 'inherit',
  },
  activePageButton: {
    backgroundColor: '#4f46e5',
    borderColor: '#4f46e5',
    color: '#ffffff',
    fontWeight: '700',
    boxShadow: '0 2px 8px rgba(79, 70, 229, 0.25)',
  },
  dots: {
    padding: '0 4px',
    color: '#94a3b8',
    fontSize: '0.88rem',
    fontWeight: '700',
  },
};

export default Pagination;
