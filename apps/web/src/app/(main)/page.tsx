import { Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CATEGORY_GRADIENT_PALETTE, AGE_COLOR_PALETTE, STORES, STORE_IMAGES } from '@/lib/home-data';
import { API_BASE_URL } from '@/lib/constants';
import { Skeleton } from '@/components/ui/skeleton/skeleton';
import { AddToCartInline } from '@/components/add-to-cart-inline';
import styles from './home.module.css';

// ─── API types ───────────────────────────────────────────────────────────────

interface Product {
  readonly id: number;
  readonly name: string;
  readonly price: string;
  readonly imageUrl: string;
  readonly ageRange: { readonly label: string | null; readonly minAge: number; readonly maxAge: number | null };
}

interface Category {
  readonly id: number;
  readonly categoryName: string;
}

interface AgeRange {
  readonly id: number;
  readonly minAge: number;
  readonly maxAge: number | null;
  readonly label: string | null;
}

interface Seller {
  readonly id: number;
  readonly shopName: string;
  readonly shopLogoUrl: string | null;
}

// ─── Server fetch helpers ─────────────────────────────────────────────────────

async function fetchProducts(sort: string): Promise<Product[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/products?limit=8&sort=${sort}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const json = await res.json() as { products?: Product[]; data?: Product[] };
    return json.products ?? json.data ?? [];
  } catch {
    return [];
  }
}

async function fetchCategories(): Promise<Category[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/categories`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    return (await res.json()) as Category[];
  } catch {
    return [];
  }
}

async function fetchAgeRanges(): Promise<AgeRange[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/categories/age-ranges`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    return (await res.json()) as AgeRange[];
  } catch {
    return [];
  }
}

async function fetchSellers(): Promise<Seller[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/sellers?limit=6`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json) ? (json as Seller[]) : ((json as { data?: Seller[] }).data ?? []);
  } catch {
    return [];
  }
}

function formatAgeLabel(ar: AgeRange): string {
  if (ar.maxAge === null) return `${ar.minAge}+`;
  return `${ar.minAge}–${ar.maxAge}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProductCard({ product }: { readonly product: Product }) {
  const ageDisplay = product.ageRange?.label ?? (
    product.ageRange
      ? (product.ageRange.maxAge === null
          ? `${product.ageRange.minAge}+`
          : `${product.ageRange.minAge}-${product.ageRange.maxAge}`)
      : undefined
  );
  return (
    <li className={styles.productCard}>
      <Link href={`/products/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        <div className={styles.productImageWrap}>
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className={styles.productImage}
            />
          ) : (
            <div className={styles.productImage} />
          )}
          {ageDisplay && <span className={styles.ageBadge}>{ageDisplay}</span>}
        </div>
        <div className={styles.productInfo}>
          <span className={styles.productName}>{product.name}</span>
          <span className={styles.productPrice}>₱{Number(product.price).toFixed(2)}</span>
        </div>
      </Link>
      <AddToCartInline productId={product.id} productName={product.name} className={styles.addToCart} />
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

async function ProductSection({ sort }: { readonly sort: string }) {
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
      {products.map((p) => <ProductCard key={p.id} product={p} />)}
    </ul>
  );
}

function CategoryPillsSkeleton() {
  return (
    <ul className={styles.categoryList} aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <li key={i} style={{ flexShrink: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{ width: '10.625rem', height: '10.625rem', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', animation: 'pulse 1.5s ease-in-out infinite' }} />
            <div style={{ width: '5rem', height: '1rem', borderRadius: '4px', background: 'rgba(255,255,255,0.2)', animation: 'pulse 1.5s ease-in-out infinite' }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

async function CategoryPills() {
  const categories = await fetchCategories();
  if (!categories.length) return null;
  return (
    <ul className={styles.categoryList}>
      {categories.map((cat, i) => (
        <li key={cat.id} style={{ flexShrink: 0 }}>
          <Link
            href={`/products?categoryId=${cat.id}`}
            className={styles.categoryPill}
          >
            <span
              className={styles.categoryCircle}
              style={{ background: CATEGORY_GRADIENT_PALETTE[i % CATEGORY_GRADIENT_PALETTE.length] }}
            />
            <span className={styles.categoryLabel}>{cat.categoryName}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function AgeCardsSkeleton() {
  return (
    <ul className={styles.ageList} aria-hidden>
      {Array.from({ length: 4 }).map((_, i) => (
        <li key={i} className={styles.ageCardItem}>
          <div style={{ height: '14rem', borderRadius: 'var(--radius-lg)', background: 'rgba(255,255,255,0.25)', animation: 'pulse 1.5s ease-in-out infinite' }} />
        </li>
      ))}
    </ul>
  );
}

async function AgeCards() {
  const ageRanges = await fetchAgeRanges();
  if (!ageRanges.length) return null;
  return (
    <ul className={styles.ageList}>
      {ageRanges.map((ar, i) => {
        const { bg, text } = AGE_COLOR_PALETTE[i % AGE_COLOR_PALETTE.length];
        return (
          <li key={ar.id} className={styles.ageCardItem}>
            <Link
              href={`/products?ageRangeId=${ar.id}`}
              className={styles.ageCard}
              style={{ backgroundColor: bg }}
            >
              <span className={styles.ageLabel} style={{ color: text }}>
                {formatAgeLabel(ar)}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

async function StoreList() {
  const sellers = await fetchSellers();
  return (
    <ul className={styles.storeList}>
      {STORES.map((name) => (
        <li key={name}>
          <Link href={`/stores?store=${encodeURIComponent(name)}`} className={styles.storeLink}>
            <span className={styles.storeImageWrap}>
              <Image
                src={STORE_IMAGES[name]}
                alt={name}
                fill
                sizes="11rem"
                className={styles.storeImage}
              />
            </span>
            <span className={styles.storeName}>{name}</span>
          </Link>
        </li>
      ))}
      {sellers.map((s) => (
        <li key={s.id}>
          <Link href={`/stores/${s.id}`} className={styles.storeLink}>
            <span className={styles.storeImageWrap}>
              {s.shopLogoUrl && (
                <Image src={s.shopLogoUrl} alt={s.shopName} fill sizes="11rem" className={styles.storeImage} />
              )}
            </span>
            <span className={styles.storeName}>{s.shopName}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroImageSlot} aria-hidden>
          <Image
            src="/homepage 1.png"
            alt=""
            fill
            priority
            sizes="100vw"
            className={styles.heroImage}
          />
        </div>
        <div className={styles.heroOverlay}>
          <div className={styles.heroContentBox}>
            <h1 className={styles.heroTitle}>Big Learning Starts Small</h1>
            <p className={styles.heroSubtitle}>
              Discover hands-on learning materials that support children&apos;s growth through play,
              creativity, and exploration.
            </p>
            <Link href="/products" className={styles.ctaPrimary}>SHOP NOW</Link>
          </div>
        </div>
      </section>

      {/* Shop by Category */}
      <section className={styles.categoryStripSection}>
        <div style={{ maxWidth: 'var(--container-max)', margin: '0 auto', padding: '0 var(--container-pad)' }}>
          <h2 className={styles.sectionTitle}>Shop by Category</h2>
          <Suspense fallback={<CategoryPillsSkeleton />}>
            <CategoryPills />
          </Suspense>
        </div>
        <div className={styles.stripSection} aria-hidden>
          <Image
            src="/homepage 2.png"
            alt=""
            fill
            sizes="100vw"
            className={styles.stripImage}
          />
        </div>
      </section>

      {/* Shop by Age */}
      <section className={styles.ageBandSection}>
        <div style={{ maxWidth: 'var(--container-max)', margin: '0 auto', padding: '0 var(--container-pad)' }}>
          <h2 className={styles.ageBandTitle}>Shop by Age</h2>
          <Suspense fallback={<AgeCardsSkeleton />}>
            <AgeCards />
          </Suspense>
        </div>
      </section>

      {/* Top Picks */}
      <section className={styles.section}>
        <div style={{ maxWidth: 'var(--container-max)', margin: '0 auto', padding: '0 var(--container-pad)' }}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitleAccent}>Top Picks</h2>
            <Link href="/products?sort=popular" className={styles.viewAll}>View All</Link>
          </div>
          <Suspense fallback={<ProductGridSkeleton />}>
            <ProductSection sort="popular" />
          </Suspense>
        </div>
      </section>

      {/* What's New */}
      <section className={styles.section} style={{ paddingTop: 0 }}>
        <div style={{ maxWidth: 'var(--container-max)', margin: '0 auto', padding: '0 var(--container-pad)' }}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitleAccent}>What&apos;s New</h2>
            <Link href="/products?sort=newest" className={styles.viewAll}>View All</Link>
          </div>
          <Suspense fallback={<ProductGridSkeleton />}>
            <ProductSection sort="newest" />
          </Suspense>
        </div>
      </section>

      {/* Shop by Store */}
      <section className={styles.section}>
        <div style={{ maxWidth: 'var(--container-max)', margin: '0 auto', padding: '0 var(--container-pad)' }}>
          <h2 className={styles.sectionTitleDark}>Shop by Store</h2>
          <Suspense fallback={<Skeleton height="10rem" />}>
            <StoreList />
          </Suspense>
          <div className={styles.nurtureCtaWrap}>
            <div className={styles.ctaStrip}>
              <p className={styles.ctaStripText}>
                Nurture Curiosity, One Playful Moment at a Time.
                <br />
                Premium Early Childhood Learning Treasures
                <br />
                Designed to Inspire Creativity &amp; Independence
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
