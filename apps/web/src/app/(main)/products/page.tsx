'use client';

import { Suspense, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Skeleton } from '@/components/ui/skeleton/skeleton';
import { CATEGORIES, STORES } from '@/lib/home-data';
import { AddToCartInline } from '@/components/add-to-cart-inline';
import styles from './products.module.css';

interface Product {
  readonly id: number;
  readonly name: string;
  readonly price: number;
  readonly imageUrl?: string;
  readonly ageRange?: string;
  readonly category?: string;
  readonly store?: string;
}

interface ProductsResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const AGE_RANGES = ['3+', '5+', '8+'] as const;
const PAGE_SIZE = 12;

function ProductCard({ product }: { readonly product: Product }) {
  return (
    <li className={styles.productCard}>
      <Link href={`/products/${product.id}`} className={styles.productImageWrap}>
        <Image
          src={product.imageUrl ?? '/product1.png'}
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
  const [page, setPage] = useState(1);

  const category = searchParams.get('category') ?? undefined;
  const age = searchParams.get('age') ?? undefined;
  const store = searchParams.get('store') ?? undefined;
  const search = searchParams.get('search') ?? undefined;
  const sort = searchParams.get('sort') ?? undefined;

  useEffect(() => {
    setPage(1);
  }, [category, age, store, search, sort]);

  const queryString = new URLSearchParams();
  if (search) queryString.set('search', search);
  // Category/age/store/sort are currently UI-only filters; backend supports search + page/limit.
  queryString.set('page', String(page));
  queryString.set('limit', String(PAGE_SIZE));

  const { data, isLoading, isError } = useQuery<ProductsResponse>({
    queryKey: ['products', search, page],
    queryFn: async () => {
      const { data: res } = await apiClient.get<ProductsResponse>(`/products?${queryString.toString()}`);
      return res;
    },
  });

  const totalPages = data?.totalPages ?? 1;

  const pageTitle =
    search
      ? `Results for "${search}"`
      : category ?? (age ? `Age ${age}` : undefined) ?? (store ?? 'All Products');

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
                  className={!category && !age && !store ? styles.sidebarLinkActive : styles.sidebarLink}
                  onClick={handleFilterLinkClick}
                >
                  All Categories
                </Link>
              </li>
              {CATEGORIES.map((c) => (
                <li key={c}>
                  <Link
                    href={`/products?category=${encodeURIComponent(c)}`}
                    className={category === c ? styles.sidebarLinkActive : styles.sidebarLink}
                    onClick={handleFilterLinkClick}
                  >
                    {c}
                  </Link>
                </li>
              ))}
            </ul>

            <div className={styles.sidebarSection}>
              <h2 className={styles.sidebarTitle}>Age Range</h2>
              <ul className={styles.sidebarList}>
                {AGE_RANGES.map((a) => (
                  <li key={a}>
                    <Link
                      href={`/products?age=${encodeURIComponent(a)}`}
                      className={age === a ? styles.sidebarLinkActive : styles.sidebarLink}
                      onClick={handleFilterLinkClick}
                    >
                      {a}
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
