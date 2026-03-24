'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import type { ProductAgeRange, ProductCategory, ProductSeller } from '@/types/product';
import styles from '@/app/(main)/products/products.module.css';

function formatAgeLabel(ar: ProductAgeRange): string {
  if (ar.label) return ar.label;
  if (ar.maxAge === null) return `${ar.minAge}+`;
  return `${ar.minAge}–${ar.maxAge} yrs`;
}

/** Shared with `/products` and `/stores/[id]` so browsing feels like one catalog. */
export function CatalogNavSidebar({
  categories,
  ageRanges,
  sellers,
}: {
  readonly categories: ProductCategory[];
  readonly ageRanges: ProductAgeRange[];
  readonly sellers: ProductSeller[];
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isCatalog = pathname === '/products';

  const categoryId = searchParams.get('categoryId') ?? undefined;
  const ageRangeId = searchParams.get('ageRangeId') ?? undefined;
  
  // A store is active if we're on its /stores/[id] page
  const storePathMatch = pathname.match(/\/stores\/([^/]+)/);
  const activeStoreId = storePathMatch ? storePathMatch[1] : undefined;

  const catalogHomeActive = pathname === '/products' && !categoryId && !ageRangeId;

  return (
    <aside className={styles.sidebar}>
      <h2 className={styles.sidebarTitle}>All Categories</h2>
      <ul className={styles.sidebarList}>
        <li>
          <Link
            href="/products"
            className={catalogHomeActive ? styles.sidebarLinkActive : styles.sidebarLink}
            aria-current={catalogHomeActive ? 'page' : undefined}
          >
            All Products
          </Link>
        </li>
        {categories.map((c) => (
          <li key={c.id}>
            <Link
              href={`/products?categoryId=${c.id}`}
              className={categoryId === String(c.id) ? styles.sidebarLinkActive : styles.sidebarLink}
              aria-current={categoryId === String(c.id) ? 'page' : undefined}
            >
              {c.categoryName}
            </Link>
          </li>
        ))}
      </ul>

      <div className={styles.sidebarSection}>
        <h2 className={styles.sidebarTitle}>Age Range</h2>
        <ul className={styles.sidebarList}>
          {ageRanges.map((a) => (
            <li key={a.id}>
              <Link
                href={`/products?ageRangeId=${a.id}`}
                className={ageRangeId === String(a.id) ? styles.sidebarLinkActive : styles.sidebarLink}
                aria-current={ageRangeId === String(a.id) ? 'page' : undefined}
              >
                {formatAgeLabel(a)}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.sidebarSection}>
        <h2 className={styles.sidebarTitle}>Shops</h2>
        <ul className={styles.shopNavList}>
          {sellers.map((s) => (
            <li key={s.id} className={styles.shopNavItem}>
              <Link
                href={`/stores/${s.id}`}
                className={activeStoreId === String(s.id) ? styles.shopNavMainActive : styles.shopNavMain}
                aria-current={activeStoreId === String(s.id) ? 'page' : undefined}
              >
                <span className={styles.shopNavLogo}>
                  {s.shopLogoUrl ? (
                    <Image
                      src={s.shopLogoUrl}
                      alt=""
                      width={40}
                      height={40}
                      style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                    />
                  ) : (
                    <span className={styles.shopNavInitial} aria-hidden>
                      {(s.shopName ?? '?').charAt(0).toUpperCase()}
                    </span>
                  )}
                </span>
                <span className={styles.shopNavName}>{s.shopName}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
