import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons";
import {
  AGE_CARDS,
  CATEGORIES,
  PLACEHOLDER_PRODUCTS,
  STORES,
} from "@/lib/home-data";
import styles from "./page.module.css";

export default function Home() {
  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroImageSlot} aria-hidden>
          <Image
            src="/final 2.png"
            alt=""
            fill
            priority
            sizes="100vw"
            className={styles.heroImage}
          />
        </div>
        <div className={styles.heroOverlay}>
          <div className="container">
            <div className={styles.heroContentBox}>
              <h1 className={styles.heroTitle}>Big Learning Starts Small</h1>
              <p className={styles.heroSubtitle}>
                Discover hands-on learning materials that support children&apos;s
                growth through play, creativity, and exploration.
              </p>
              <Link href="/shop" className={styles.ctaPrimary}>
                SHOP NOW
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.sectionRect103}>
        <div className="container">
          <h2 className={styles.sectionTitle}>Shop by Category</h2>
          <ul className={styles.categoryList}>
            {CATEGORIES.map((label) => (
              <li key={label}>
                <Link href={`/shop?category=${encodeURIComponent(label)}`} className={styles.categoryPill}>
                  <span className={styles.categoryCircle} />
                  <span className={styles.categoryLabel}>{label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className={styles.stripSection} aria-hidden>
          <Image
            src="/niuy 1.png"
            alt=""
            fill
            sizes="100vw"
            className={styles.stripImage}
          />
        </div>
      </section>

      <section className={styles.sectionRect104}>
        <div className="container">
          <h2 className={styles.sectionTitleLight}>Shop by Age</h2>
          <ul className={styles.ageList}>
            {AGE_CARDS.map(({ age, bg }) => (
              <li key={age} className={styles[bg]}>
                <Link href={`/shop?age=${age}`} className={styles.ageCard}>
                  <span className={styles.ageLabel}>{age}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className={styles.section}>
        <div className="container">
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitleAccent}>Top Picks</h2>
            <Link href="/shop" className={styles.viewAll}>
              View All
            </Link>
          </div>
          <ul className={styles.productGrid}>
            {PLACEHOLDER_PRODUCTS.map((p, i) => (
              <li key={i} className={styles.productCard}>
                <div className={styles.productImageWrap}>
                  <div className={styles.productImage} />
                  <span className={styles.ageBadge}>{p.age}</span>
                </div>
                <div className={styles.productInfo}>
                  <span className={styles.productName}>{p.name}</span>
                  <span className={styles.productPrice}>{p.price}</span>
                </div>
                <button type="button" className={styles.addToCart}>
                  Add to Cart
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className={styles.section}>
        <div className="container">
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitleAccent}>What&apos;s New</h2>
            <Link href="/shop" className={styles.viewAll}>
              View All
            </Link>
          </div>
          <ul className={styles.productGrid}>
            {PLACEHOLDER_PRODUCTS.map((p, i) => (
              <li key={i} className={styles.productCard}>
                <div className={styles.productImageWrap}>
                  <div className={styles.productImage} />
                  <span className={styles.ageBadge}>{p.age}</span>
                </div>
                <div className={styles.productInfo}>
                  <span className={styles.productName}>{p.name}</span>
                  <span className={styles.productPrice}>{p.price}</span>
                </div>
                <button type="button" className={styles.addToCart}>
                  Add to Cart
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className={styles.section}>
        <div className="container">
          <h2 className={styles.sectionTitleDark}>Shop by Store</h2>
          <ul className={styles.storeList}>
            {STORES.map((name) => (
              <li key={name}>
                <Link href={`/shop?store=${encodeURIComponent(name)}`} className={styles.storeCircle}>
                  <span className={styles.storePlaceholder} />
                  <span className={styles.storeName}>{name}</span>
                </Link>
              </li>
            ))}
          </ul>
          <div className={styles.group35}>
            <div className={styles.ctaStrip}>
              <p className={styles.ctaStripText}>
                Nurture Curiosity, One Playful Moment at a Time.
                <br />
                Premium Early Childhood Learning Treasures
                <br />
                Designed to Inspire Creativity & Independence
              </p>
              <button type="button" className={styles.ctaArrow} aria-label="Explore">
                <ArrowRightIcon />
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
