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
        <span className={styles.productName}>{product.name}</span>
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
