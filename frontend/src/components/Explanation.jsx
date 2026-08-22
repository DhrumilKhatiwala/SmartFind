import React from 'react';
import {
  IconSparkles,
  IconTarget,
  IconCheck,
  IconChevronDown,
  IconChevronUp,
} from './Icons';

/**
 * Explanation component displays the backend explainability reasoning.
 * Initially collapsed, expandable on click with styled semantic and filter tags.
 */
const Explanation = ({ explanation, isOpen, onToggle }) => {
  if (!explanation) return null;

  // Split explanation clauses separated by bullet '•' for structured presentation
  const clauses = explanation
    .split('•')
    .map((c) => c.trim())
    .filter(Boolean);

  return (
    <div style={styles.container}>
      <button
        type="button"
        onClick={onToggle}
        style={styles.toggleButton}
        aria-expanded={isOpen}
        aria-label="Toggle explanation of why this product matched"
      >
        <span style={styles.label}>
          <IconSparkles size={13} color="#4f46e5" />
          <span>Why this matched</span>
        </span>
        <span style={styles.chevron}>
          {isOpen ? (
            <IconChevronUp size={12} color="#6366f1" />
          ) : (
            <IconChevronDown size={12} color="#6366f1" />
          )}
        </span>
      </button>

      {isOpen && (
        <div style={styles.contentBox}>
          {clauses.length > 1 ? (
            <div style={styles.clauseList}>
              {clauses.map((clause, idx) => {
                const isSemantic =
                  clause.toLowerCase().includes('matched') ||
                  clause.toLowerCase().includes('semantic') ||
                  clause.toLowerCase().includes('keyword');

                return (
                  <div key={idx} style={styles.clauseItem}>
                    <span style={styles.clauseBullet}>
                      {isSemantic ? (
                        <IconTarget size={12} color="#6366f1" />
                      ) : (
                        <IconCheck size={12} color="#059669" />
                      )}
                    </span>
                    <span style={styles.clauseText}>{clause}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={styles.text}>{explanation}</p>
          )}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    marginTop: '10px',
    paddingTop: '8px',
    borderTop: '1px dashed #e2e8f0',
    width: '100%',
    minWidth: 0,
  },
  toggleButton: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'none',
    border: 'none',
    padding: '4px 0',
    cursor: 'pointer',
    color: '#4f46e5',
    fontSize: '0.8rem',
    fontWeight: '600',
    fontFamily: 'inherit',
    textAlign: 'left',
    transition: 'color 0.15s ease',
  },
  label: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    minWidth: 0,
    fontSize: '0.78rem',
  },
  chevron: {
    marginLeft: '6px',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
  },
  contentBox: {
    marginTop: '8px',
    padding: '10px 12px',
    backgroundColor: '#f8fafc',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    animation: 'fadeIn 0.2s ease-in-out',
    width: '100%',
    minWidth: 0,
    boxSizing: 'border-box',
  },
  clauseList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  clauseItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '7px',
    fontSize: '0.76rem',
    color: '#334155',
    lineHeight: '1.45',
    fontWeight: '500',
  },
  clauseBullet: {
    flexShrink: 0,
    marginTop: '2px',
    display: 'flex',
    alignItems: 'center',
  },
  clauseText: {
    overflowWrap: 'break-word',
    wordBreak: 'break-word',
  },
  text: {
    fontSize: '0.76rem',
    color: '#334155',
    lineHeight: '1.5',
    margin: 0,
    fontWeight: '500',
    overflowWrap: 'break-word',
    wordBreak: 'break-word',
  },
};

export default Explanation;
