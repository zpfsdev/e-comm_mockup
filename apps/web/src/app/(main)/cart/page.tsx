'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Skeleton } from '@/components/ui/skeleton/skeleton';
import { SHIPPING_FEE } from '@/lib/constants';
import { useAuth } from '@/providers/auth-provider';
import type { Cart } from '@/types/cart';
import styles from './cart.module.css';
import { useRouter } from 'next/navigation';

export default function CartPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [mutatingIds, setMutatingIds] = useState<Set<number>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/sign-in?redirect=/cart');
    }
  }, [authLoading, isAuthenticated, router]);

  // Helper to get selected items total
  const getSelectedTotal = (items: any[]) => {
    return items
      .filter(item => selectedIds.has(item.id))
      .reduce((sum, item) => sum + item.quantity * Number(item.product.price), 0);
  };

  const getSelectedItemCount = (items: any[]) => {
    return items
      .filter(item => selectedIds.has(item.id))
      .reduce((sum, item) => sum + item.quantity, 0);
  };

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
      // Initialize selection with all items on first load
      if (selectedIds.size === 0 && data.items.length > 0) {
        setSelectedIds(new Set(data.items.map(i => i.id)));
      }
      return data;
    },
    enabled: !!user, // Only fetch if authenticated
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

  const { data: profile } = useQuery<{ address?: string }>({
    queryKey: ['cart-profile'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ address?: string }>('/users/profile');
      return data;
    },
  });

  const { data: addresses } = useQuery<any[]>({
    queryKey: ['addresses'],
    queryFn: async () => (await apiClient.get<any[]>('/users/addresses')).data,
    enabled: !!user,
  });

  // Automatically pick default address or first one
  useEffect(() => {
    if (addresses && addresses.length > 0 && selectedAddressId === null) {
      const def = addresses.find((a) => a.isDefault) || addresses[0];
      setSelectedAddressId(def.id);
    }
  }, [addresses, selectedAddressId]);

  const selectedAddress = addresses?.find((a) => a.id === selectedAddressId);

  const selectedSubtotal = getSelectedTotal(cart?.items ?? []);
  const selectedItemCount = getSelectedItemCount(cart?.items ?? []);
  const total = selectedSubtotal + (selectedItemCount > 0 ? SHIPPING_FEE : 0);

  // Group items by store
  const itemsByStore = useMemo(() => {
    if (!cart?.items) return {};
    return cart.items.reduce((acc, item) => {
      const storeName = item.product.seller?.shopName || 'Unknown Store';
      if (!acc[storeName]) acc[storeName] = [];
      acc[storeName].push(item);
      return acc;
    }, {} as Record<string, any[]>);
  }, [cart?.items]);

  const toggleSelectAll = () => {
    if (selectedIds.size === cart?.items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(cart?.items.map(i => i.id)));
    }
  };

  const toggleStore = (storeName: string, items: any[]) => {
    const storeIds = items.map(i => i.id);
    const allSelected = storeIds.every(id => selectedIds.has(id));
    const next = new Set(selectedIds);
    if (allSelected) {
      storeIds.forEach(id => next.delete(id));
    } else {
      storeIds.forEach(id => next.add(id));
    }
    setSelectedIds(next);
  };

  const toggleItem = (id: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  if (authLoading || (!isAuthenticated && !cart)) {
    return (
      <div className={styles.page}>
        <div style={{ display: 'flex', gap: '8px', padding: '16px' }}>
          <Skeleton width="48px" height="48px" style={{ borderRadius: '50%' }} />
          <div>
            <Skeleton width="200px" height="24px" style={{ marginBottom: '8px' }} />
            <Skeleton width="150px" height="16px" />
          </div>
        </div>
      </div>
    );
  }

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
            <p className={styles.emptyText}>
              {user
                ? "Your cart is empty. You haven't added anything yet."
                : "Please sign in to view or add items to your cart."}
            </p>
            <Link
              href={user ? "/products" : "/auth/sign-in?from=/cart"}
              className={styles.goShoppingBtn}
              aria-label={user ? "Go shopping" : "Sign in to your account"}
            >
              {user ? 'Go Shopping' : 'Sign In'}
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
          <h1 className={styles.heading}>My Cart ({cart.items.length})</h1>
        </div>

        <div className={styles.layout}>
          <div className={styles.itemList}>
            <div className={styles.selectAllBar}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={selectedIds.size === cart.items.length && cart.items.length > 0}
                  onChange={toggleSelectAll}
                  className={styles.checkbox}
                />
                Select All ({cart.items.length})
              </label>
            </div>

            {Object.entries(itemsByStore).map(([storeName, items]) => (
              <div key={storeName} className={styles.storeGroup} style={{ border: '1px solid var(--color-card-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: 'var(--space-6)', backgroundColor: 'var(--color-background)' }}>
                <div className={styles.storeHeader} style={{ backgroundColor: 'rgba(123, 113, 90, 0.05)', padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--color-card-border)', margin: 0 }}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={items.every(i => selectedIds.has(i.id))}
                      onChange={() => toggleStore(storeName, items)}
                      className={styles.checkbox}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7b715a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
                        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                        <path d="M15 22V12" />
                        <path d="M9 22V12" />
                        <path d="M2 7h20" />
                      </svg>
                      <span className={styles.storeNameText} style={{ fontSize: '1.1rem', fontWeight: 600 }}>{storeName}</span>
                    </div>
                  </label>
                </div>

                <div className={styles.storeItems}>
                  {items.map((item) => {
                    const isMutating = mutatingIds.has(item.product.id);
                    return (
                      <div key={item.id} className={styles.cartItem}>
                        <div className={styles.itemCheckWrap}>
                          <input
                            type="checkbox"
                            checked={selectedIds.has(item.id)}
                            onChange={() => toggleItem(item.id)}
                            className={styles.checkbox}
                          />
                        </div>

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
                          <span className={styles.itemPrice}>
                            ₱{Number(item.product.price).toFixed(2)}
                          </span>
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
                            aria-label={`Remove ${item.product.name} from cart`}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <aside className={styles.summary}>
            <h2 className={styles.summaryTitle}>Order Summary</h2>

            {/* Address overview */}
            <div className={styles.addressCard}>
              <div className={styles.addressHeader}>
                <span className={styles.addressLabel}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  Delivery Address
                </span>
                <Link href="/profile/addresses?returnUrl=/cart" className={styles.changeAddressBtn}>Manage</Link>
              </div>
              
              {addresses && addresses.length > 0 ? (
                <div className={styles.addressSelectorWrapper}>
                  <select 
                    className={styles.addressSelect}
                    value={selectedAddressId || ''}
                    onChange={(e) => setSelectedAddressId(Number(e.target.value))}
                  >
                    {addresses.map((addr) => (
                      <option key={addr.id} value={addr.id}>
                        {addr.addressType}: {addr.detailedAddress}, {addr.barangay}
                      </option>
                    ))}
                  </select>
                  {selectedAddress && (
                    <p className={styles.addressText} style={{ marginTop: 'var(--space-2)' }}>
                      <strong style={{ color: 'var(--color-text)' }}>{selectedAddress.fullName}</strong><br />
                      {selectedAddress.detailedAddress}, {selectedAddress.barangay}, {selectedAddress.city}, {selectedAddress.province}
                    </p>
                  )}
                </div>
              ) : (
                <div className={styles.noAddressWarning}>
                  <p className={styles.addressText} style={{ color: 'var(--color-error)' }}>
                    No delivery address found. Please add one to continue.
                  </p>
                  <Link href="/profile/addresses?returnUrl=/cart" className={styles.addAddressLink}>
                    + Add Address
                  </Link>
                </div>
              )}
            </div>

            <div className={styles.summaryRow}>
              <span>Subtotal ({selectedItemCount} {selectedItemCount === 1 ? 'item' : 'items'} selected)</span>
              <span>₱{selectedSubtotal.toFixed(2)}</span>
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

            <Link
              href={selectedIds.size > 0 && selectedAddressId ? `/checkout?items=${Array.from(selectedIds).join(',')}&addressId=${selectedAddressId}` : '#'}
              className={`${styles.checkoutBtn} ${(selectedIds.size === 0 || !selectedAddressId) ? styles.disabled : ''}`}
              onClick={(e) => (selectedIds.size === 0 || !selectedAddressId) && e.preventDefault()}
            >
              Proceed to Checkout ({selectedItemCount})
            </Link>
          </aside>
        </div>
      </div>
    </div>
  );
}
