import Image from 'next/image';
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

  const stockLabel =
    product.stockQuantity > 0 ? 'In Stock' : 'Out of Stock';

  const description =
    product.description ||
    'Premium early childhood learning product designed to support hands-on play, creativity, and exploration. Safe materials and age-appropriate design.';

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Link href="/products" className={styles.backLink} aria-label="Back to products">
          <ArrowLeftIcon />
          <span className={styles.backLinkText}>Back to Products</span>
        </Link>

        <div className={styles.topSection}>
          <div className={styles.imageSection}>
            <Image
              src={product.imageUrl || '/product1.png'}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          </div>

          <div className={styles.infoSection}>
            <p className={styles.shopName}>{product.seller.shopName}</p>
            <h1 className={styles.productName}>{product.name}</h1>

            <div className={styles.metaGrid}>
              <span className={styles.metaLabel}>Price:</span>
              <span>₱{Number(product.price).toFixed(2)}</span>
              <span className={styles.metaLabel}>Stock:</span>
              <span>{stockLabel}</span>
            </div>

            <AddToCartButton productId={product.id} stock={product.stockQuantity} />
          </div>
        </div>

        <div className={styles.shopCard}>
          {product.seller.shopLogoUrl && (
            <div style={{ position: 'relative', width: '3rem', height: '3rem', borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
              <Image src={product.seller.shopLogoUrl} alt={product.seller.shopName} fill sizes="3rem" style={{ objectFit: 'cover' }} />
            </div>
          )}
          {!product.seller.shopLogoUrl && <span className={styles.shopAvatar} aria-hidden />}
          <h2 className={styles.shopCardName}>{product.seller.shopName}</h2>
        </div>

        <div className={styles.specsBlock}>
          <h2 className={styles.specsTitle}>Product Specifications</h2>
          <dl className={styles.specsGrid}>
            <dt className={styles.specsLabel}>Category</dt>
            <dd>{product.category.categoryName}</dd>
            <dt className={styles.specsLabel}>Stock</dt>
            <dd>{stockLabel}</dd>
            <dt className={styles.specsLabel}>Age Range</dt>
            <dd>{formatAgeRange(product.ageRange)}</dd>
          </dl>
        </div>

        <div className={styles.descBlock}>
          <h2 className={styles.descTitle}>Product Description</h2>
          <p className={styles.descBody}>{description}</p>
        </div>
      </div>
    </div>
  );
}
