'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/providers/auth-provider';
import { apiClient } from '@/lib/api-client';
import styles from './navbar.module.css';

interface CartSummary {
  items: Array<{ quantity: number }>;
}

/** Isolated client component for the cart icon + count badge.
 *  Lives outside the main Navbar render cycle so a cart-count
 *  change does not re-render the full navigation tree. */
export function CartBadge() {
  const { isAuthenticated } = useAuth();

  const { data, isError } = useQuery<CartSummary>({
    queryKey: ['cart'],
    queryFn: async () => {
      const { data } = await apiClient.get<CartSummary>('/cart');
      return data;
    },
    enabled: isAuthenticated,
    staleTime: 30_000,
  });

  const cartCount = !isError
    ? data?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0
    : 0;

  return (
    <Link
      href="/cart"
      className={styles.iconBtn}
      aria-label={
        isError
          ? 'Shopping cart, count unavailable'
          : `Shopping cart${cartCount > 0 ? `, ${cartCount} items` : ''}`
      }
    >
      <svg className={styles.icon} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
      {isError ? (
        <span className={styles.cartBadge} aria-hidden>?</span>
      ) : (
        cartCount > 0 && (
          <span className={styles.cartBadge} aria-hidden>
            {cartCount > 99 ? '99+' : cartCount}
          </span>
        )
      )}
    </Link>
  );
}
