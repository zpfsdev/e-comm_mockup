import Image from 'next/image';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/constants';
import styles from '../stores.module.css';

interface Product { id: number; name: string; price: number; imageUrl?: string; ageRange?: string; }
interface Seller { id: number; shopName: string; description?: string; logoUrl?: string; products?: Product[]; }

async function fetchSeller(id: string): Promise<Seller | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/sellers/${id}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return (await res.json()) as Seller;
  } catch {
    return null;
  }
}

export default async function StoreDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const seller = await fetchSeller(id);

  if (!seller) {
    return (
      <div className={styles.page}>
        <p>Store not found.</p>
        <Link href="/stores" style={{ color: 'var(--color-primary)' }}>← Back to Stores</Link>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Link href="/stores" style={{ color: 'var(--color-primary)', fontWeight: 'var(--weight-bold)', textDecoration: 'none', display: 'inline-block', marginBottom: 'var(--space-8)' }}>← All Stores</Link>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)', marginBottom: 'var(--space-10)' }}>
        <div className={styles.storeCircle} style={{ width: '6rem', height: '6rem', position: 'relative', overflow: 'hidden' }}>
          {seller.logoUrl ? (
            <Image
              src={seller.logoUrl}
              alt={seller.shopName}
              fill
              sizes="6rem"
              style={{ objectFit: 'cover' }}
            />
          ) : (
            <span className={styles.storeInitial}>{seller.shopName.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <div>
          <h1 className={styles.heading} style={{ marginBottom: 'var(--space-2)' }}>{seller.shopName}</h1>
          {seller.description && <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>{seller.description}</p>}
        </div>
      </div>
      {seller.products?.length ? (
        <div className={styles.grid}>
          {seller.products.map((p) => (
            <Link key={p.id} href={`/products/${p.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{ border: '1.5px solid var(--color-card-border)', borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
                <div style={{ aspectRatio: '1', background: 'var(--color-card-border)', position: 'relative', overflow: 'hidden' }}>
                  {p.imageUrl && (
                    <Image
                      src={p.imageUrl}
                      alt={p.name}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      style={{ objectFit: 'cover' }}
                    />
                  )}
                </div>
                <div style={{ padding: 'var(--space-4)' }}>
                  <p style={{ fontWeight: 'var(--weight-bold)' }}>{p.name}</p>
                  <p style={{ color: 'var(--color-primary)', fontWeight: 'var(--weight-bold)' }}>₱{Number(p.price).toFixed(2)}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className={styles.empty}>This store has no products yet.</p>
      )}
    </div>
  );
}
