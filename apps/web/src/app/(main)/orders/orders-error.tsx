'use client';

import { useRouter } from 'next/navigation';
import styles from './orders.module.css';

/** Client island that allows the user to trigger a hard reload when orders fail to load. */
export function OrdersError() {
  const router = useRouter();
  return (
    <div className={styles.page}>
      <div style={{ padding: 'var(--space-8)' }}>
        <p
          role="alert"
          style={{
            color: 'var(--color-error, #ef4444)',
            marginBottom: 'var(--space-3)',
          }}
        >
          Failed to load your orders. Please try again.
        </p>
        <button
          type="button"
          className={styles.retryBtn}
          onClick={() => router.refresh()}
        >
          Retry
        </button>
      </div>
    </div>
  );
}
