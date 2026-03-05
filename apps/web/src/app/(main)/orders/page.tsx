import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { serverFetch } from '@/lib/server-api';

import { OrdersError } from './orders-error';
import styles from './orders.module.css';

export const metadata: Metadata = {
  title: 'My Orders | Artistryx',
  description: 'View your Artistryx order history and track order status.',
};

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

interface OrdersResponse {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
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

export default async function OrdersPage() {
  let ordersResponse: OrdersResponse;

  try {
    ordersResponse = await serverFetch<OrdersResponse>('/orders');
  } catch {
    return <OrdersError />;
  }

  const orders = ordersResponse.orders;

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>My Orders</h1>
      {!orders.length ? (
        <p className={styles.empty}>You haven&apos;t placed any orders yet.</p>
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
                <span className={styles.orderId}>Order #{order.id}</span>
                <span className={styles.orderDate}>{formatDate(order.orderDate)}</span>
                <span
                  className={`${styles.statusBadge} ${STATUS_CLASS[order.orderStatus] ?? styles.statusPending}`}
                >
                  {order.orderStatus}
                </span>
                <span className={styles.orderTotal}>
                  ₱{Number(order.totalAmount).toFixed(2)}
                </span>
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
    </div>
  );
}
