import Image from 'next/image';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/constants';
import styles from './stores.module.css';

interface Seller {
  id: number;
  shopName: string;
  description?: string;
  logoUrl?: string;
}

async function fetchSellers(): Promise<Seller[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/sellers`, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    return (await res.json()) as Seller[];
  } catch {
    return [];
  }
}

export default async function StoresPage({
  searchParams,
}: {
  searchParams: Promise<{ store?: string }>;
}) {
  const { store } = await searchParams;
  const allSellers = await fetchSellers();
  const sellers = store
    ? allSellers.filter((s) => s.shopName.toUpperCase() === store.toUpperCase())
    : allSellers;

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>{store ? `${store} Store` : 'All Stores'}</h1>
      {!sellers.length ? (
        <p className={styles.empty}>No stores found.</p>
      ) : (
        <div className={styles.grid}>
          {sellers.map((seller) => (
            <Link key={seller.id} href={`/stores/${seller.id}`} className={styles.storeCard}>
              <div className={styles.storeCircle} style={{ position: 'relative', overflow: 'hidden' }}>
                {seller.logoUrl ? (
                  <Image
                    src={seller.logoUrl}
                    alt={seller.shopName}
                    fill
                    sizes="6rem"
                    style={{ objectFit: 'cover' }}
                  />
                ) : (
                  <span className={styles.storeInitial}>
                    {seller.shopName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <span className={styles.storeName}>{seller.shopName}</span>
              {seller.description && (
                <span className={styles.storeDescription}>{seller.description}</span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
