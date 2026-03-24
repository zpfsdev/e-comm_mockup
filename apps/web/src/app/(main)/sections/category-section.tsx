import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';
import { CATEGORY_GRADIENT_PALETTE } from '@/lib/home-data';
import { fetchCategories } from './api';
import styles from '../home.module.css';

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
      {categories.map((cat, i) => {
        const gradient = CATEGORY_GRADIENT_PALETTE[i % CATEGORY_GRADIENT_PALETTE.length];
        return (
          <li key={cat.id} style={{ flexShrink: 0 }}>
            <Link href={`/products?categoryId=${cat.id}`} className={styles.categoryPill}>
              <div className={styles.categoryCircleWrapper} style={{ background: gradient }}>
                {cat.imageUrl ? (
                  <Image
                    src={cat.imageUrl}
                    alt={cat.categoryName}
                    width={170}
                    height={170}
                    className={styles.categoryCircleImage}
                  />
                ) : (
                  <span className={styles.categoryCircle} />
                )}
              </div>
              <span className={styles.categoryLabel}>{cat.categoryName}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** "Shop by Category" section with decorative strip image. */
export function CategorySection() {
  return (
    <section className={styles.categoryStripSection}>
      <div style={{ maxWidth: 'var(--container-max)', margin: '0 auto', padding: '0 var(--container-pad)' }}>
        <h2 className={styles.sectionTitle}>Shop by Category</h2>
        <Suspense fallback={<CategoryPillsSkeleton />}>
          <CategoryPills />
        </Suspense>
      </div>
      <div className={styles.stripSection} aria-hidden>
        <Image src="/homepage 2.png" alt="" fill sizes="100vw" className={styles.stripImage} />
      </div>
    </section>
  );
}
