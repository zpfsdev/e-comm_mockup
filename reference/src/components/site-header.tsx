import Image from "next/image";
import Link from "next/link";
import { CartIcon, SearchIcon, UserIcon } from "./icons";
import styles from "./site-header.module.css";

/** Brand logo path. */
const LOGO_SRC = "/logo.png";

export function SiteHeader() {
  return (
    <header className={styles.header}>
      <div className={`container ${styles.headerInner}`}>
        <Link href="/" className={styles.logo}>
          <Image
            src={LOGO_SRC}
            alt="Artistryx"
            width={280}
            height={90}
            className={styles.logoImage}
            priority
          />
        </Link>
        <nav className={styles.nav}>
          <Link href="/seller/start-selling" className={styles.startSelling}>
            START SELLING
          </Link>
          <button type="button" className={styles.iconButton} aria-label="Search">
            <SearchIcon />
          </button>
          <Link href="/cart" className={styles.iconButton} aria-label="Cart">
            <CartIcon />
          </Link>
          <div className={styles.profileWrap}>
            <Link href="/profile" className={styles.iconButton} aria-label="Account" aria-haspopup="true" aria-expanded="false">
              <UserIcon />
            </Link>
            <div className={styles.profileDropdown} role="menu">
              <div className={styles.profileDropdownArrow} aria-hidden />
              <div className={styles.profileDropdownPanel}>
                <Link href="/sign-in" className={styles.profileDropdownLink} role="menuitem">
                  Sign In
                </Link>
                <span className={styles.profileDropdownDivider} aria-hidden />
                <Link href="/sign-up" className={styles.profileDropdownLink} role="menuitem">
                  Register
                </Link>
              </div>
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}
