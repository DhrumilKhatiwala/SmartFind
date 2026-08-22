import React, { useState } from 'react';
import {
  IconCpu,
  IconWorkflow,
  IconTarget,
  IconSliders,
  IconFolder,
  IconChevronDown,
  IconChevronUp,
} from './Icons';

/**
 * QueryUnderstandingPanel displays the extracted semantic intent,
 * active metadata constraints, pipeline indicators, and an expandable
 * step-by-step search workflow for recruiter demonstrations.
 */
const QueryUnderstandingPanel = ({
  query,
  semanticIntent,
  constraints = [],
  count = 0,
  latencyMs = 0,
}) => {
  const [showPipeline, setShowPipeline] = useState(false);

  const hasConstraints = constraints && constraints.length > 0;

  return (
    <section style={styles.card} aria-label="Query Understanding and Retrieval Pipeline">
      {/* Header Bar */}
      <div style={styles.topRow}>
        <div style={styles.headerLeft}>
          <div style={styles.iconWrapper}>
            <IconCpu size={16} color="#4f46e5" />
          </div>
          <span style={styles.title}>Query Understanding</span>
          <div style={styles.statusBadges}>
            <span style={styles.indicatorBadge}>
              <span style={styles.blueDot}></span>
              Semantic Search
            </span>
            {hasConstraints && (
              <span style={styles.filterBadge}>
                <span style={styles.purpleDot}></span>
                Metadata Filtering
              </span>
            )}
          </div>
        </div>

        {/* Expandable Pipeline Toggle Button */}
        <button
          type="button"
          onClick={() => setShowPipeline(!showPipeline)}
          style={styles.pipelineToggle}
          aria-expanded={showPipeline}
          aria-label="Toggle pipeline search explanation"
        >
          <IconWorkflow size={14} color="#4f46e5" />
          <span>How SmartFind searched</span>
          {showPipeline ? (
            <IconChevronUp size={13} color="#4f46e5" />
          ) : (
            <IconChevronDown size={13} color="#4f46e5" />
          )}
        </button>
      </div>

      {/* Extracted Query Breakdown */}
      <div style={styles.breakdownRow}>
        {/* Semantic Intent */}
        <div style={styles.intentGroup}>
          <span style={styles.groupLabel}>Semantic Intent</span>
          <div style={styles.intentChip}>
            <IconTarget size={14} color="#6366f1" />
            <span style={styles.intentText}>
              {semanticIntent ? `"${semanticIntent}"` : `"${query}"`}
            </span>
          </div>
        </div>

        {/* Detected Constraints */}
        <div style={styles.constraintsGroup}>
          <span style={styles.groupLabel}>
            {hasConstraints ? 'Detected Constraints' : 'Constraints'}
          </span>
          <div style={styles.chipsContainer}>
            {hasConstraints ? (
              constraints.map((c, idx) => {
                const label = typeof c === 'string' ? c : c.label;
                const isCat = label.toLowerCase().includes('category');

                return (
                  <span
                    key={idx}
                    style={{
                      ...styles.constraintChip,
                      ...(isCat ? styles.categoryChip : {}),
                    }}
                  >
                    {isCat ? (
                      <IconFolder size={13} color="#86198f" />
                    ) : (
                      <IconSliders size={13} color="#3730a3" />
                    )}
                    <span>{label}</span>
                  </span>
                );
              })
            ) : (
              <span style={styles.noConstraintText}>
                No numeric limits specified (broad semantic search)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Expandable Step-by-Step Search Pipeline */}
      {showPipeline && (
        <div style={styles.pipelineContainer}>
          <div style={styles.pipelineHeader}>
            <span style={styles.pipelineTitle}>End-to-End Retrieval Pipeline:</span>
          </div>

          <div style={styles.pipelineSteps}>
            {/* Step 1 */}
            <div style={styles.stepItem}>
              <div style={styles.stepNumber}>1</div>
              <div style={styles.stepContent}>
                <span style={styles.stepTitle}>User Query</span>
                <span style={styles.stepDesc}>"{query}"</span>
              </div>
            </div>

            <div style={styles.stepArrow}>→</div>

            {/* Step 2 */}
            <div style={styles.stepItem}>
              <div style={styles.stepNumber}>2</div>
              <div style={styles.stepContent}>
                <span style={styles.stepTitle}>Query Understanding</span>
                <span style={styles.stepDesc}>
                  Groq AST extraction: intent + constraints
                </span>
              </div>
            </div>

            <div style={styles.stepArrow}>→</div>

            {/* Step 3 */}
            <div style={styles.stepItem}>
              <div style={styles.stepNumber}>3</div>
              <div style={styles.stepContent}>
                <span style={styles.stepTitle}>Filtered Vector Search</span>
                <span style={styles.stepDesc}>
                  Pinecone single-pass vector + boolean query
                </span>
              </div>
            </div>

            <div style={styles.stepArrow}>→</div>

            {/* Step 4 */}
            <div style={styles.stepItem}>
              <div style={styles.stepNumber}>4</div>
              <div style={styles.stepContent}>
                <span style={styles.stepTitle}>Results & Reasoning</span>
                <span style={styles.stepDesc}>
                  FastAPI matches metadata & generates explanations
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

const styles = {
  card: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '16px',
    padding: '16px 20px',
    marginBottom: '20px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
    width: '100%',
    minWidth: 0,
    boxSizing: 'border-box',
  },
  topRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '10px',
    paddingBottom: '12px',
    borderBottom: '1px solid #f1f5f9',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '8px',
  },
  iconWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    borderRadius: '8px',
    backgroundColor: '#eef2ff',
    border: '1px solid #c7d2fe',
  },
  title: {
    fontSize: '0.94rem',
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: '-0.01em',
  },
  statusBadges: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    flexWrap: 'wrap',
    marginLeft: '4px',
  },
  indicatorBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    backgroundColor: '#eff6ff',
    color: '#1d4ed8',
    border: '1px solid #bfdbfe',
    borderRadius: '20px',
    padding: '2px 8px',
    fontSize: '0.72rem',
    fontWeight: '600',
  },
  blueDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#2563eb',
  },
  filterBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    backgroundColor: '#faf5ff',
    color: '#7e22ce',
    border: '1px solid #e9d5ff',
    borderRadius: '20px',
    padding: '2px 8px',
    fontSize: '0.72rem',
    fontWeight: '600',
  },
  purpleDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#9333ea',
  },
  pipelineToggle: {
    background: 'none',
    border: '1px solid #e2e8f0',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.78rem',
    fontWeight: '600',
    color: '#4f46e5',
    cursor: 'pointer',
    padding: '5px 10px',
    borderRadius: '8px',
    backgroundColor: '#f8fafc',
    transition: 'all 0.15s ease',
  },
  breakdownRow: {
    display: 'flex',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: '16px',
    marginTop: '12px',
  },
  intentGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    minWidth: '180px',
  },
  constraintsGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    flex: 1,
    minWidth: '220px',
  },
  groupLabel: {
    fontSize: '0.7rem',
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  intentChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    padding: '5px 12px',
    borderRadius: '8px',
    fontSize: '0.84rem',
    fontWeight: '600',
    color: '#0f172a',
    width: 'fit-content',
    maxWidth: '100%',
  },
  intentText: {
    overflowWrap: 'break-word',
    wordBreak: 'break-word',
  },
  chipsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    alignItems: 'center',
  },
  constraintChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '5px 11px',
    borderRadius: '8px',
    fontSize: '0.82rem',
    fontWeight: '600',
    lineHeight: 1.3,
    backgroundColor: '#eef2ff',
    color: '#3730a3',
    border: '1px solid #c7d2fe',
    maxWidth: '100%',
    overflowWrap: 'break-word',
  },
  categoryChip: {
    backgroundColor: '#fdf4ff',
    color: '#86198f',
    borderColor: '#f5d0fe',
  },
  noConstraintText: {
    fontSize: '0.8rem',
    color: '#94a3b8',
    fontStyle: 'italic',
    padding: '4px 0',
  },
  pipelineContainer: {
    marginTop: '14px',
    padding: '14px 16px',
    backgroundColor: '#f8fafc',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    animation: 'fadeIn 0.2s ease-in-out',
  },
  pipelineHeader: {
    marginBottom: '10px',
  },
  pipelineTitle: {
    fontSize: '0.74rem',
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  pipelineSteps: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  stepItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '8px 12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
    flex: '1 1 180px',
    minWidth: '160px',
  },
  stepNumber: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    backgroundColor: '#4f46e5',
    color: '#ffffff',
    fontSize: '0.7rem',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stepContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    minWidth: 0,
  },
  stepTitle: {
    fontSize: '0.76rem',
    fontWeight: '700',
    color: '#1e293b',
  },
  stepDesc: {
    fontSize: '0.7rem',
    color: '#64748b',
    lineHeight: '1.3',
    overflowWrap: 'break-word',
  },
  stepArrow: {
    color: '#94a3b8',
    fontSize: '0.85rem',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};

export default QueryUnderstandingPanel;
