import React, { useState, useEffect } from 'react';
import Explanation from './Explanation';
import { IconStar, IconCheckCircle } from './Icons';

/**
 * ProductCard renders an individual product with image, ratings, price,
 * constraint match indicator, and match explanation.
 */
const ProductCard = ({
  product,
  index,
  hasActiveConstraints = false,
  isExplanationOpen,
  onToggleExplanation,
}) => {
  const [imageError, setImageError] = useState(false);

  const formatPrice = (priceVal) => {
    if (priceVal === null || priceVal === undefined) return 'N/A';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(priceVal);
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

  const { title, subCategory } = parseProductContent(product?.page_content);
  const { price, rating, category, image, no_of_ratings, actual_price } =
    product?.metadata || {};

  // Reset image error state whenever the product or image changes
  useEffect(() => {
    setImageError(false);
  }, [image, product?.page_content]);

  // Upgrade image URLs to https to prevent mixed-content blocking
  const secureImageUrl = image ? String(image).replace(/^http:\/\//i, 'https://') : null;
  const hasValidImage = secureImageUrl && !imageError;

  return (
    <article style={styles.card} aria-label={title}>
      {/* Product Image Section */}
      <div style={styles.imageContainer}>
        {hasValidImage ? (
          <img
            src={secureImageUrl}
            alt={title}
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
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
            <span style={styles.placeholderText}>Product Preview</span>
          </div>
        )}

        {/* Floating Category & Constraint Badges */}
        <div style={styles.floatingBadges}>
          <span style={styles.categoryBadge} title={category || 'Product'}>
            {category || 'Product'}
          </span>
          {hasActiveConstraints && (
            <span style={styles.constraintMatchBadge} title="Product satisfies all numeric and category filter constraints">
              <IconCheckCircle size={12} color="#059669" style={{ marginRight: '4px' }} />
              Matches constraints
            </span>
          )}
        </div>
      </div>

      {/* Card Content Details */}
      <div style={styles.cardContent}>
        {subCategory && (
          <span style={styles.subCategoryBadge} title={subCategory}>
            {subCategory}
          </span>
        )}

        <h3 style={styles.productTitle} title={title}>
          {title}
        </h3>

        {/* Rating & Review Count */}
        <div style={styles.ratingRow}>
          <div style={styles.ratingBadge}>
            <IconStar size={13} color="#eab308" fill="#eab308" />
            <span style={styles.ratingValue}>
              {rating !== null && rating !== undefined
                ? Number(rating).toFixed(1)
                : 'N/A'}
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

        {/* Explainability Accordion */}
        <Explanation
          explanation={product?.explanation}
          isOpen={isExplanationOpen}
          onToggle={onToggleExplanation}
        />
      </div>
    </article>
  );
};

const styles = {
  card: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '18px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 3px 12px rgba(0, 0, 0, 0.04)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    height: 'fit-content',
    width: '100%',
    minWidth: 0,
    boxSizing: 'border-box',
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
    overflow: 'hidden',
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
    top: '10px',
    left: '10px',
    right: '10px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '6px',
    zIndex: 1,
    pointerEvents: 'none',
  },
  categoryBadge: {
    display: 'inline-block',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    color: '#4338ca',
    fontSize: '0.7rem',
    fontWeight: '700',
    padding: '3px 8px',
    borderRadius: '6px',
    textTransform: 'capitalize',
    boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
    backdropFilter: 'blur(4px)',
    maxWidth: '55%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    pointerEvents: 'auto',
  },
  constraintMatchBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    backgroundColor: 'rgba(236, 253, 245, 0.96)',
    color: '#065f46',
    border: '1px solid #a7f3d0',
    fontSize: '0.68rem',
    fontWeight: '700',
    padding: '3px 7px',
    borderRadius: '6px',
    boxShadow: '0 2px 6px rgba(6, 95, 70, 0.08)',
    backdropFilter: 'blur(4px)',
    whiteSpace: 'nowrap',
    pointerEvents: 'auto',
  },
  cardContent: {
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    flex: '1',
    minWidth: 0,
  },
  subCategoryBadge: {
    display: 'inline-block',
    backgroundColor: '#f1f5f9',
    color: '#64748b',
    fontSize: '0.7rem',
    fontWeight: '600',
    padding: '3px 8px',
    borderRadius: '4px',
    marginBottom: '8px',
    maxWidth: '100%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    width: 'fit-content',
  },
  productTitle: {
    fontSize: '0.94rem',
    fontWeight: '600',
    color: '#0f172a',
    margin: '0 0 10px 0',
    lineHeight: '1.45',
    display: '-webkit-box',
    WebkitLineClamp: '2',
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    minHeight: '2.8em',
    overflowWrap: 'break-word',
    wordBreak: 'break-word',
  },
  ratingRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '10px',
    flexWrap: 'wrap',
  },
  ratingBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: '#fef9c3',
    border: '1px solid #fef08a',
    padding: '2px 7px',
    borderRadius: '6px',
    flexShrink: 0,
  },
  ratingValue: {
    fontSize: '0.8rem',
    fontWeight: '700',
    color: '#854d0e',
  },
  reviewsCount: {
    fontSize: '0.75rem',
    color: '#64748b',
    overflowWrap: 'break-word',
  },
  priceRow: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: '10px',
    paddingTop: '8px',
    borderTop: '1px solid #f8fafc',
    flexWrap: 'wrap',
    gap: '6px',
  },
  priceContainer: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '8px',
    flexWrap: 'wrap',
  },
  priceValue: {
    fontSize: '1.25rem',
    fontWeight: '800',
    color: '#0f172a',
  },
  actualPrice: {
    fontSize: '0.82rem',
    color: '#94a3b8',
    textDecoration: 'line-through',
    fontWeight: '500',
  },
};

export default ProductCard;
