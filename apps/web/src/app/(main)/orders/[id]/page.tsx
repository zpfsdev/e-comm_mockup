import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { serverFetch } from '@/lib/server-api';
import { ReviewButton } from './review-button';
import { DisputeButton } from './dispute-button';
import styles from '../orders.module.css';

interface Seller {
  id: number;
  shopName: string;
}

interface Product {
  id: number;
  name: string;
  imageUrl?: string;
  seller: Seller;
}

interface Review {
  rating: number;
  comment?: string;
}

interface OrderItem {
  id: number;
  quantity: number;
  price: string;
  orderItemStatus: string;
  product: Product;
  review?: Review | null;
}

interface OrderAddress {
  id: number;
  streetLine: string;
  postalCode: string;
  location: {
    cityName: string;
    barangayName: string;
  };
  provinceName: string;
}

interface Payment {
  paymentStatus: string;
  paymentAmount: string;
  paymentMethod?: string;
}

const STATUS_CLASS: Record<string, string> = {
  Pending: styles.statusPending,
  InTransit: styles.statusShipped,
  Completed: styles.statusCompleted,
  Cancelled: styles.statusCancelled,
  Disputed: styles.statusCancelled,
  RefundRequested: styles.statusCancelled,
  Refunded: styles.statusShipped,
} as const;

type OrderStatus = keyof typeof STATUS_CLASS;

interface Order {
  id: number;
  orderStatus: OrderStatus;
  totalAmount: string;
  shippingFee: string;
  orderDate: string;
  notes?: string;
  orderItems: OrderItem[];
  payment: Payment | null;
  userAddress: OrderAddress | null;
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Order #${id} | Artistryx`,
    description: 'Track and review your Artistryx order details.',
  };
}

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params;

  let order: Order;
  try {
    order = await serverFetch<Order>(`/orders/${id}`);
  } catch {
    notFound();
  }

  const userAddress = order.userAddress;
  const fullAddress = userAddress
    ? `${userAddress.streetLine}, ${userAddress.location.barangayName}, ${userAddress.location.cityName}, ${userAddress.provinceName}`
    : 'No address on file';

  // Group items by store
  const packages = order.orderItems.reduce((acc, item) => {
    const storeName = item.product.seller?.shopName || 'Unknown Store';
    if (!acc[storeName]) acc[storeName] = [];
    acc[storeName].push(item);
    return acc;
  }, {} as Record<string, OrderItem[]>);

  const packageCount = Object.keys(packages).length;

  const statuses = [
    { label: 'Order Placed', status: 'Pending', date: order.orderDate },
    { label: 'Shipped', status: 'InTransit', date: null },
    { label: 'Out for Delivery', status: 'InTransit', date: null },
    { label: 'Delivered', status: 'Completed', date: null },
  ];

  const currentStatusIndex = statuses.findIndex((s) => s.status === order.orderStatus);
  const activeStatuses = statuses.map((s, idx) => ({
    ...s,
    isDone:
      idx <=
      (currentStatusIndex === -1 ? (order.orderStatus === 'Completed' ? 3 : 0) : currentStatusIndex),
    isActive:
      idx ===
      (currentStatusIndex === -1 ? (order.orderStatus === 'Completed' ? 3 : 0) : currentStatusIndex),
  }));

  return (
    <div className={styles.page}>
      <Link
        href="/orders"
        style={{
          color: 'var(--color-primary)',
          fontWeight: 'var(--weight-bold)',
          textDecoration: 'none',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: 'var(--space-6)',
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        Back to Orders
      </Link>

      <article className={styles.orderCard}>
        <div className={styles.orderHeader}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span className={styles.orderId}>Order #{order.id}</span>
            <span className={styles.orderDate}>
              {new Date(order.orderDate).toLocaleDateString('en-PH', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <span
              className={`${styles.statusBadge} ${
                STATUS_CLASS[order.orderStatus] ?? styles.statusPending
              }`}
            >
              {order.orderStatus}
            </span>
            <span className={styles.orderTotal}>₱{Number(order.totalAmount).toFixed(2)}</span>
          </div>
        </div>

        {/* Timeline */}
        <div className={styles.timeline}>
          {activeStatuses.map((s, idx) => (
            <div key={idx} className={styles.timelineItem}>
              <div className={`${styles.timelineDot} ${s.isDone ? styles.timelineDotActive : ''}`} />
              <div className={styles.timelineContent}>
                <span
                  className={styles.timelineTitle}
                  style={{ color: s.isDone ? 'var(--color-text)' : 'var(--color-text-muted)' }}
                >
                  {s.label}
                </span>
                {s.date && <span className={styles.timelineDate}>{formatDate(s.date)}</span>}
              </div>
            </div>
          ))}
        </div>

        <div className={styles.orderItems}>
          {Object.entries(packages).map(([storeName, items], idx) => (
            <div key={storeName} className={styles.packageGroup}>
              <div className={styles.packageHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                    <path d="m3.3 7 8.7 5 8.7-5" />
                    <path d="M12 22V12" />
                  </svg>
                  <span className={styles.packageTitle}>
                    Package {idx + 1} of {packageCount}
                  </span>
                </div>
                <span className={styles.shippedBy}>Store: {storeName}</span>
              </div>
              <div className={styles.packageItems}>
                {items.map((item) => (
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
                          style={{ objectFit: 'cover', borderRadius: 'var(--radius-md)' }}
                        />
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p className={styles.itemName}>{item.product.name}</p>
                      <p className={styles.itemQty}>
                        Qty: {item.quantity} · ₱{Number(item.price).toFixed(2)} each
                      </p>
                      <p className={styles.itemQty} style={{ marginTop: 'var(--space-2)' }}>
                        <span className={`${styles.statusBadge} ${STATUS_CLASS[item.orderItemStatus] ?? styles.statusPending}`}>
                          {item.orderItemStatus}
                        </span>
                      </p>
                      {item.orderItemStatus === 'Completed' && (
                        <ReviewButton
                          orderItemId={item.id}
                          productName={item.product.name}
                          existingReview={item.review}
                        />
                      )}
                      <DisputeButton
                        orderItemId={item.id}
                        productName={item.product.name}
                        status={item.orderItemStatus}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            padding: 'var(--space-6)',
            borderTop: '1px solid var(--color-card-border)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'var(--space-6)',
          }}
        >
          <div>
            <h4
              style={{
                fontSize: 'var(--text-xs)',
                textTransform: 'uppercase',
                color: 'var(--color-text-muted)',
                marginBottom: 'var(--space-2)',
              }}
            >
              Delivery Address
            </h4>
            <p style={{ fontSize: 'var(--text-sm)' }}>{fullAddress}</p>
            {order.notes && (
              <p
                style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-text-muted)',
                  marginTop: 'var(--space-1)',
                }}
              >
                <em>"{order.notes}"</em>
              </p>
            )}
          </div>
          <div>
            <h4
              style={{
                fontSize: 'var(--text-xs)',
                textTransform: 'uppercase',
                color: 'var(--color-text-muted)',
                marginBottom: 'var(--space-2)',
              }}
            >
              Payment Method
            </h4>
            <p style={{ fontSize: 'var(--text-sm)' }}>
              {order.payment?.paymentMethod || 'Standard Payment'} ·{' '}
              <span style={{ color: 'var(--color-success)' }}>
                {order.payment?.paymentStatus || 'Verified'}
              </span>
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 'var(--space-8)',
                marginBottom: 'var(--space-1)',
              }}
            >
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                Shipping Fee
              </span>
              <span style={{ fontSize: 'var(--text-sm)' }}>
                ₱{Number(order.shippingFee).toFixed(2)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-8)' }}>
              <span style={{ fontSize: 'var(--text-base)', fontWeight: 600 }}>Total</span>
              <span
                style={{
                  fontSize: 'var(--text-base)',
                  fontWeight: 600,
                  color: 'var(--color-primary)',
                }}
              >
                ₱{Number(order.totalAmount).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
