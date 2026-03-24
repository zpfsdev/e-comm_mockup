import Link from 'next/link';
import { cache } from 'react';
import { notFound } from 'next/navigation';
import { ArrowLeftIcon } from '@/components/icons';
import { API_BASE_URL } from '@/lib/constants';
import type { ProductAgeRange, ProductDetail } from '@/types/product';
import { AddToCartButton } from './add-to-cart-button';
import styles from './product-detail.module.css';

function formatAgeRange(ar: ProductAgeRange): string {
  if (ar.label) return ar.label;
  if (ar.maxAge === null) return `${ar.minAge}+`;
  return `${ar.minAge}–${ar.maxAge} yrs`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * React.cache() deduplicates calls within a single request lifecycle.
 * Both generateMetadata and the page component call this function, so
 * without cache() Next.js would make two identical upstream fetches per page load.
 */
const fetchProduct = cache(async (id: string): Promise<ProductDetail | null> => {
  try {
    const res = await fetch(`${API_BASE_URL}/products/${id}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return (await res.json()) as ProductDetail;
  } catch {
    return null;
  }
});

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const product = await fetchProduct(id);
  return {
    title: product ? `${product.name} | Artistryx` : 'Product | Artistryx',
    description: product?.description ?? 'Product details',
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;
  const product = await fetchProduct(id);
  if (!product) notFound();

  const inStock = product.stockQuantity > 0;
  const stockLabel = inStock ? `In Stock (${product.stockQuantity})` : 'Out of Stock';

  const description =
    product.description ||
    'Premium early childhood learning product designed to support hands-on play, creativity, and exploration. Safe materials and age-appropriate design.';

  const specs = product.specifications;
  const hasDimensions = specs && (specs.height != null || specs.weight != null || specs.width != null || specs.length != null || specs.material != null);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Link href="/products" className={styles.backLink} aria-label="Back to products">
          <ArrowLeftIcon />
          <span className={styles.backLinkText}>Back to Products</span>
        </Link>

        <div className={styles.topSection}>
          <div className={styles.imageSection}>
            <img
              src={product.imageUrl || '/product1.png'}
              alt={product.name}
              className={styles.productImage}
            />
          </div>

          <div className={styles.infoSection}>
            <Link href={`/stores/${product.seller.id}`} style={{ textDecoration: 'none' }}>
              <p className={styles.shopName}>{product.seller.shopName}</p>
            </Link>
            <h1 className={styles.productName}>{product.name}</h1>

            <div className={styles.metaGrid}>
              <span className={styles.metaLabel}>Price:</span>
              <span>Php {Number(product.price).toFixed(2)}</span>
              <span className={styles.metaLabel}>Stock:</span>
              <span style={{ color: inStock ? 'var(--color-success, #16a34a)' : 'var(--color-error, #dc2626)' }}>
                {stockLabel}
              </span>
              <span className={styles.metaLabel}>Category:</span>
              <span>{product.category.categoryName}</span>
              <span className={styles.metaLabel}>Age Range:</span>
              <span>{formatAgeRange(product.ageRange)}</span>
            </div>

            <AddToCartButton productId={product.id} stock={product.stockQuantity} />
          </div>
        </div>

        {/* Seller card with clickable link */}
        <Link href={`/stores/${product.seller.id}`} className={styles.shopCard} style={{ textDecoration: 'none', color: 'inherit' }}>
          {product.seller.shopLogoUrl && (
            <div style={{ position: 'relative', width: '3rem', height: '3rem', borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
              <img src={product.seller.shopLogoUrl} alt={product.seller.shopName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}
          {!product.seller.shopLogoUrl && <span className={styles.shopAvatar} aria-hidden />}
          <h2 className={styles.shopCardName}>{product.seller.shopName}</h2>
          <span className={styles.btnViewShop}>Visit Store →</span>
        </Link>

        {/* Product Specifications */}
        <div className={styles.specsBlock}>
          <h2 className={styles.specsTitle}>Product Specifications</h2>
          <dl className={styles.specsGrid}>
            <dt className={styles.specsLabel}>Category</dt>
            <dd>{product.category.categoryName}</dd>
            <dt className={styles.specsLabel}>Age Range</dt>
            <dd>{formatAgeRange(product.ageRange)}</dd>
            <dt className={styles.specsLabel}>Availability</dt>
            <dd style={{ color: inStock ? 'var(--color-success, #16a34a)' : 'var(--color-error, #dc2626)' }}>
              {stockLabel}
            </dd>
            {product.dateAdded && (
              <>
                <dt className={styles.specsLabel}>Listed</dt>
                <dd>{formatDate(product.dateAdded)}</dd>
              </>
            )}
            {hasDimensions && (
              <>
                {specs!.material != null && (
                  <>
                    <dt className={styles.specsLabel}>Material</dt>
                    <dd>{specs!.material}</dd>
                  </>
                )}
                {specs!.height != null && (
                  <>
                    <dt className={styles.specsLabel}>Height</dt>
                    <dd>{specs!.height} cm</dd>
                  </>
                )}
                {specs!.width != null && (
                  <>
                    <dt className={styles.specsLabel}>Width</dt>
                    <dd>{specs!.width} cm</dd>
                  </>
                )}
                {specs!.length != null && (
                  <>
                    <dt className={styles.specsLabel}>Length</dt>
                    <dd>{specs!.length} cm</dd>
                  </>
                )}
                {specs!.weight != null && (
                  <>
                    <dt className={styles.specsLabel}>Weight</dt>
                    <dd>{specs!.weight} g</dd>
                  </>
                )}
              </>
            )}
          </dl>
        </div>

        {/* Product Description */}
        <div className={styles.descBlock}>
          <h2 className={styles.descTitle}>Product Description</h2>
          <p className={styles.descBody}>{description}</p>
        </div>
      </div>
    </div>
  );
}
