'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/providers/auth-provider';
import { apiClient } from '@/lib/api-client';
import styles from './navbar.module.css';

interface CartSummary {
  items: Array<{ quantity: number }>;
}

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

  const { data: cartData, isError: cartError } = useQuery<CartSummary>({
    queryKey: ['cart'],
    queryFn: async () => {
      const { data } = await apiClient.get<CartSummary>('/cart');
      return data;
    },
    enabled: isAuthenticated,
    staleTime: 30_000,
  });

  const cartCount = !cartError
    ? cartData?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0
    : 0;

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

          {/* Icon group: search · profile · cart */}
          <div className={styles.iconGroup}>
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

              <div className={`${styles.dropdown} ${isMenuOpen ? styles.dropdownOpen : ''}`} role="menu">
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

            {/* Cart */}
            <Link
              href="/cart"
              className={styles.iconBtn}
              aria-label={
                cartError
                  ? 'Shopping cart, count unavailable'
                  : `Shopping cart${cartCount > 0 ? `, ${cartCount} items` : ''}`
              }
            >
              <svg className={styles.icon} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              {cartError ? (
                <span className={styles.cartBadge} aria-hidden>
                  ?
                </span>
              ) : (
                cartCount > 0 && (
                  <span className={styles.cartBadge} aria-hidden>
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )
              )}
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
