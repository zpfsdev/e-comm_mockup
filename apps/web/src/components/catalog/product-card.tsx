'use client';

import Image from 'next/image';
import Link from 'next/link';
import { AddToCartInline } from '@/components/add-to-cart-inline';
import type { ProductListItem, ProductAgeRange } from '@/types/product';
import styles from './product-card.module.css';

function formatAgeLabel(ar: ProductAgeRange): string {
  if (ar.label) return ar.label;
  if (ar.maxAge === null) return `${ar.minAge}+`;
  return `${ar.minAge}–${ar.maxAge} yrs`;
}

interface ProductCardProps {
  readonly product: ProductListItem;
}

export function ProductCard({ product }: ProductCardProps) {
  
  return (
    <div className={styles.productCard}>
      <div className={styles.productImageArea}>
        <Link href={`/products/${product.id}`} className={styles.productImageWrap}>
          <Image
            src={product.imageUrl || '/product1.png'}
            alt={product.name}
            width={300}
            height={420}
            className={styles.productImage}
          />
        </Link>
        <div className={styles.topBadgeRow}>
          {product.ageRange && <span className={styles.ageBadge}>{formatAgeLabel(product.ageRange)}</span>}
          {product.seller && (
            <Link href={`/stores/${product.seller.id}`} className={styles.shopIconLink}>
              {product.seller.shopLogoUrl ? (
                <Image
                  src={product.seller.shopLogoUrl}
                  alt={product.seller.shopName}
                  width={32}
                  height={32}
                  className={styles.shopLogo}
                />
              ) : (
                <div className={styles.shopIconPlaceholder}>
                  {product.seller.shopName.charAt(0)}
                </div>
              )}
            </Link>
          )}
        </div>
      </div>
      <div className={styles.productBody}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <span className={styles.productName} style={{ flex: 1, paddingRight: 'var(--space-2)' }}>{product.name}</span>
          {product.averageRating ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#fbbf24" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#7b715a' }}>
                {product.averageRating}
              </span>
            </div>
          ) : null}
        </div>
        <span className={styles.productPrice}>
          Php {Number(product.price).toFixed(2)}
        </span>
        <AddToCartInline
          productId={product.id}
          productName={product.name}
          className={styles.addToCartBtn}
        />
      </div>
    </div>
  );
}
