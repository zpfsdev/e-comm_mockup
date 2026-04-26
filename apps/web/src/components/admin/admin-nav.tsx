'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './admin-nav.module.css';

const NAV_LINKS = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/disputes',  label: 'Disputes'  },
  { href: '/admin/payouts',   label: 'Payouts'   },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className={styles.nav} aria-label="Admin navigation">
      <div className={styles.inner}>
        <span className={styles.brand}>Admin Panel</span>
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
