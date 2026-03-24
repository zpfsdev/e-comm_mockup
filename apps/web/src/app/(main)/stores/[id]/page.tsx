import Image from 'next/image';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/constants';
import { CatalogNavSidebar } from '@/components/catalog/catalog-nav-sidebar';
import { ProductCard } from '@/components/catalog/product-card';
import type { 
  ProductListItem, 
  ProductCategory, 
  ProductAgeRange, 
  ProductSeller 
} from '@/types/product';
import styles from './store-page.module.css';

/** Fetches public data from the API on the server — no auth required. */
async function publicFetch<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    next: { revalidate: 3600 },
  });
  if (!response.ok) throw new Error(`API error ${response.status}: ${path}`);
  return response.json() as Promise<T>;
}

async function fetchSeller(id: string): Promise<ProductSeller | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/sellers/${id}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return (await res.json()) as ProductSeller;
  } catch {
    return null;
  }
}

async function fetchSellerProducts(id: string): Promise<ProductListItem[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/products?sellerId=${id}&limit=20`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const json = (await res.json()) as { products: ProductListItem[] };
    return json.products;
  } catch {
    return [];
  }
}

export default async function StoreDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [seller, categories, ageRanges, allSellers] = await Promise.all([
    fetchSeller(id),
    publicFetch<ProductCategory[]>('/categories').catch(() => []),
    publicFetch<ProductAgeRange[]>('/categories/age-ranges').catch(() => []),
    publicFetch<{ sellers: ProductSeller[] }>('/sellers?limit=50').catch(() => ({ sellers: [] })),
  ]);

  if (!seller) {
    return (
      <div className={styles.page}>
        <div className="container">
          <p>Store not found.</p>
          <Link href="/products" style={{ color: 'var(--color-primary)' }}>← Back to Shopping</Link>
        </div>
      </div>
    );
  }

  const products = await fetchSellerProducts(id);

  return (
    <div className={styles.page}>
      <div className="container">

        <div className={styles.shopLayout} style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 'var(--space-xl)', alignItems: 'start' }}>
          <CatalogNavSidebar 
            categories={categories} 
            ageRanges={ageRanges} 
            sellers={allSellers.sellers} 
          />

          <main>
            <section className={styles.introStrip}>
              <div className={styles.hero}>
                <div className={styles.logoWrap}>
                  {seller.shopLogoUrl ? (
                    <Image
                      src={seller.shopLogoUrl}
                      alt={seller.shopName}
                      fill
                      sizes="10rem"
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '3rem', fontWeight: 700, color: '#dc8242' }}>
                      {seller.shopName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className={styles.heroText}>
                  <h1 className={styles.shopTitle}>{seller.shopName}</h1>
                  <p className={styles.description}>
                    {seller.description || "Welcome to our store! We offer a curated selection of quality items for children."}
                  </p>
                </div>
              </div>
            </section>

            <h2 className={styles.sectionTitle}>All Products</h2>

            {products.length > 0 ? (
              <ul style={{ 
                listStyle: 'none', 
                margin: 0, 
                padding: 0, 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', 
                gap: 'var(--space-xl)' 
              }}>
                {products.map((p) => (
                  <li key={p.id}>
                    <ProductCard product={p} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.empty}>This store has no products yet.</p>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
