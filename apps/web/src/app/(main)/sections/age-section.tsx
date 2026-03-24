import Link from 'next/link';
import { Suspense } from 'react';
import { AGE_COLOR_PALETTE } from '@/lib/home-data';
import { fetchAgeRanges } from './api';
import type { AgeRange } from './types';
import styles from '../home.module.css';

function formatAgeLabel(ar: AgeRange): string {
  if (ar.maxAge === null) return `${ar.minAge}+`;
  return `${ar.minAge}–${ar.maxAge}`;
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
            <Link href={`/products?ageRangeId=${ar.id}`} className={styles.ageCard} style={{ backgroundColor: bg }}>
              <span className={styles.ageLabel} style={{ color: text }}>{formatAgeLabel(ar)}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** "Shop by Age" section with color-coded age range cards. */
export function AgeSection() {
  return (
    <section className={styles.ageBandSection}>
      <div style={{ maxWidth: 'var(--container-max)', margin: '0 auto', padding: '0 var(--container-pad)' }}>
        <h2 className={styles.ageBandTitle}>Shop by Age</h2>
        <Suspense fallback={<AgeCardsSkeleton />}>
          <AgeCards />
        </Suspense>
      </div>
    </section>
  );
}
