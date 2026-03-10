'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button/button';
import { Skeleton } from '@/components/ui/skeleton/skeleton';
import styles from './dashboard.module.css';

interface Product {
  id: number;
  name: string;
  price: number;
  stock?: number;
  category?: string;
}

interface SellerStats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
}

function getStatus(err: unknown): number | undefined {
  return (err as AxiosError<unknown>)?.response?.status;
}

export default function SellerDashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [confirmingDeleteProductId, setConfirmingDeleteProductId] = useState<number | null>(null);

  const { data: stats, isLoading: loadingStats, isError: statsError, error: statsErrorObj } = useQuery<SellerStats>({
    queryKey: ['seller-stats'],
    queryFn: async () => {
      const { data } = await apiClient.get<SellerStats>('/sellers/me/stats');
      return data;
    },
  });

  const { data: products = [], isLoading: loadingProducts, isError: productsError, error: productsErrorObj } = useQuery<Product[]>({
    queryKey: ['seller-products'],
    queryFn: async () => {
      const { data } = await apiClient.get<Product[]>('/products/mine');
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

  const STATS = [
    { label: 'Total Products', value: stats?.totalProducts ?? 0 },
    { label: 'Total Orders',   value: stats?.totalOrders ?? 0 },
    { label: 'Pending Orders', value: stats?.pendingOrders ?? 0 },
    { label: 'Total Revenue',  value: `₱${Number(stats?.totalRevenue ?? 0).toFixed(2)}` },
  ];

  const sellerStatus = getStatus(statsErrorObj ?? productsErrorObj);
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
          ? STATS.map((_, i) => <Skeleton key={i} height="6rem" style={{ borderRadius: 'var(--radius-xl)' }} />)
          : STATS.map((s) => (
            <div key={s.label} className={styles.statCard}>
              <p className={styles.statLabel}>{s.label}</p>
              <p className={styles.statValue}>{s.value}</p>
            </div>
          ))
        }
      </div>

      {/* Products */}
      <h2 className={styles.sectionTitle}>My Products</h2>
      <div className={styles.addBtn}>
        <Button variant="primary" onClick={() => router.push('/seller/products/new')}>
          + Add Product
        </Button>
      </div>

      {loadingProducts ? (
        <Skeleton height="12rem" />
      ) : !products.length ? (
        <p className={styles.empty}>No products yet. Add your first product above.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{p.category ?? '—'}</td>
                  <td>₱{Number(p.price).toFixed(2)}</td>
                  <td>{p.stock ?? '—'}</td>
                  <td style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    {confirmingDeleteProductId === p.id ? (
                      <div className={styles.confirmInline} role="group" aria-label="Confirm delete">
                        <span
                          className={styles.confirmText}
                          aria-live="polite"
                        >
                          Delete this product? This cannot be undone.
                        </span>
                        <button
                          type="button"
                          className={`${styles.actionBtn} ${styles.confirmDeleteBtn}`}
                          autoFocus
                          onClick={() => deleteMutation.mutate(p.id)}
                          disabled={deleteMutation.isPending}
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          className={`${styles.actionBtn} ${styles.cancelBtn}`}
                          onClick={() => setConfirmingDeleteProductId(null)}
                          disabled={deleteMutation.isPending}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className={`${styles.actionBtn} ${styles.deleteBtn}`}
                        onClick={() => setConfirmingDeleteProductId(p.id)}
                        disabled={deleteMutation.isPending}
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
