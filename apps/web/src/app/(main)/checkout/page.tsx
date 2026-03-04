'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { apiClient } from '@/lib/api-client';
import { Input } from '@/components/ui/input/input';
import { Button } from '@/components/ui/button/button';
import { Skeleton } from '@/components/ui/skeleton/skeleton';
import { SHIPPING_FEE } from '@/lib/constants';
import styles from './checkout.module.css';

interface CartItem {
  id: number;
  quantity: number;
  product: { id: number; name: string; price: number; imageUrl?: string };
}

interface Cart { items: CartItem[]; }

interface DeliveryAddress {
  streetLine: string;
  barangay: string;
  city: string;
}

interface OrderPayload {
  items: { productId: number; quantity: number }[];
  deliveryAddress?: DeliveryAddress;
  userAddressId?: number;
  notes?: string;
}

interface AddressForm {
  streetLine: string;
  barangay: string;
  city: string;
  notes: string;
}


export default function CheckoutPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [address, setAddress] = useState<AddressForm>({ streetLine: '', barangay: '', city: '', notes: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    };
  }, []);

  const {
    data: cart,
    isLoading,
    isError: cartError,
    refetch,
    isFetching,
  } = useQuery<Cart>({
    queryKey: ['cart'],
    queryFn: async () => {
      const { data } = await apiClient.get<Cart>('/cart');
      return data;
    },
    staleTime: 0,
  });

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

  const items = cart?.items ?? [];
  const subtotal = items.reduce((sum, i) => sum + i.quantity * Number(i.product.price), 0);
  const total    = subtotal + SHIPPING_FEE;

  function handlePlaceOrder(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    mutation.mutate({
      items: items.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
      deliveryAddress: {
        streetLine: address.streetLine,
        barangay: address.barangay,
        city: address.city,
      },
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

  if (isLoading) {
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

  if (!items.length) {
    return (
      <div className={styles.page}>
        <h1 className={styles.heading}>Checkout</h1>
        <p className={styles.empty}>Your cart is empty. <Link href="/products" style={{ color: 'var(--color-primary)' }}>Browse products</Link></p>
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
              <h2 className={styles.cardTitle}>Order Items ({items.length})</h2>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.itemList}>
                {items.map((item) => (
                  <div key={item.id} className={styles.orderItem}>
                    <div
                      className={styles.itemImg}
                      style={!item.product.imageUrl ? { background: 'var(--color-card-border)' } : { position: 'relative' }}
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
          </div>

          {/* Delivery address */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Delivery Address</h2>
            </div>
            <div className={styles.cardBody}>
              <Input
                label="Street / House No."
                placeholder="123 Rizal St."
                value={address.streetLine}
                onChange={(e) => setAddress((p) => ({ ...p, streetLine: e.target.value }))}
                required
              />
              <div className={styles.row}>
                <Input
                  label="Barangay"
                  placeholder="Brgy. San Roque"
                  value={address.barangay}
                  onChange={(e) => setAddress((p) => ({ ...p, barangay: e.target.value }))}
                  required
                />
                <Input
                  label="City / Municipality"
                  placeholder="Legazpi City"
                  value={address.city}
                  onChange={(e) => setAddress((p) => ({ ...p, city: e.target.value }))}
                  required
                />
              </div>
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
