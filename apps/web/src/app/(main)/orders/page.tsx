import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { serverFetch } from '@/lib/server-api';
import { ProfileSidebar } from '@/components/profile/profile-sidebar';
import profileStyles from '../profile/profile.module.css';

import { OrdersError } from './orders-error';
import { OrdersTabs } from './orders-tabs';
import styles from './orders.module.css';

export const metadata: Metadata = {
  title: 'My Orders | Artistryx',
  description: 'View your Artistryx order history and track order status.',
};

interface OrderItem {
  id: number;
  quantity: number;
  product: { 
    name: string; 
    imageUrl?: string;
    seller: { id: number; shopName: string };
  };
}

interface Order {
  id: number;
  orderStatus: OrderStatusKey;
  totalAmount: number;
  orderDate: string;
  orderItems: OrderItem[];
}

interface OrdersResponse {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const STATUS_CLASS: Record<string, string> = {
  Pending: styles.statusPending,
  InTransit: styles.statusShipped,
  Completed: styles.statusCompleted,
  Cancelled: styles.statusCancelled,
  ToReceive: styles.statusShipped, // Fallback
} as const;

type OrderStatusKey = string;

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  let ordersResponse: OrdersResponse;
  const { tab } = await searchParams;
  const activeTab = tab || 'all';

  try {
    const tabToStatus: Record<string, string> = {
      'to-pay': 'Pending',
      'to-ship': 'Pending',
      'to-receive': 'InTransit',
      completed: 'Completed',
      cancelled: 'Cancelled',
    };
    const statusFilter = tabToStatus[activeTab];
    const url = statusFilter ? `/orders?status=${statusFilter}` : '/orders';
    ordersResponse = await serverFetch<OrdersResponse>(url);
  } catch {
    return <OrdersError />;
  }

  const orders = ordersResponse.orders;

  return (
    <div className={profileStyles.page}>
      <div className={profileStyles.profileLayout}>
        <ProfileSidebar />

        <main className={profileStyles.mainContent} style={{ flex: 1 }}>
          <h1 className={profileStyles.heading}>My Orders</h1>

          {/* TABS */}
          <OrdersTabs activeTab={activeTab} />

          {!orders.length ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-20)', backgroundColor: 'var(--surface-secondary)', borderRadius: 'var(--radius-lg)' }}>
               <p className={styles.empty}>No orders found in this section.</p>
            </div>
          ) : (
            <div className={styles.orderList}>
              {orders.map((order) => (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className={styles.orderCard}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <div className={styles.orderHeader}>
                    <div className={styles.orderHeaderLeft}>
                      <span className={styles.orderId}>Order #{order.id}</span>
                      <span className={styles.orderDate}>{formatDate(order.orderDate)}</span>
                      {(() => {
                        const stores = new Set(order.orderItems.map(i => i.product.seller?.shopName || 'Unknown Store'));
                        const storeList = Array.from(stores).join(', ');
                        const packageCount = stores.size;
                        return (
                          <div className={styles.packageSummary}>
                            <span className={styles.packageBadge}>
                              {packageCount} {packageCount === 1 ? 'Package' : 'Packages'}
                            </span>
                            <span className={styles.storeListText}>
                              Store: {storeList}
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                    <div className={styles.orderHeaderRight}>
                      <span
                        className={`${styles.statusBadge} ${STATUS_CLASS[order.orderStatus] ?? styles.statusPending}`}
                      >
                        {order.orderStatus}
                      </span>
                      <span className={styles.orderTotal}>
                        ₱{Number(order.totalAmount).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className={styles.orderItems}>
                    {order.orderItems.map((item) => (
                      <div key={item.id} className={styles.orderItem}>
                        <div
                          className={styles.itemImg}
                          style={
                            !item.product.imageUrl
                              ? { background: 'var(--color-card-border)' }
                              : { position: 'relative' }
                          }
                        >
                          {item.product.imageUrl && (
                            <Image
                              src={item.product.imageUrl}
                              alt={item.product.name}
                              fill
                              sizes="4rem"
                              style={{
                                objectFit: 'cover',
                                borderRadius: 'var(--radius-md)',
                              }}
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
        </main>
      </div>
    </div>
  );
}
