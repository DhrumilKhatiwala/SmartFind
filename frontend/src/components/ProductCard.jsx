import React, { useState } from 'react';
import Explanation from './Explanation';

/**
 * ProductCard renders an individual product with image, ratings, price, and match explanation.
 */
const ProductCard = ({ product, index, isExplanationOpen, onToggleExplanation }) => {
  const [imageError, setImageError] = useState(false);

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

  const { title, subCategory } = parseProductContent(product.page_content);
  const { price, rating, category, image, no_of_ratings, actual_price } =
    product.metadata || {};

  const hasValidImage = image && !imageError;

  return (
    <article style={styles.card} aria-label={title}>
      {/* Product Image Section */}
      <div style={styles.imageContainer}>
        {hasValidImage ? (
          <img
            src={image}
            alt={title}
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

        {/* Category Badge */}
        <div style={styles.floatingBadges}>
          <span style={styles.categoryBadge}>{category || 'Product'}</span>
        </div>
      </div>

      {/* Card Content Details */}
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
          explanation={product.explanation}
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
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
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
    margin: '0 0 12px 0',
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
    marginBottom: '12px',
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
    marginBottom: '12px',
    paddingTop: '8px',
    borderTop: '1px solid #f8fafc',
  },
  priceContainer: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '8px',
  },
  priceValue: {
    fontSize: '1.32rem',
    fontWeight: '800',
    color: '#0f172a',
  },
  actualPrice: {
    fontSize: '0.85rem',
    color: '#94a3b8',
    textDecoration: 'line-through',
    fontWeight: '500',
  },
};

export default ProductCard;
