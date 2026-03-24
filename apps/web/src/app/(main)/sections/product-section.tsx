import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton/skeleton';
import { fetchProducts } from './api';
import styles from '../home.module.css';
import { ProductCard } from '@/components/catalog/product-card';
import type { ProductListItem } from '@/types/product';

function ProductSectionCard({ product }: { readonly product: ProductListItem }) {
  return (
    <li>
      <ProductCard product={product} />
    </li>
  );
}

function ProductGridSkeleton() {
  return (
    <ul className={styles.skeletonGrid}>
      {Array.from({ length: 8 }).map((_, i) => (
        <li key={i} className={styles.skeletonCard}>
          <Skeleton height="16rem" style={{ borderRadius: 'var(--radius-lg)' }} />
          <Skeleton height="1.25rem" width="70%" />
          <Skeleton height="1rem" width="40%" />
        </li>
      ))}
    </ul>
  );
}

async function ProductGrid({ sort }: { readonly sort: string }) {
  const products = await fetchProducts(sort);
  if (!products.length) {
    return (
      <p style={{ color: 'var(--color-text-muted, #6b7280)', padding: 'var(--space-4) 0', fontSize: 'var(--text-sm)' }}>
        No products available right now.
      </p>
    );
  }
  return (
    <ul className={styles.productGrid}>
      {products.map((p) => (
        <ProductSectionCard key={p.id} product={p as any} />
      ))}
    </ul>
  );
}

/** Product section with title, "View All" link, and a product grid. */
export function ProductSection({
  title,
  sort,
  viewAllHref,
  style,
  showViewAll = true,
}: {
  readonly title: string;
  readonly sort: string;
  readonly viewAllHref: string;
  readonly style?: React.CSSProperties;
  readonly showViewAll?: boolean;
}) {
  return (
    <section className={styles.section} style={style}>
      <div style={{ maxWidth: 'var(--container-max)', margin: '0 auto', padding: '0 var(--container-pad)' }}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitleAccent}>{title}</h2>
          {showViewAll && <Link href={viewAllHref} className={styles.viewAll}>View All</Link>}
        </div>
        <Suspense fallback={<ProductGridSkeleton />}>
          <ProductGrid sort={sort} />
        </Suspense>
      </div>
    </section>
  );
}
