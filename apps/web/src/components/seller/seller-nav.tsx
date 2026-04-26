'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './seller-nav.module.css';

const NAV_LINKS = [
  { href: '/seller/dashboard', label: 'Dashboard' },
];

export function SellerNav() {
  const pathname = usePathname();
  return (
    <nav className={styles.nav} aria-label="Seller navigation">
      <div className={styles.inner}>
        <span className={styles.brand}>Seller Panel</span>
        <ul className={styles.links} role="list">
          {NAV_LINKS.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className={`${styles.link} ${pathname.startsWith(href) ? styles.active : ''}`}
                aria-current={pathname.startsWith(href) ? 'page' : undefined}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
