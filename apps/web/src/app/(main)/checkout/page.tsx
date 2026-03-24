'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { apiClient } from '@/lib/api-client';
import { Input } from '@/components/ui/input/input';
import { Button } from '@/components/ui/button/button';
import { Skeleton } from '@/components/ui/skeleton/skeleton';
import { SHIPPING_FEE } from '@/lib/constants';
import { useAuth } from '@/providers/auth-provider';
import type { Cart } from '@/types/cart';
import styles from './checkout.module.css';

interface DeliveryAddress {
  streetLine: string;
  barangay: string;
  city: string;
}

interface OrderPayload {
  items: { productId: number; quantity: number }[];
  userAddressId?: number;
  notes?: string;
}

interface AddressForm {
  streetLine: string;
  barangay: string;
  city: string;
  notes: string;
}

interface UserProfile {
  firstName: string;
  lastName: string;
  contactNumber?: string;
  address?: string;
}


export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { user, isLoading: authLoading } = useAuth();
  
  const [address, setAddress] = useState<AddressForm>({ streetLine: '', barangay: '', city: '', notes: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [addressLoaded, setAddressLoaded] = useState(false);
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedItemIds = useMemo(() => {
    const items = searchParams.get('items');
    if (!items) return null;
    return new Set(items.split(',').map(Number));
  }, [searchParams]);

  // Fetch profile to potentially auto-fill the address
  const { data: profile } = useQuery<UserProfile>({
    queryKey: ['checkout-profile'],
    queryFn: async () => {
      const { data } = await apiClient.get<UserProfile>('/users/profile');
      return data;
    },
    enabled: !!user,
  });

  const { data: addresses, isLoading: addressesLoading } = useQuery<any[]>({
    queryKey: ['checkout-addresses'],
    queryFn: async () => (await apiClient.get('/users/addresses')).data,
    enabled: !!user,
  });

  const selectedAddress = useMemo(() => {
    const addrId = searchParams.get('addressId');
    if (addrId && addresses) {
      return addresses.find(a => a.id === Number(addrId));
    }
    return addresses?.find(a => a.isDefault) || addresses?.[0];
  }, [addresses, searchParams]);

  // Auto-fill address from profile if user hasn't modified it yet
  useEffect(() => {
    if (profile && !addressLoaded) {
      if (profile.address) {
        setAddress((prev) => ({
          ...prev,
          streetLine: prev.streetLine || profile.address || '',
        }));
      }
      setAddressLoaded(true);
    }
  }, [profile, addressLoaded]);

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    };
  }, []);

  const {
    data: cart,
    isLoading: cartLoading,
    isError: cartError,
    refetch,
    isFetching,
  } = useQuery<Cart>({
    queryKey: ['cart'],
    queryFn: async () => {
      const { data } = await apiClient.get<Cart>('/cart');
      return data;
    },
    enabled: !!user,
  });

  const displayItems = useMemo(() => {
    if (!cart?.items) return [];
    if (!selectedItemIds) return cart.items;
    return cart.items.filter(item => selectedItemIds.has(item.id));
  }, [cart?.items, selectedItemIds]);

  // Group items by store for packaging
  const packages = useMemo(() => {
    if (!displayItems.length) return {};
    return displayItems.reduce((acc, item) => {
      const storeName = item.product.seller?.shopName || 'Unknown Store';
      if (!acc[storeName]) acc[storeName] = [];
      acc[storeName].push(item);
      return acc;
    }, {} as Record<string, any[]>);
  }, [displayItems]);

  const packageCount = Object.keys(packages).length;

  const subtotal = useMemo(() => {
    return displayItems.reduce(
      (sum, item) => sum + item.quantity * Number(item.product.price),
      0,
    );
  }, [displayItems]);

  const total = subtotal + (displayItems.length > 0 ? SHIPPING_FEE : 0);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/sign-in?from=/checkout');
    }
  }, [authLoading, user, router]);

  const mutation = useMutation({
    mutationFn: (payload: OrderPayload) => apiClient.post('/orders', payload),
    onSuccess: () => {
      setSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      redirectTimerRef.current = setTimeout(() => router.push('/orders'), 2500);
    },
    onError: (err: AxiosError<{ message?: string }>) => {
      setError(err.response?.data?.message ?? 'Failed to place order. Please try again.');
    },
  });

  function handlePlaceOrder(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    
    if (!selectedAddress) {
      setError('Please add a delivery address in your profile first.');
      return;
    }

    mutation.mutate({
      items: displayItems.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
      userAddressId: selectedAddress.id,
      notes: address.notes || undefined,
    });
  }

  if (cartError) {
    return (
      <div className={styles.page}>
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
    );
  }

  if (authLoading || cartLoading || addressesLoading) {
    return (
      <div className={styles.page}>
        <Skeleton height="2.5rem" width="12rem" />
        <div style={{ marginTop: 'var(--space-8)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Skeleton height="12rem" style={{ borderRadius: 'var(--radius-xl)' }} />
          <Skeleton height="10rem" style={{ borderRadius: 'var(--radius-xl)' }} />
        </div>
      </div>
    );
  }

  if (!displayItems.length && !cartLoading && !isFetching) {
    return (
      <div className={styles.page}>
        <h1 className={styles.heading}>Checkout</h1>
        <p className={styles.empty}>No items selected for checkout. <Link href="/cart" style={{ color: 'var(--color-primary)' }}>Back to cart</Link></p>
      </div>
    );
  }

  if (success) {
    return (
      <div className={styles.page}>
        <div className={styles.successBanner}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', color: 'var(--color-success)', marginBottom: 'var(--space-2)' }}>
            Order placed!
          </p>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
            Redirecting to your orders…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Checkout</h1>
      <div className={styles.layout}>
        {/* Left column — give the form an id so the submit button can reference it */}
        <form id="order-form" onSubmit={handlePlaceOrder}>
          {/* Items preview */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Order Items ({displayItems.length})</h2>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.itemList}>
                {Object.entries(packages).map(([storeName, storeItems], idx) => (
                  <div key={storeName} className={styles.packageGroup} style={{ border: '1px solid var(--color-card-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: 'var(--space-4)' }}>
                    <div className={styles.packageHeader} style={{ backgroundColor: 'rgba(123, 113, 90, 0.05)', padding: 'var(--space-3) var(--space-4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-card-border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7b715a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                          <path d="m3.3 7 8.7 5 8.7-5" />
                          <path d="M12 22V12" />
                        </svg>
                        <span className={styles.packageTitle} style={{ color: '#7b715a', fontWeight: 600 }}>Package {idx + 1} of {packageCount}</span>
                      </div>
                      <span className={styles.shippedBy} style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-primary)' }}>Store: {storeName}</span>
                    </div>
                    <div className={styles.packageItems}>
                      {storeItems.map((item) => (
                        <div key={item.id} className={styles.checkoutItem}>
                          <div
                            className={styles.itemImg}
                            style={!item.product.imageUrl ? { background: 'var(--color-card-border)' } : { position: 'relative', width: '3.5rem', height: '3.5rem', flexShrink: 0 }}
                          >
                            {item.product.imageUrl && (
                              <Image
                                src={item.product.imageUrl}
                                alt={item.product.name}
                                fill
                                sizes="4rem"
                                style={{ objectFit: 'cover', borderRadius: 'var(--radius-md)' }}
                              />
                            )}
                          </div>
                          <div style={{ flex: 1 }}>
                            <p className={styles.itemName}>{item.product.name}</p>
                            <p className={styles.itemMeta}>
                              Qty: {item.quantity} · ₱{Number(item.product.price).toFixed(2)} each
                            </p>
                          </div>
                          <p style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-sm)' }}>
                            ₱{(item.quantity * Number(item.product.price)).toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Delivery address */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>
                Delivery Address {selectedAddress?.isDefault && <span style={{ fontSize: 'var(--text-xs)', verticalAlign: 'middle', marginLeft: 'var(--space-2)', padding: '2px 8px', backgroundColor: 'rgba(123, 113, 90, 0.1)', color: '#7b715a', borderRadius: '4px', border: '1px solid #7b715a' }}>Default</span>}
              </h2>
            </div>
            <div className={styles.cardBody}>
              {selectedAddress ? (
                <div style={{ marginBottom: 'var(--space-2)' }}>
                  <p style={{ fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-1)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    {selectedAddress.fullName}
                  </p>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-1)' }}>{selectedAddress.phoneNumber}</p>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', lineHeight: 1.5 }}>
                    {selectedAddress.detailedAddress}, {selectedAddress.barangay}, {selectedAddress.city}, {selectedAddress.province}
                  </p>
                </div>
              ) : (
                <div style={{ marginBottom: 'var(--space-6)', textAlign: 'center', padding: 'var(--space-4)', border: '1px dashed var(--color-card-border)', borderRadius: 'var(--radius-md)' }}>
                  <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-3)' }}>No addresses found.</p>
                  <Link href="/profile/addresses?returnUrl=/checkout" style={{ color: 'var(--color-primary)', fontWeight: 'var(--weight-bold)' }}>
                    + Add Address
                  </Link>
                </div>
              )}

              <Input
                label="Order Notes (optional)"
                placeholder="Leave at the door, call upon arrival…"
                value={address.notes}
                onChange={(e) => setAddress((p) => ({ ...p, notes: e.target.value }))}
              />
            </div>
          </div>

          {error && <p role="alert" className={styles.errorBanner}>{error}</p>}
        </form>

        {/* Summary sidebar — button uses form="order-form" to submit the form above */}
        <aside className={styles.summary}>
          <h2 className={styles.summaryTitle}>Summary</h2>
          <div className={styles.summaryRow}>
            <span>Subtotal</span>
            <span>₱{subtotal.toFixed(2)}</span>
          </div>
          <div className={styles.summaryRow}>
            <span>Shipping fee</span>
            <span>₱{SHIPPING_FEE.toFixed(2)}</span>
          </div>
          <div className={styles.summaryDivider} />
          <div className={styles.summaryTotal}>
            <span>Total</span>
            <span>₱{total.toFixed(2)}</span>
          </div>
          <Button
            variant="primary"
            full
            type="submit"
            form="order-form"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Placing order…' : 'Place Order'}
          </Button>
          <Link href="/cart" className={styles.editCartLink}>
            ← Edit cart
          </Link>
        </aside>
      </div>
    </div>
  );
}
