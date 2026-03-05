import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { serverFetch } from '@/lib/server-api';
import styles from '../orders.module.css';

interface Product { id: number; name: string; imageUrl?: string; seller?: { shopName: string }; }
interface Review { rating: number; comment?: string; }
interface OrderItem { id: number; quantity: number; price: string | number; orderItemStatus: string; product: Product; review?: Review | null; }
interface Address { barangay: { barangayName: string; city: { cityName: string } }; streetLine: string; }
interface UserAddress { address: Address; }
interface Payment { paymentStatus: string; paymentAmount: string | number; paymentMethod?: string; }
type OrderStatus = keyof typeof STATUS_CLASS;

interface Order {
  id: number;
  orderStatus: OrderStatus;
  totalAmount: string | number;
  shippingFee: string | number;
  orderDate: string;
  notes?: string;
  orderItems: OrderItem[];
  payment?: Payment;
  userAddress?: UserAddress;
}

const STATUS_CLASS = {
  Pending:   styles.statusPending,
  InTransit: styles.statusShipped,
  Completed: styles.statusCompleted,
} as const;

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
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

  const address = order.userAddress?.address;
  const fullAddress = address
    ? `${address.streetLine}, ${address.barangay.barangayName}, ${address.barangay.city.cityName}`
    : 'No address on file';

  return (
    <div className={styles.page}>
      <Link href="/orders" style={{ color: 'var(--color-primary)', fontWeight: 'var(--weight-bold)', textDecoration: 'none', display: 'inline-block', marginBottom: 'var(--space-6)' }}>
        ← Back to Orders
      </Link>

      <article className={styles.orderCard}>
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
              <div style={{ flex: 1 }}>
                <p className={styles.itemName}>{item.product.name}</p>
                <p className={styles.itemQty}>Qty: {item.quantity} · ₱{Number(item.price).toFixed(2)} each</p>
                {item.product.seller && (
                  <p className={styles.itemQty}>Sold by: {item.product.seller.shopName}</p>
                )}
                <p className={styles.itemQty}>Status: {item.orderItemStatus}</p>
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: 'var(--space-4) var(--space-6)', borderTop: '1px solid var(--color-card-border)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
            <strong>Delivery address:</strong> {fullAddress}
          </p>
          {order.notes && (
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
              <strong>Notes:</strong> {order.notes}
            </p>
          )}
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
            <strong>Shipping fee:</strong> ₱{Number(order.shippingFee).toFixed(2)}
          </p>
          {order.payment && (
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
              <strong>Payment:</strong> {order.payment.paymentStatus}
              {order.payment.paymentMethod ? ` · ${order.payment.paymentMethod}` : ''}
            </p>
          )}
        </div>
      </article>
    </div>
  );
}
