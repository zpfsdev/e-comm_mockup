import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton/skeleton';
import { fetchSellers } from './api';
import styles from '../home.module.css';

async function StoreList() {
  const sellers = await fetchSellers();
  if (!sellers.length) {
    return (
      <p style={{ color: 'var(--color-text-muted, #6b7280)', padding: 'var(--space-4) 0', fontSize: 'var(--text-sm)' }}>
        No stores yet. Check back soon.
      </p>
    );
  }
  return (
    <ul className={styles.storeList}>
      {sellers.map((s) => (
        <li key={s.id}>
          <Link href={`/stores/${s.id}`} className={styles.storeLink}>
            <span className={styles.storeImageWrap}>
              {s.shopLogoUrl ? (
                <Image src={s.shopLogoUrl} alt={s.shopName} fill sizes="11rem" className={styles.storeImage} />
              ) : (
                <span className={styles.storeLogoPlaceholder} aria-hidden>
                  {(s.shopName ?? '?').charAt(0).toUpperCase()}
                </span>
              )}
            </span>
            <span className={styles.storeName}>{s.shopName}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Store logos link to `/stores/[id]` (description + products). Browse by category/age on `/products`. */
export function StoreSection() {
  return (
    <section className={`${styles.section} ${styles.storeSection}`}>
      <div style={{ maxWidth: 'var(--container-max)', margin: '0 auto', padding: '0 var(--container-pad)' }}>
        <h2 className={styles.sectionTitleDark} style={{ color: '#ff751f', fontWeight: 700 }}>Shop by Store</h2>
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
  );
}
