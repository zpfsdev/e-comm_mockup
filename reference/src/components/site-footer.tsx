import styles from "./site-footer.module.css";

const COPYRIGHT = "© 2026 Artistryx. All Rights Reserved.";

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className="container">
        <p className={styles.footerText}>{COPYRIGHT}</p>
      </div>
    </footer>
  );
}
