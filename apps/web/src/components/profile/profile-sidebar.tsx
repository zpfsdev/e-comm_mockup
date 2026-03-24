'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import styles from '@/app/(main)/profile/profile.module.css';

export function ProfileSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navItems = [
    { label: 'Profile', href: '/profile' },
    { label: 'Addresses', href: '/profile/addresses' },
    { label: 'My Orders', href: '/orders' },
  ];

  return (
    <aside className={styles.sidebar}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
        <div 
          style={{ 
            width: '40px', 
            height: '40px', 
            borderRadius: '50%', 
            overflow: 'hidden', 
            backgroundColor: 'var(--secondary-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--secondary-main)',
            fontWeight: 600,
            fontSize: '1.2rem',
            border: '2px solid white',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            flexShrink: 0
          }}
        >
          {user?.profilePictureUrl ? (
            <img
              src={user.profilePictureUrl}
              alt={user.firstName}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <span>{user?.firstName?.charAt(0).toUpperCase() || 'U'}</span>
          )}
        </div>
        <h3 className={styles.sidebarTitle} style={{ marginBottom: 0 }}>My Account</h3>
      </div>
      <nav className={styles.sidebarNav}>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.navItem} ${pathname === item.href ? styles.navItemActive : ''}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div style={{ marginTop: 'auto', paddingTop: 'var(--space-8)' }}>
        <button
          type="button"
          className={styles.navItem}
          onClick={logout}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
