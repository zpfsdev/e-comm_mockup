'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Skeleton } from '@/components/ui/skeleton/skeleton';
import styles from './orders.module.css';

interface OrderItem {
  id: number;
  quantity: number;
  product: { name: string; imageUrl?: string };
}

interface Order {
  id: number;
  orderStatus: OrderStatusKey;
  totalAmount: number;
  orderDate: string;
  orderItems: OrderItem[];
}

const STATUS_CLASS = {
  Pending: styles.statusPending,
  Completed: styles.statusCompleted,
  InTransit: styles.statusShipped,
} as const;

type OrderStatusKey = keyof typeof STATUS_CLASS;

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function OrdersPage() {
  const {
    data: ordersResponse,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ orders: Order[]; total: number; page: number; limit: number; totalPages: number }>('/orders');
      return data;
    },
  });
  const orders = ordersResponse?.orders ?? [];

  if (isError) {
    return (
      <div className={styles.page}>
        <div style={{ padding: 'var(--space-8)' }}>
          <p style={{ color: 'var(--color-error, #ef4444)', marginBottom: 'var(--space-3)' }}>
            Failed to load your orders. Please try again.
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
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} height="8rem" style={{ borderRadius: 'var(--radius-xl)' }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>My Orders</h1>
      {!orders.length ? (
        <p className={styles.empty}>You haven&apos;t placed any orders yet.</p>
      ) : (
        <div className={styles.orderList}>
          {orders.map((order) => (
            <Link key={order.id} href={`/orders/${order.id}`} className={styles.orderCard} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className={styles.orderHeader}>
                <span className={styles.orderId}>Order #{order.id}</span>
                <span className={styles.orderDate}>{formatDate(order.orderDate)}</span>
                <span className={`${styles.statusBadge} ${STATUS_CLASS[order.orderStatus] ?? styles.statusPending}`}>
                  {order.orderStatus}
                </span>
                <span className={styles.orderTotal}>₱{Number(order.totalAmount).toFixed(2)}</span>
              </div>
              <div className={styles.orderItems}>
                {order.orderItems.map((item) => (
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
                    <div>
                      <p className={styles.itemName}>{item.product.name}</p>
                      <p className={styles.itemQty}>Qty: {item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
