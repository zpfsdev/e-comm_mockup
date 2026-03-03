import styles from './footer.module.css';

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <p className={styles.copy}>© 2026 Artistryx. All Rights Reserved.</p>
      </div>
    </footer>
  );
}
