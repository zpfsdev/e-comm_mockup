'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button/button';
import { Skeleton } from '@/components/ui/skeleton/skeleton';
import { ConfirmModal } from '@/components/ui/confirm-modal/confirm-modal';
import { ProductForm, type ProductData } from '@/components/seller/product-form';
import { SellerRecentOrderDto } from '@/types/seller';
import styles from './dashboard.module.css';

interface Product {
  id: number;
  name: string;
  price: number | string;
  stockQuantity?: number;
  category?: { categoryName: string } | string;
  ageRange?: { id: number; label: string } | null;
  status?: string;
  imageUrl?: string;
  description?: string;
  averageRating?: number;
  reviewCount?: number;
  categoryId?: number;
  ageRangeId?: number;
}

interface UpdateProductPayload {
  name?: string;
  description?: string;
  price?: number;
  stockQuantity?: number;
  imageUrl?: string;
}

interface SellerStats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: string;
  pendingOrders: number;
}

interface SellerDashboardDto {
  shopName: string;
  shopLogoUrl: string | null;
  stats: {
    products: number;
    totalCommission: string | null;
  };
  recentOrders: SellerRecentOrderDto[];
  recentCommissions: {
    id: number;
    amount: string;
    status: string;
    datePaid: Date | null;
    orderId: number;
    productName: string;
  }[];
}

function getStatus(err: unknown): number | undefined {
  return (err as AxiosError<unknown>)?.response?.status;
}

const fmt = new Intl.DateTimeFormat('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });

export default function SellerDashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [confirm, setConfirm] = useState<{
    title: string;
    description?: string;
    confirmLabel?: string;
    isDangerous?: boolean;
    onConfirm: () => void;
  } | null>(null);
  const [view, setView] = useState<'dashboard' | 'add_product' | 'edit_product'>('dashboard');
  const [selectedProduct, setSelectedProduct] = useState<ProductData | null>(null);

  const withConfirm = (opts: typeof confirm) => setConfirm(opts);
  const closeConfirm = () => setConfirm(null);

  const fmtDate = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const openEditOverlay = (p: Product) => {
    setSelectedProduct({
      id: p.id,
      name: p.name,
      description: p.description ?? '',
      price: p.price,
      stockQuantity: p.stockQuantity ?? 0,
      imageUrl: p.imageUrl ?? '',
      categoryId: p.categoryId,
      ageRangeId: p.ageRangeId ?? p.ageRange?.id,
    });
    setView('edit_product');
  };

  const openAddForm = () => {
    setSelectedProduct(null);
    setView('add_product');
  };

  const handleFormSuccess = () => {
    setView('dashboard');
    queryClient.invalidateQueries({ queryKey: ['seller-products'] });
    refetchProducts();
  };

  const { data: stats, isLoading: loadingStats, isError: statsError, error: statsErrorObj, refetch: refetchStats } = useQuery<SellerStats>({
    queryKey: ['seller-stats'],
    queryFn: async () => {
      const { data } = await apiClient.get<SellerStats>('/sellers/me/stats');
      return data;
    },
  });

  const { data: productsResponse, isLoading: loadingProducts, isError: productsError, error: productsErrorObj, refetch: refetchProducts } = useQuery<{ products: Product[]; total: number }>({
    queryKey: ['seller-products'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ products: Product[]; total: number }>('/products/mine');
      return data;
    },
  });

  const products = productsResponse?.products ?? [];

  const { data: dashboard, isLoading: loadingDashboard, refetch: refetchDashboard } = useQuery<SellerDashboardDto>({
    queryKey: ['seller-dashboard'],
    queryFn: async () => {
      const { data } = await apiClient.get<SellerDashboardDto>('/sellers/me/dashboard');
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/products/${id}`),
    onSuccess: () => {
      closeConfirm();
      queryClient.invalidateQueries({ queryKey: ['seller-products'] });
      toast.success('Product deleted successfully.');
    },
    onError: () => toast.error('Failed to delete product.'),
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'InTransit' | 'Cancelled' | 'Completed' }) =>
      apiClient.patch(`/orders/items/${id}/status`, { status }),
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['seller-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['seller-stats'] });
      refetchDashboard();
      refetchStats();
      refetchProducts();
      toast.success(`Order marked as ${status}.`);
    },
    onError: () => toast.error('Failed to update order status.'),
  });

  const STATS = [
    { label: 'Total Products', value: stats?.totalProducts ?? 0 },
    { label: 'Total Orders',   value: stats?.totalOrders ?? 0 },
    { label: 'Pending Orders', value: stats?.pendingOrders ?? 0 },
    { label: 'Monthly Sales',  value: `PHP ${Number(stats?.totalRevenue ?? 0).toFixed(2)}` },
  ];

  const sellerStatus = getStatus(statsErrorObj ?? productsErrorObj);
  if (sellerStatus === 404 || (sellerStatus === 403 && user?.roles.includes('Seller'))) {
    router.push('/seller/register');
    return null;
  }

  if (sellerStatus === 403) {
    return (
      <div className={styles.page}>
        <p style={{ color: 'var(--color-error, #ef4444)', padding: 'var(--space-8)', marginBottom: 'var(--space-4)' }}>
          Access denied. Seller account required.
        </p>
      </div>
    );
  }

  if (statsError || productsError) {
    return (
      <div className={styles.page}>
        <p style={{ color: 'var(--color-error, #ef4444)', padding: 'var(--space-8)' }}>
          Failed to load dashboard data. Please try again.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Confirm Modal */}
      <ConfirmModal
        open={!!confirm}
        title={confirm?.title ?? ''}
        description={confirm?.description}
        confirmLabel={confirm?.confirmLabel}
        isDangerous={confirm?.isDangerous}
        onConfirm={() => { confirm?.onConfirm(); closeConfirm(); }}
        onCancel={closeConfirm}
      />
      <div className={styles.pageHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-3)' }}>
          {/* Shop logo */}
          {dashboard?.shopLogoUrl ? (
            <img
              src={dashboard.shopLogoUrl.startsWith('/') ? dashboard.shopLogoUrl : `/${dashboard.shopLogoUrl}`}
              alt={dashboard.shopName ?? 'Shop logo'}
              width={52}
              height={52}
              style={{ borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-card-border)', flexShrink: 0 }}
            />
          ) : (
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '1.3rem', flexShrink: 0 }}>
              {(dashboard?.shopName ?? user?.username ?? 'S')[0].toUpperCase()}
            </div>
          )}
          <div>
            <h1 className={styles.heading} style={{ marginBottom: 0 }}>
              {dashboard?.shopName ?? 'Seller Dashboard'}
            </h1>
            <p className={styles.subheading} style={{ marginTop: 'var(--space-1)' }}>Manage your products and track your sales</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        {loadingStats
          ? STATS.map((_, i) => <Skeleton key={i} height="8rem" style={{ borderRadius: '15px' }} />)
          : STATS.map((s) => (
            <div key={s.label} className={styles.statCard}>
              <p className={styles.statLabel}>{s.label}</p>
              <p className={styles.statValue}>{s.value}</p>
            </div>
          ))
        }
      </div>

      {/* Content Rendering based on View */}
      {view === 'dashboard' && (
        <>
          {/* Products Table */}
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>My Products ({stats?.totalProducts ?? products.length})</h2>
            <div className={styles.headerActions}>
              <Button variant="primary" onClick={openAddForm}>
                Add Product
              </Button>
            </div>
          </div>

      {loadingProducts ? (
        <Skeleton height="16rem" />
      ) : !products.length ? (
        <p className={styles.empty}>No products found. Start by adding a product above.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Product ID</th>
                <th>Product Image</th>
                <th className={styles.leftAlign}>Product Name</th>
                <th className={styles.leftAlign}>Description</th>
                <th>Price</th>
                <th>Qty</th>
                <th>Category</th>
                <th>Age Range</th>
                <th>Rating</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const categoryName = typeof p.category === 'object' && p.category ? p.category.categoryName : String(p.category || '—');
                return (
                  <tr key={p.id}>
                    <td data-label="Product ID">P-{p.id.toString().padStart(4, '0')}</td>
                    <td data-label="Product Image">
                      {p.imageUrl ? (
                        <img src={p.imageUrl.startsWith('http') || p.imageUrl.startsWith('data:') || p.imageUrl.startsWith('/') ? p.imageUrl : `/${p.imageUrl}`} alt={p.name} width={60} height={60} className={styles.productImg} />
                      ) : (
                        <div className={styles.productImg} style={{ background: '#eee' }} />
                      )}
                    </td>
                    <td data-label="Product Name" className={`${styles.leftAlign} ${styles.productNameCell}`}>{p.name}</td>
                    <td data-label="Description" className={`${styles.leftAlign} ${styles.descriptionCell}`}>
                      {p.description ? (p.description.length > 60 ? p.description.substring(0, 60) + '...' : p.description) : '—'}
                    </td>
                    <td data-label="Price">PHP {Number(p.price).toFixed(2)}</td>
                    <td data-label="Qty">{p.stockQuantity ?? 0}</td>
                    <td data-label="Category">{categoryName}</td>
                    <td data-label="Age Range">{p.ageRange?.label ?? '—'}</td>
                    <td data-label="Rating">
                      {p.averageRating ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="#fbbf24" stroke="#fbbf24" strokeWidth="2">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                          </svg>
                          <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{p.averageRating}</span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>—</span>
                      )}
                    </td>
                    <td data-label="Status" className={p.status === 'Available' ? styles.statusActive : styles.statusInactive}>
                      {p.status === 'Available' ? 'Active' : 'Inactive'}
                    </td>
                    <td data-label="Action">
                      <div className={styles.actionGroup}>
                        {p.status === 'Available' && (
                          <button
                            className={`${styles.actionBtn} ${styles.btnUpdate}`}
                            onClick={() => openEditOverlay(p)}
                          >
                            Edit
                          </button>
                        )}
                        <button
                          className={`${styles.actionBtn} ${styles.btnDelete}`}
                          onClick={() => withConfirm({
                            title: 'Delete Product',
                            description: `Permanently delete product P-${p.id.toString().padStart(4,'0')} "${p.name}"? This cannot be undone.`,
                            confirmLabel: 'Delete',
                            isDangerous: true,
                            onConfirm: () => deleteMutation.mutate(p.id),
                          })}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Orders Table */}
      <div className={styles.sectionHeader} style={{ marginTop: 'var(--space-12)' }}>
        <h2 className={styles.sectionTitle}>Orders</h2>
      </div>

      {loadingDashboard ? (
        <Skeleton height="16rem" />
      ) : !dashboard?.recentOrders?.length ? (
        <p className={styles.empty}>No recent orders.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Product Image</th>
                <th className={styles.leftAlign}>Product</th>
                <th>Qty</th>
                <th className={styles.leftAlign}>Shipping Address</th>
                <th>Order Date</th>
                <th>Total</th>
                <th>Date Delivered</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.recentOrders.map((o) => {
                const isDisputed = o.orderItemStatus === 'Disputed';
                return (
                  <tr key={o.id}>
                    <td data-label="Customer">{o.customerName}</td>
                    <td data-label="Product Image">
                      {o.productImageUrl ? (
                        <img src={o.productImageUrl?.startsWith('/') ? o.productImageUrl : `/${o.productImageUrl}`} alt={o.productName} width={60} height={60} className={styles.productImg} />
                      ) : (
                        <div className={styles.productImg} style={{ background: '#eee' }} />
                      )}
                    </td>
                    <td data-label="Product" className={`${styles.leftAlign} ${styles.productNameCell}`}>{o.productName}</td>
                    <td data-label="Qty">{o.quantity}</td>
                    <td data-label="Shipping Address" className={`${styles.leftAlign} ${styles.descriptionCell}`}>{o.shippingAddress}</td>
                    <td data-label="Order Date">{fmt.format(new Date(o.orderDate))}</td>
                    <td data-label="Total">PHP {(Number(o.price) * o.quantity).toFixed(2)}</td>
                    <td data-label="Date Delivered">{o.dateDelivered ? fmt.format(new Date(o.dateDelivered)) : '—'}</td>
                    <td data-label="Status">
                      {isDisputed ? (
                        <span className={styles.statusDisputed}>Disputed</span>
                      ) : (
                        <span>{o.orderItemStatus}</span>
                      )}
                    </td>
                    <td data-label="Action">
                      {o.orderItemStatus === 'Pending' ? (
                        <div className={styles.actionGroup}>
                          <button
                            className={`${styles.actionBtn} ${styles.btnConfirm}`}
                            onClick={() => withConfirm({
                              title: 'Confirm Order',
                              description: `Mark order O-${o.id.toString().padStart(4,'0')} as In Transit?`,
                              confirmLabel: 'Confirm',
                              onConfirm: () => updateOrderStatusMutation.mutate({ id: o.id, status: 'InTransit' }),
                            })}
                            disabled={updateOrderStatusMutation.isPending}
                          >
                            Confirm
                          </button>
                          <button
                            className={`${styles.actionBtn} ${styles.btnDelete}`}
                            onClick={() => withConfirm({
                              title: 'Cancel Order',
                              description: `Cancel order O-${o.id.toString().padStart(4,'0')}? This cannot be undone.`,
                              confirmLabel: 'Cancel Order',
                              isDangerous: true,
                              onConfirm: () => updateOrderStatusMutation.mutate({ id: o.id, status: 'Cancelled' }),
                            })}
                            disabled={updateOrderStatusMutation.isPending}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : o.orderItemStatus === 'InTransit' ? (
                        <div className={styles.actionGroup}>
                          <button
                            className={`${styles.actionBtn} ${styles.btnConfirm}`}
                            onClick={() => withConfirm({
                              title: 'Mark as Delivered',
                              description: `Mark order O-${o.id.toString().padStart(4,'0')} as Completed?`,
                              confirmLabel: 'Mark Delivered',
                              onConfirm: () => updateOrderStatusMutation.mutate({ id: o.id, status: 'Completed' }),
                            })}
                            disabled={updateOrderStatusMutation.isPending}
                          >
                            Mark Delivered
                          </button>
                          <button
                            className={`${styles.actionBtn} ${styles.btnDelete}`}
                            onClick={() => withConfirm({
                              title: 'Cancel Order',
                              description: `Cancel order O-${o.id.toString().padStart(4,'0')} even though it's in transit?`,
                              confirmLabel: 'Cancel Order',
                              isDangerous: true,
                              onConfirm: () => updateOrderStatusMutation.mutate({ id: o.id, status: 'Cancelled' }),
                            })}
                            disabled={updateOrderStatusMutation.isPending}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className={styles.actionGroup}>
                          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>—</span>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Commission Ledger Table */}
      <div className={styles.sectionHeader} style={{ marginTop: 'var(--space-12)' }}>
        <h2 className={styles.sectionTitle}>Recent Commissions (Ledger)</h2>
      </div>

      {loadingDashboard ? (
        <Skeleton height="16rem" />
      ) : !dashboard?.recentCommissions?.length ? (
        <p className={styles.empty}>No commissions recorded yet.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Commission ID</th>
                <th>Order Ref</th>
                <th className={styles.leftAlign}>Product Segment</th>
                <th>Commission Amount</th>
                <th>Ledger Status</th>
                <th>Date Paid</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.recentCommissions.map((c) => (
                <tr key={c.id}>
                  <td data-label="Commission ID">C-{(c.id).toString().padStart(4, '0')}</td>
                  <td data-label="Order Ref">O-{(c.orderId).toString().padStart(4, '0')}</td>
                  <td data-label="Product Segment" className={`${styles.leftAlign} ${styles.productNameCell}`}>{c.productName}</td>
                  <td data-label="Commission Amount">PHP {Number(c.amount).toFixed(2)}</td>
                  <td data-label="Ledger Status" className={c.status === 'Paid' ? styles.statusActive : styles.statusPending}>
                    {c.status}
                  </td>
                  <td data-label="Date Paid">{c.datePaid ? fmtDate.format(new Date(c.datePaid)) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      </>)}

      {(view === 'add_product' || view === 'edit_product') && (
        <ProductForm 
          initialData={selectedProduct} 
          onCancel={() => setView('dashboard')} 
          onSuccess={handleFormSuccess} 
        />
      )}

    </div>
  );
}
