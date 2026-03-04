'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Skeleton } from '@/components/ui/skeleton/skeleton';
import { SHIPPING_FEE } from '@/lib/constants';
import styles from './cart.module.css';

interface CartItem {
  id: number;
  quantity: number;
  product: { id: number; name: string; price: number; imageUrl?: string; stock?: number };
}

interface Cart {
  items: CartItem[];
}


export default function CartPage() {
  const queryClient = useQueryClient();
  const [mutatingIds, setMutatingIds] = useState<Set<number>>(new Set());

  function startMutating(productId: number): void {
    setMutatingIds((prev) => new Set(prev).add(productId));
  }

  function stopMutating(productId: number): void {
    setMutatingIds((prev) => {
      const next = new Set(prev);
      next.delete(productId);
      return next;
    });
  }

  const {
    data: cart,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery<Cart>({
    queryKey: ['cart'],
    queryFn: async () => {
      const { data } = await apiClient.get<Cart>('/cart');
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ productId, quantity }: { productId: number; quantity: number }) =>
      apiClient.patch(`/cart/items/${productId}`, { quantity }),
    onMutate: ({ productId }) => startMutating(productId),
    onSettled: (_data, _error, variables) => {
      stopMutating(variables.productId);
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (productId: number) => apiClient.delete(`/cart/items/${productId}`),
    onMutate: (productId) => startMutating(productId),
    onSettled: (_data, _error, productId) => {
      stopMutating(productId);
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  const subtotal =
    cart?.items.reduce((sum, item) => sum + item.quantity * Number(item.product.price), 0) ?? 0;
  const itemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  const total = subtotal + (itemCount > 0 ? SHIPPING_FEE : 0);

  if (isError) {
    return (
      <div className={styles.page}>
        <div className={styles.inner}>
          <div style={{ padding: 'var(--space-8)' }}>
            <p style={{ color: 'var(--color-error, #ef4444)', marginBottom: 'var(--space-3)' }}>
              Failed to load your cart. Please try again.
            </p>
            <button
              type="button"
              className={styles.retryBtn}
              onClick={() => refetch()}
              disabled={isFetching}
            >
              {isFetching ? 'Retrying…' : 'Retry'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.inner}>
          <Skeleton height="2.5rem" width="16rem" style={{ marginBottom: 'var(--space-8)' }} />
          <div className={styles.layout}>
            <div className={styles.itemList}>
              {[1, 2].map((i) => (
                <Skeleton
                  key={i}
                  height="7rem"
                  style={{ marginBottom: 'var(--space-4)', borderRadius: '15px' }}
                />
              ))}
            </div>
            <Skeleton height="16rem" style={{ borderRadius: '10px' }} />
          </div>
        </div>
      </div>
    );
  }

  if (!cart?.items.length) {
    return (
      <div className={styles.page}>
        <div className={styles.inner}>
          <div className={styles.headingRow}>
            <Link href="/products" className={styles.backBtn} aria-label="Back to products">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8l-4 4 4 4" />
                <line x1="16" y1="12" x2="8" y2="12" />
              </svg>
            </Link>
            <h1 className={styles.heading}>My Cart (0)</h1>
          </div>
          <div className={styles.emptyState}>
            <p className={styles.emptyText}>Your cart is empty. You haven&apos;t added anything yet.</p>
            <Link
              href="/products"
              className={styles.goShoppingBtn}
              aria-label="Go shopping and browse all products"
            >
              Go Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.headingRow}>
          <Link href="/products" className={styles.backBtn} aria-label="Back to products">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8l-4 4 4 4" />
              <line x1="16" y1="12" x2="8" y2="12" />
            </svg>
          </Link>
          <h1 className={styles.heading}>My Cart ({itemCount})</h1>
        </div>

        <div className={styles.layout}>
          <div className={styles.itemList}>
            {cart.items.map((item) => {
              const isMutating = mutatingIds.has(item.product.id);
              return (
                <div key={item.id} className={styles.cartItem}>
                  <div
                    className={styles.itemImage}
                    style={!item.product.imageUrl ? { background: 'var(--color-card-border)' } : undefined}
                  >
                    {item.product.imageUrl && (
                      <Image
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        width={104}
                        height={88}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-md)' }}
                      />
                    )}
                  </div>

                  <div className={styles.itemDetails}>
                    <span className={styles.itemName}>{item.product.name}</span>
                    {item.product.stock !== undefined && item.product.stock <= 5 && (
                      <span className={styles.itemStock}>{item.product.stock} items left</span>
                    )}
                  </div>

                  <div className={styles.itemRight}>
                    <span className={styles.itemPrice}>₱{Number(item.product.price).toFixed(2)}</span>
                    <div className={styles.qtyControls}>
                      <button
                        type="button"
                        className={styles.qtyBtn}
                        onClick={() =>
                          updateMutation.mutate({
                            productId: item.product.id,
                            quantity: item.quantity - 1,
                          })
                        }
                        disabled={item.quantity <= 1 || isMutating}
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className={styles.qtyValue}>{item.quantity}</span>
                      <button
                        type="button"
                        className={styles.qtyBtn}
                        onClick={() =>
                          updateMutation.mutate({
                            productId: item.product.id,
                            quantity: item.quantity + 1,
                          })
                        }
                        disabled={isMutating}
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      className={styles.removeBtn}
                      onClick={() => removeMutation.mutate(item.product.id)}
                      disabled={isMutating}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <aside className={styles.summary}>
            <h2 className={styles.summaryTitle}>Order Summary</h2>

            <div className={styles.summaryRow}>
              <span>Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
              <span>₱{subtotal.toFixed(2)}</span>
            </div>

            <div className={styles.summaryRow}>
              <span>Shipping Fee</span>
              <span>₱{SHIPPING_FEE.toFixed(2)}</span>
            </div>

            <div className={styles.summaryDivider} />

            <div className={styles.summaryTotal}>
              <span>Total</span>
              <span className={styles.summaryTotalAmount}>₱{total.toFixed(2)}</span>
            </div>

            <Link href="/checkout" className={styles.checkoutBtn}>
              Proceed to Checkout ({itemCount})
            </Link>
          </aside>
        </div>
      </div>
    </div>
  );
}
