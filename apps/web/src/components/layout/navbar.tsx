'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { CartBadge } from './cart-badge';
import styles from './navbar.module.css';

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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

  return (
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

        {/* Right side */}
        <div className={styles.actions}>
          {/* START SELLING — always visible unless seller/admin */}
          {!isAdmin && (
            isSeller ? (
              <Link href="/seller/dashboard" className={styles.sellBtn}>MY STORE</Link>
            ) : (
              <Link
                href={isAuthenticated ? '/seller/register' : '/auth/sign-in'}
                className={styles.sellBtn}
              >
                START SELLING
              </Link>
            )
          )}

          {/* Icon group: [seller/admin shortcut] · search · profile · cart */}
          <div className={styles.iconGroup}>
            {/* Seller dashboard shortcut — quick icon access to store management */}
            {isSeller && (
              <Link href="/seller/dashboard" className={styles.iconBtn} aria-label="Seller dashboard">
                <svg className={styles.icon} viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </Link>
            )}
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
              >
                <svg className={styles.icon} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              </button>
              {isSearchOpen && (
                <form className={styles.searchDropdown} onSubmit={handleSearchSubmit} role="search">
                  <input
                    type="search"
                    className={styles.searchInput}
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    aria-label="Search products"
                    autoFocus
                  />
                </form>
              )}
            </div>

            {/* Profile — hover + keyboard accessible */}
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
                onFocus={openMenu}
                onBlur={scheduleCloseMenu}
              >
                {initials ? (
                  <span className={styles.initials}>{initials}</span>
                ) : (
                  <svg className={styles.icon} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                )}
              </button>

              <div className={`${styles.dropdown} ${isMenuOpen ? styles.dropdownOpen : ''}`} role="menu" aria-label="Account options">
                <div className={styles.dropdownArrow} aria-hidden />
                <div className={styles.dropdownPanel}>
                  {isAuthenticated ? (
                    <>
                      <Link href="/profile" className={styles.dropdownItem} role="menuitem" onFocus={openMenu} onBlur={scheduleCloseMenu}>
                        My Profile
                      </Link>
                      <Link href="/orders" className={styles.dropdownItem} role="menuitem" onFocus={openMenu} onBlur={scheduleCloseMenu}>
                        My Orders
                      </Link>
                      {isSeller && (
                        <Link href="/seller/dashboard" className={styles.dropdownItem} role="menuitem" onFocus={openMenu} onBlur={scheduleCloseMenu}>
                          Seller Dashboard
                        </Link>
                      )}
                      {isAdmin && (
                        <Link href="/admin/dashboard" className={styles.dropdownItem} role="menuitem" onFocus={openMenu} onBlur={scheduleCloseMenu}>
                          Admin Dashboard
                        </Link>
                      )}
                      <div className={styles.dropdownDivider} />
                      <button type="button" className={styles.dropdownItem} role="menuitem" onClick={handleLogout} onFocus={openMenu} onBlur={scheduleCloseMenu}>
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link href="/auth/sign-in" className={styles.dropdownItem} role="menuitem" onFocus={openMenu} onBlur={scheduleCloseMenu}>
                        Sign In
                      </Link>
                      <div className={styles.dropdownDivider} />
                      <Link href="/auth/sign-up" className={styles.dropdownItem} role="menuitem" onFocus={openMenu} onBlur={scheduleCloseMenu}>
                        Register
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Cart — isolated client island; does not trigger full Navbar re-renders */}
            <CartBadge />
          </div>
        </div>
      </div>
    </nav>
  );
}
