'use client';

import { Suspense, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Skeleton } from '@/components/ui/skeleton/skeleton';
import { STORES } from '@/lib/home-data';
import { AddToCartInline } from '@/components/add-to-cart-inline';
import styles from './products.module.css';

interface ProductCategory {
  readonly id: number;
  readonly categoryName: string;
}

interface ProductAgeRange {
  readonly id: number;
  readonly label: string | null;
  readonly minAge: number;
  readonly maxAge: number | null;
}

interface Product {
  readonly id: number;
  readonly name: string;
  readonly price: string;
  readonly imageUrl: string;
  readonly category: ProductCategory;
  readonly ageRange: ProductAgeRange;
}

interface ProductsResponse {
  readonly products: Product[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly totalPages: number;
}

const PAGE_SIZE = 12;

function formatAgeLabel(ar: ProductAgeRange): string {
  if (ar.label) return ar.label;
  if (ar.maxAge === null) return `${ar.minAge}+`;
  return `${ar.minAge}–${ar.maxAge} yrs`;
}

function ProductCard({ product }: { readonly product: Product }) {
  return (
    <li className={styles.productCard}>
      <Link href={`/products/${product.id}`} className={styles.productImageWrap}>
        <Image
          src={product.imageUrl || '/product1.png'}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 50vw, 33vw"
          className={styles.productImage}
        />
      </Link>
      <div className={styles.productBody}>
        <span className={styles.productName}>{product.name}</span>
        <span className={styles.productPrice}>₱{Number(product.price).toFixed(2)}</span>
        <AddToCartInline
          productId={product.id}
          productName={product.name}
          className={styles.addToCartBtn}
        />
      </div>
    </li>
  );
}

function ShopContent() {
  const searchParams = useSearchParams();

  const categoryId = searchParams.get('categoryId') ?? undefined;
  const ageRangeId = searchParams.get('ageRangeId') ?? undefined;
  const store = searchParams.get('store') ?? undefined;
  const search = searchParams.get('search') ?? undefined;

  const [page, setPage] = useState(1);

  const { data: categories } = useQuery<ProductCategory[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await apiClient.get<ProductCategory[]>('/categories');
      return data;
    },
    staleTime: 3_600_000,
  });

  const { data: ageRanges } = useQuery<ProductAgeRange[]>({
    queryKey: ['age-ranges'],
    queryFn: async () => {
      const { data } = await apiClient.get<ProductAgeRange[]>('/categories/age-ranges');
      return data;
    },
    staleTime: 3_600_000,
  });

  const queryString = new URLSearchParams();
  if (search) queryString.set('search', search);
  if (categoryId) queryString.set('categoryId', categoryId);
  if (ageRangeId) queryString.set('ageRangeId', ageRangeId);
  queryString.set('page', String(page));
  queryString.set('limit', String(PAGE_SIZE));

  const { data, isLoading, isError } = useQuery<ProductsResponse>({
    queryKey: ['products', search, categoryId, ageRangeId, page],
    queryFn: async () => {
      const { data: res } = await apiClient.get<ProductsResponse>(`/products?${queryString.toString()}`);
      return res;
    },
  });

  const totalPages = data?.totalPages ?? 1;
  const activeCategory = categories?.find((c) => String(c.id) === categoryId);
  const activeAge = ageRanges?.find((a) => String(a.id) === ageRangeId);

  const pageTitle =
    search
      ? `Results for "${search}"`
      : activeCategory?.categoryName
      ?? (activeAge ? formatAgeLabel(activeAge) : undefined)
      ?? (store ?? 'All Products');

  function handleFilterLinkClick() {
    setPage(1);
  }

  return (
    <div className={styles.shopPage}>
      <div className="container">
        <div className={styles.shopLayout}>
          <aside className={styles.sidebar}>
            <h2 className={styles.sidebarTitle}>All Categories</h2>
            <ul className={styles.sidebarList}>
              <li>
                <Link
                  href="/products"
                  className={!categoryId && !ageRangeId && !store ? styles.sidebarLinkActive : styles.sidebarLink}
                  aria-current={!categoryId && !ageRangeId && !store ? 'page' : undefined}
                  onClick={handleFilterLinkClick}
                >
                  All Products
                </Link>
              </li>
              {categories?.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/products?categoryId=${c.id}`}
                    className={categoryId === String(c.id) ? styles.sidebarLinkActive : styles.sidebarLink}
                    aria-current={categoryId === String(c.id) ? 'page' : undefined}
                    onClick={handleFilterLinkClick}
                  >
                    {c.categoryName}
                  </Link>
                </li>
              ))}
            </ul>

            <div className={styles.sidebarSection}>
              <h2 className={styles.sidebarTitle}>Age Range</h2>
              <ul className={styles.sidebarList}>
                {ageRanges?.map((a) => (
                  <li key={a.id}>
                    <Link
                      href={`/products?ageRangeId=${a.id}`}
                      className={ageRangeId === String(a.id) ? styles.sidebarLinkActive : styles.sidebarLink}
                      aria-current={ageRangeId === String(a.id) ? 'page' : undefined}
                      onClick={handleFilterLinkClick}
                    >
                      {formatAgeLabel(a)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className={styles.sidebarSection}>
              <h2 className={styles.sidebarTitle}>All Shops</h2>
              <div className={styles.storeCircles}>
                {STORES.map((s) => (
                  <Link
                    key={s}
                    href={`/products?store=${encodeURIComponent(s)}`}
                    className={styles.storeCircleLink}
                    aria-current={store === s ? 'page' : undefined}
                    onClick={handleFilterLinkClick}
                  >
                    <span className={styles.storeCircle} />
                    <span>{s}</span>
                  </Link>
                ))}
              </div>
            </div>
          </aside>

          <div>
            <h1 className={styles.mainTitle}>{pageTitle}</h1>

            {isError ? (
              <p className={styles.emptyState} style={{ color: 'var(--color-error, #ef4444)' }}>
                Failed to load products. Please try again.
              </p>
            ) : isLoading ? (
              <ul className={styles.productGrid}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <li key={i} className={styles.skeletonCard}>
                    <Skeleton height="20rem" style={{ borderRadius: '10px' }} />
                    <Skeleton height="1.25rem" width="70%" />
                    <Skeleton height="1rem" width="40%" />
                  </li>
                ))}
              </ul>
            ) : data?.products.length === 0 ? (
              <p className={styles.emptyState}>
                No products match your filters.{' '}
                <Link href="/products">View all products</Link>.
              </p>
            ) : (
              <>
                <ul className={styles.productGrid}>
                  {data?.products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </ul>
                {totalPages > 1 && (
                  <div className={styles.pagination}>
                    <button
                      type="button"
                      className={styles.pageBtn}
                      onClick={() => setPage((p) => p - 1)}
                      disabled={page === 1}
                      aria-label="Previous page"
                    >
                      ←
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        type="button"
                        className={`${styles.pageBtn} ${p === page ? styles.pageBtnActive : ''}`}
                        onClick={() => setPage(p)}
                        aria-current={p === page ? 'page' : undefined}
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      type="button"
                      className={styles.pageBtn}
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page === totalPages}
                      aria-label="Next page"
                    >
                      →
                    </button>
                    <span className={styles.pageInfo}>
                      {data?.total ?? 0} products
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.shopPage}>
          <div className="container">
            <div className={styles.shopLayout}>
              <aside className={styles.sidebar}>
                <Skeleton height="20rem" style={{ borderRadius: '15px' }} />
              </aside>
              <div>
                <Skeleton height="3rem" width="14rem" style={{ marginBottom: '2rem' }} />
                <ul className={styles.productGrid}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <li key={i} className={styles.skeletonCard}>
                      <Skeleton height="20rem" style={{ borderRadius: '10px' }} />
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <ShopContent />
    </Suspense>
  );
}
