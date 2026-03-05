import styles from './orders.module.css';

export default function OrdersLoading() {
  return (
    <div className={styles.page}>
      <div
        style={{
          width: '12rem',
          height: '2.5rem',
          borderRadius: 'var(--radius-md)',
          background: 'var(--color-card-border)',
          marginBottom: 'var(--space-6)',
        }}
      />
      <div className={styles.orderList}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              height: '8rem',
              borderRadius: 'var(--radius-xl)',
              background: 'var(--color-card-border)',
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          />
        ))}
      </div>
    </div>
  );
}
