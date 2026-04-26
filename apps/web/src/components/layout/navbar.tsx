'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { CartBadge } from './cart-badge';
import styles from './navbar.module.css';

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef<HTMLDivElement>(null);
  const menuCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      if (menuCloseTimer.current) clearTimeout(menuCloseTimer.current);
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutsideDropdown(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutsideDropdown);
    }
    return () => document.removeEventListener('mousedown', handleClickOutsideDropdown);
  }, [isMenuOpen]);

  function handleSearchSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  }

  const openMenu = useCallback(() => {
    if (menuCloseTimer.current) clearTimeout(menuCloseTimer.current);
    setIsMenuOpen(true);
  }, []);

  const scheduleCloseMenu = useCallback(() => {
    menuCloseTimer.current = setTimeout(() => setIsMenuOpen(false), 200);
  }, []);

  function handleLogout() {
    setIsMenuOpen(false);
    logout();
  }

  function handleDropdownKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'Tab') {
      setIsMenuOpen(false);
      return;
    }
    if (event.key === 'Escape') {
      setIsMenuOpen(false);
      dropdownRef.current?.querySelector<HTMLElement>('button')?.focus();
      return;
    }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const items = Array.from(
      dropdownRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [],
    );
    if (items.length === 0) return;
    const currentIndex = items.indexOf(document.activeElement as HTMLElement);
    let nextIndex: number;
    if (event.key === 'ArrowDown') nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
    else if (event.key === 'ArrowUp') nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
    else if (event.key === 'Home') nextIndex = 0;
    else nextIndex = items.length - 1;
    items[nextIndex]?.focus();
  }

  const isSeller = user?.roles?.includes('Seller');
  const isAdmin = user?.roles?.includes('Admin');
  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
    : '';

  if (pathname?.startsWith('/admin/dashboard')) {
    return (
      <nav className={styles.nav} aria-label="Admin navigation">
        <div className={styles.inner}>
          <Link href="/" className={styles.logo} aria-label="Artistryx home">
            <Image
              src="/logo.png"
              alt="Artistryx"
              width={280}
              height={90}
              priority
              className={styles.logoImage}
              style={{ height: 'auto' }}
            />
          </Link>
          <div className={styles.actions}>
            <button
              type="button"
              onClick={handleLogout}
              style={{
                backgroundColor: 'var(--color-primary)',
                color: 'white',
                border: 'none',
                padding: 'var(--space-2) var(--space-4)',
                borderRadius: 'var(--radius-md)',
                fontWeight: 600,
                fontSize: 'var(--text-sm)',
                cursor: 'pointer',
              }}
            >
              Log Out
            </button>
          </div>
        </div>
      </nav>
    );
  }

  if (pathname?.startsWith('/seller/dashboard')) {
    return (
      <nav className={styles.nav} aria-label="Seller navigation" style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--surface-primary)', height: '80px' }}>
        <div className={styles.inner} style={{ justifyContent: 'space-between', alignItems: 'center', height: '100%', maxWidth: 'var(--max-width-xl)' }}>
          
          {/* Logo on Left */}
          <Link href="/" className={styles.logo} aria-label="Artistryx home">
            <Image
              src="/logo.png"
              alt="Artistryx"
              width={140}
              height={45}
              priority
              className={styles.logoImage}
              style={{ height: 'auto' }}
            />
          </Link>

          {/* Grouped Group: Icon, Store Name, Back to Shopping Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <div 
                className={styles.userIcon} 
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
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              >
                {user?.seller?.shopLogoUrl || user?.profilePictureUrl ? (
                  <Image
                    src={user?.seller?.shopLogoUrl || user?.profilePictureUrl || ''}
                    alt={user.seller?.shopName || user.firstName}
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                ) : (
                  <span>{user?.firstName?.charAt(0).toUpperCase() || 'U'}</span>
                )}
              </div>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '1.25rem' }}>
                {user?.seller?.shopName || 'Seller Dashboard'}
              </span>
            </div>

            <Link href="/" style={{ 
              backgroundColor: '#7b715a', 
              color: 'white', 
              textDecoration: 'none', 
              fontSize: '1.25rem', 
              fontWeight: 600,
              padding: '12px 24px',
              borderRadius: '12px',
              display: 'inline-flex',
              alignItems: 'center',
              boxShadow: 'var(--shadow-sm)',
              transition: 'background-color 0.2s'
            }}>
              Back to Shopping
            </Link>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <>
    <nav className={styles.nav} aria-label="Main navigation">
      <div className={styles.inner}>
        {/* Logo */}
        <Link href="/" className={styles.logo} aria-label="Artistryx home">
          <Image
            src="/logo.png"
            alt="Artistryx"
            width={280}
            height={90}
            priority
            className={styles.logoImage}
            style={{ height: 'auto' }}
          />
        </Link>

        {/* Desktop right side */}
        <div className={styles.actions}>
          {/* START SELLING */}
          {!isAuthenticated ? (
            <Link href="/auth/sign-in" className={styles.sellBtn}>
              START SELLING
            </Link>
          ) : !isSeller ? (
            <Link href="/seller/register" className={styles.sellBtn}>
              START SELLING
            </Link>
          ) : user?.hasStore ? (
            <Link href="/seller/dashboard" className={styles.sellBtn}>
              MANAGE STORE
            </Link>
          ) : (
            <Link href="/seller/register" className={styles.sellBtn}>
              START SELLING
            </Link>
          )}

          {/* Icon group: [admin shortcut] · search · profile · cart */}
          <div className={styles.iconGroup}>
            {/* Admin dashboard shortcut */}
            {isAdmin && (
              <Link href="/admin/dashboard" className={styles.iconBtn} aria-label="Admin dashboard">
                <svg className={styles.icon} viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </Link>
            )}
            {/* Search */}
            <div ref={searchRef} className={styles.searchWrapper}>
              <button
                type="button"
                className={styles.iconBtn}
                onClick={() => setIsSearchOpen((prev) => !prev)}
                aria-label="Toggle search"
                aria-expanded={isSearchOpen}
                aria-controls="navbar-search-form"
              >
                <svg className={styles.icon} viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              </button>
              {isSearchOpen && (
                <form
                  id="navbar-search-form"
                  className={styles.searchDropdown}
                  onSubmit={handleSearchSubmit}
                  role="search"
                >
                  <input
                    type="search"
                    className={styles.searchInput}
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    aria-label="Search products"
                    autoFocus
                    onKeyDown={(event) => {
                      if (event.key === 'Escape') {
                        event.stopPropagation();
                        setIsSearchOpen(false);
                      }
                    }}
                  />
                </form>
              )}
            </div>

            {/* Profile — hover + keyboard accessible */}
            {isAuthenticated ? (
              <Link
                href="/profile"
                className={styles.iconBtn}
                aria-label="My Profile"
              >
                {user?.profilePictureUrl ? (
                  <img src={user.profilePictureUrl.startsWith('/') || user.profilePictureUrl.startsWith('http') ? user.profilePictureUrl : `/${user.profilePictureUrl}`} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <img src={`https://ui-avatars.com/api/?name=${user?.firstName || 'User'}+${user?.lastName || ''}&background=ff751f&color=fff&size=64`} alt="" style={{ width: 32, height: 32, borderRadius: '50%' }} />
                )}
              </Link>
            ) : (
              <div
                ref={dropdownRef}
                className={styles.dropdownWrapper}
                onMouseEnter={openMenu}
                onMouseLeave={scheduleCloseMenu}
                onKeyDown={handleDropdownKeyDown}
              >
                <button
                  type="button"
                  className={styles.iconBtn}
                  aria-haspopup="menu"
                  aria-expanded={isMenuOpen}
                  aria-label="Account menu"
                  onClick={() => setIsMenuOpen((prev) => !prev)}
                >
                  <svg className={styles.icon} viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </button>

                <div className={`${styles.dropdown} ${isMenuOpen ? styles.dropdownOpen : ''}`} role="menu" aria-label="Account options">
                  <div className={styles.dropdownArrow} aria-hidden />
                  <div className={styles.dropdownPanel}>
                    <Link href="/auth/sign-in" className={styles.dropdownItem} role="menuitem" onClick={() => setIsMenuOpen(false)}>
                      Sign In
                    </Link>
                    <div className={styles.dropdownDivider} />
                    <Link href="/auth/sign-up" className={styles.dropdownItem} role="menuitem" onClick={() => setIsMenuOpen(false)}>
                      Register
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Cart — isolated client island; does not trigger full Navbar re-renders */}
            <CartBadge />
          </div>
        </div>

        {/* Mobile hamburger button */}
        <button
          type="button"
          className={`${styles.hamburgerBtn} ${isMobileMenuOpen ? styles.hamburgerOpen : ''}`}
          onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          aria-label="Toggle mobile menu"
          aria-expanded={isMobileMenuOpen}
        >
          <span className={styles.hamburgerLine} />
          <span className={styles.hamburgerLine} />
          <span className={styles.hamburgerLine} />
        </button>
      </div>
    </nav>

    {/* Mobile slide-out menu */}
    {isMobileMenuOpen && (
      <div className={styles.mobileMenuBackdrop} onClick={() => setIsMobileMenuOpen(false)} />
    )}
    <div className={`${styles.mobileMenu} ${isMobileMenuOpen ? styles.mobileMenuOpen : ''}`}>
      <div className={styles.mobileMenuHeader}>
        <Link href="/" className={styles.logo} onClick={() => setIsMobileMenuOpen(false)}>
          <Image src="/logo.png" alt="Artistryx" width={140} height={45} className={styles.logoImage} style={{ height: 'auto' }} />
        </Link>
        <button type="button" className={styles.mobileMenuCloseBtn} onClick={() => setIsMobileMenuOpen(false)} aria-label="Close menu">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18" /><path d="m6 6 12 12" />
          </svg>
        </button>
      </div>

      {isAuthenticated ? (
        <>
          <Link href="/profile" className={styles.mobileMenuLink} onClick={() => setIsMobileMenuOpen(false)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
            My Profile
          </Link>
          <Link href="/orders" className={styles.mobileMenuLink} onClick={() => setIsMobileMenuOpen(false)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a4 4 0 0 0-8 0v2" /></svg>
            My Orders
          </Link>
          <Link href="/cart" className={styles.mobileMenuLink} onClick={() => setIsMobileMenuOpen(false)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>
            Cart
          </Link>
          {isSeller && user?.hasStore && (
            <Link href="/seller/dashboard" className={styles.mobileMenuLink} onClick={() => setIsMobileMenuOpen(false)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
              Seller Dashboard
            </Link>
          )}
          {isAdmin && (
            <Link href="/admin/dashboard" className={styles.mobileMenuLink} onClick={() => setIsMobileMenuOpen(false)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
              Admin Panel
            </Link>
          )}
          <button type="button" className={styles.mobileMenuLink} onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }} style={{ border: 'none', background: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
            Log Out
          </button>
        </>
      ) : (
        <>
          <Link href="/auth/sign-in" className={styles.mobileMenuLink} onClick={() => setIsMobileMenuOpen(false)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></svg>
            Sign In
          </Link>
          <Link href="/auth/sign-up" className={styles.mobileMenuLink} onClick={() => setIsMobileMenuOpen(false)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></svg>
            Register
          </Link>
        </>
      )}
    </div>
    </>
  );
}
