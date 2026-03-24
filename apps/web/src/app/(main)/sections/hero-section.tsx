import Image from 'next/image';
import Link from 'next/link';
import styles from '../home.module.css';

/** Full-width hero banner with CTA. */
export function HeroSection() {
  return (
    <section className={styles.hero}>
      <div className={styles.heroImageSlot} aria-hidden>
        <Image
          src="/home page 1.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className={styles.heroImage}
        />
      </div>
      <div className={styles.heroOverlay}>
        <div className={styles.heroContentBox}>
          <h1 className={styles.heroTitle}>Big Learning Starts Small</h1>
          <p className={styles.heroSubtitle}>
            Discover hands-on learning materials that support children&apos;s growth through play,
            creativity, and exploration.
          </p>
          <Link href="/products" className={styles.ctaPrimary}>SHOP NOW</Link>
        </div>
      </div>
    </section>
  );
}
