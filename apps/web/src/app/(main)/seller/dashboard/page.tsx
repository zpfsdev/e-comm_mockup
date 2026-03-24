'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button/button';
import { Skeleton } from '@/components/ui/skeleton/skeleton';
import { SellerRecentOrderDto } from '@/types/seller';
import styles from './dashboard.module.css';

interface Product {
  id: number;
  name: string;
  price: number | string;
  stockQuantity?: number;
  category?: { categoryName: string } | string;
  ageRange?: { label: string } | null;
  status?: string;
  imageUrl?: string;
  description?: string;
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
}

function getStatus(err: unknown): number | undefined {
  return (err as AxiosError<unknown>)?.response?.status;
}

export default function SellerDashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [confirmingDeleteProductId, setConfirmingDeleteProductId] = useState<number | null>(null);

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
      setConfirmingDeleteProductId(null);
      queryClient.invalidateQueries({ queryKey: ['seller-products'] });
    },
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'InTransit' | 'Cancelled' | 'Completed' }) =>
      apiClient.patch(`/orders/items/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['seller-stats'] });
      // Force immediate refetch
      refetchDashboard();
      refetchStats();
      refetchProducts();
    },
  });

  const STATS = [
    { label: 'Total Products', value: stats?.totalProducts ?? 0 },
    { label: 'Total Orders',   value: stats?.totalOrders ?? 0 },
    { label: 'Pending Orders', value: stats?.pendingOrders ?? 0 },
    { label: 'Monthly Sales',  value: `₱ ${Number(stats?.totalRevenue ?? 0).toFixed(2)}` },
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
      <div className={styles.pageHeader}>
        <h1 className={styles.heading}>Seller Dashboard</h1>
        <p className={styles.subheading}>Manage your products and track your sales</p>
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

      {/* Products Table */}
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>My Products ({stats?.totalProducts ?? products.length})</h2>
        <div className={styles.headerActions}>
          <Button variant="primary" onClick={() => router.push('/seller/products/new')}>
            Add Products
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
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const categoryName = typeof p.category === 'object' && p.category ? p.category.categoryName : String(p.category || '—');
                return (
                  <tr key={p.id}>
                    <td>P-{p.id.toString().padStart(4, '0')}</td>
                    <td>
                      {p.imageUrl ? (
                        <img src={p.imageUrl.startsWith('/') ? p.imageUrl : `/${p.imageUrl}`} alt={p.name} width={60} height={60} className={styles.productImg} />
                      ) : (
                        <div className={styles.productImg} style={{ background: '#eee' }} />
                      )}
                    </td>
                    <td className={`${styles.leftAlign} ${styles.productNameCell}`}>{p.name}</td>
                    <td className={`${styles.leftAlign} ${styles.descriptionCell}`}>
                      {p.description ? (p.description.length > 60 ? p.description.substring(0, 60) + '...' : p.description) : '—'}
                    </td>
                    <td>₱ {Number(p.price).toFixed(2)}</td>
                    <td>{p.stockQuantity ?? 0}</td>
                    <td>{categoryName}</td>
                    <td>{p.ageRange?.label ?? '—'}</td>
                    <td className={p.status === 'Available' ? styles.statusActive : styles.statusInactive}>
                      {p.status === 'Available' ? 'Active' : 'Inactive'}
                    </td>
                    <td>
                      <div className={styles.actionGroup}>
                        {p.status === 'Available' && (
                          <button
                            className={`${styles.actionBtn} ${styles.btnUpdate}`}
                            onClick={() => router.push(`/seller/products/${p.id}/edit`)}
                          >
                            Update
                          </button>
                        )}
                        <button
                          className={`${styles.actionBtn} ${styles.btnDelete}`}
                          onClick={() => setConfirmingDeleteProductId(p.id)}
                        >
                          Delete Listing
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
              {dashboard.recentOrders.map((o) => (
                <tr key={o.id}>
                  <td>{o.customerName}</td>
                  <td>
                    {o.productImageUrl ? (
                      <img src={o.productImageUrl?.startsWith('/') ? o.productImageUrl : `/${o.productImageUrl}`} alt={o.productName} width={60} height={60} className={styles.productImg} />
                    ) : (
                      <div className={styles.productImg} style={{ background: '#eee' }} />
                    )}
                  </td>
                  <td className={`${styles.leftAlign} ${styles.productNameCell}`}>{o.productName}</td>
                  <td>{o.quantity}</td>
                  <td className={`${styles.leftAlign} ${styles.descriptionCell}`}>{o.shippingAddress}</td>
                  <td>{new Date(o.orderDate).toLocaleDateString()}</td>
                  <td>₱ {(Number(o.price) * o.quantity).toFixed(2)}</td>
                  <td>{o.dateDelivered ? new Date(o.dateDelivered).toLocaleDateString() : '—'}</td>
                  <td>{o.orderItemStatus}</td>
                  <td>
                    {o.orderItemStatus === 'Pending' ? (
                       <div className={styles.actionGroup}>
                         <button 
                           className={`${styles.actionBtn} ${styles.btnConfirm}`}
                           onClick={() => updateOrderStatusMutation.mutate({ id: o.id, status: 'InTransit' })}
                           disabled={updateOrderStatusMutation.isPending}
                         >
                           Confirm
                         </button>
                         <button 
                           className={`${styles.actionBtn} ${styles.btnDelete}`}
                           onClick={() => updateOrderStatusMutation.mutate({ id: o.id, status: 'Cancelled' })}
                           disabled={updateOrderStatusMutation.isPending}
                         >
                           Cancel
                         </button>
                       </div>
                    ) : o.orderItemStatus === 'InTransit' ? (
                       <div className={styles.actionGroup}>
                         <button 
                           className={`${styles.actionBtn} ${styles.btnConfirm}`}
                           onClick={() => updateOrderStatusMutation.mutate({ id: o.id, status: 'Completed' })}
                           disabled={updateOrderStatusMutation.isPending}
                         >
                           Mark as Delivered
                         </button>
                         <button 
                           className={`${styles.actionBtn} ${styles.btnDelete}`}
                           onClick={() => updateOrderStatusMutation.mutate({ id: o.id, status: 'Cancelled' })}
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
              ))}
            </tbody>
          </table>
        </div>
      )}

      {confirmingDeleteProductId !== null && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Delete Product Listing</h3>
              <button 
                type="button" 
                className={styles.modalCloseBtn} 
                onClick={() => setConfirmingDeleteProductId(null)}
              >
                &times;
              </button>
            </div>
            <div className={styles.modalBody}>
              <p>Are you sure you want to remove this listing? This will permanently delete the product <strong>P-{confirmingDeleteProductId?.toString().padStart(4, '0')}</strong> from your store. This action is irreversible.</p>
            </div>
            <div className={styles.modalActions}>
              <button 
                type="button" 
                className={styles.modalCancelBtn} 
                onClick={() => setConfirmingDeleteProductId(null)}
                disabled={deleteMutation.isPending}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className={styles.modalDeleteBtn} 
                onClick={() => deleteMutation.mutate(confirmingDeleteProductId)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
