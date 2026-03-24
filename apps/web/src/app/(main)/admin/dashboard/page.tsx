'use client';

import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { apiClient } from '@/lib/api-client';
import { Skeleton } from '@/components/ui/skeleton/skeleton';
import styles from './admin.module.css';

interface AdminStats {
  totalUsers: number;
  totalSellers: number;
  totalOrders: number;
  totalProducts: number;
}

interface AdminUser {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  contactNumber: string | null;
  status: string;
  dateTimeRegistered: string;
  lastLogin: string | null;
  userRoles: { role: { roleName: string } }[];
}

interface AdminShop {
  id: number;
  shopName: string;
  shopLogoUrl: string | null;
  shopDescription: string;
  shopStatus: string;
  registeredAt: string;
  user: {
    firstName: string;
    lastName: string;
  };
}

interface PaginatedUsersResponse {
  users: AdminUser[];
  total: number;
}

interface PaginatedShopsResponse {
  shops: AdminShop[];
  total: number;
}

function getResponseStatus(err: unknown): number | undefined {
  return (err as AxiosError<unknown>)?.response?.status;
}

export default function AdminDashboardPage() {
  const queryClient = useQueryClient();

  const { data: stats, isLoading: loadingStats, isError: statsError, error: statsErrorObj } = useQuery<AdminStats>({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const { data } = await apiClient.get<AdminStats>('/admin/stats');
      return data;
    },
    retry: (_, error) => getResponseStatus(error) !== 403,
  });

  const { data: usersData, isLoading: loadingUsers, isError: usersError, error: usersErrorObj } = useQuery<PaginatedUsersResponse>({
    queryKey: ['admin-users', 1],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedUsersResponse>('/admin/users', { params: { page: 1, limit: 50 } });
      return data;
    },
    retry: (_, error) => getResponseStatus(error) !== 403,
  });

  const { data: shopsData, isLoading: loadingShops } = useQuery<PaginatedShopsResponse>({
    queryKey: ['admin-shops', 1],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedShopsResponse>('/admin/shops', { params: { page: 1, limit: 50 } });
      return data;
    },
    retry: (_, error) => getResponseStatus(error) !== 403,
  });

  const users = usersData?.users ?? [];
  const shops = shopsData?.shops ?? [];

  const STATS = [
    { label: 'Total Users',    value: stats?.totalUsers ?? 0 },
    { label: 'Total Sellers',  value: stats?.totalSellers ?? 0 },
    { label: 'Monthly Orders', value: stats?.totalOrders ?? 0 },
    { label: 'Total Products', value: stats?.totalProducts ?? 0 },
  ];

  const isForbidden = getResponseStatus(statsErrorObj ?? usersErrorObj) === 403;
  if (isForbidden) {
    return (
      <div className={styles.page}>
        <p style={{ color: 'var(--color-error)', padding: 'var(--space-8)', marginBottom: 'var(--space-4)' }}>
          Access denied. Admin role required.
        </p>
        <Link href="/" className={styles.accessDeniedLink}>Return to home</Link>
      </div>
    );
  }
  if (statsError || usersError) {
    return (
      <div className={styles.page}>
        <p style={{ color: 'var(--color-error)', padding: 'var(--space-8)' }}>
          Failed to load dashboard data. Please try again.
        </p>
      </div>
    );
  }

  const formatLastLogin = (dateString: string | null) => {
    if (!dateString) return '—';
    try {
      const msPerMinute = 60 * 1000;
      const msPerHour = msPerMinute * 60;
      const msPerDay = msPerHour * 24;
      const msPerMonth = msPerDay * 30;
      const msPerYear = msPerDay * 365;

      const elapsed = Date.now() - new Date(dateString).getTime();

      if (elapsed < msPerMinute) return Math.round(elapsed / 1000) + ' seconds ago';
      if (elapsed < msPerHour) return Math.round(elapsed / msPerMinute) + ' minutes ago';
      if (elapsed < msPerDay) return Math.round(elapsed / msPerHour) + ' hours ago';
      if (elapsed < msPerMonth) return Math.round(elapsed / msPerDay) + ' days ago';
      if (elapsed < msPerYear) return Math.round(elapsed / msPerMonth) + ' months ago';
      return Math.round(elapsed / msPerYear) + ' years ago';
    } catch {
      return '—';
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      const pad = (n: number) => n.toString().padStart(2, '0');
      const date = new Date(dateString);
      const hours = date.getHours();
      const minutes = pad(date.getMinutes());
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const formattedHours = pad(hours % 12 || 12);
      const year = date.getFullYear();
      const month = pad(date.getMonth() + 1);
      const day = pad(date.getDate());
      return `${year}-${month}-${day},\n${formattedHours}:${minutes} ${ampm}`;
    } catch {
      return dateString;
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.heading}>Admin Dashboard</h1>
        <p className={styles.subheading}>Platform Overview and user management</p>
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

      {/* User Management */}
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>User Management</h2>
      </div>
      {loadingUsers ? (
        <Skeleton height="16rem" />
      ) : !users.length ? (
        <p className={styles.empty}>No users found.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>User ID</th>
                <th>Username</th>
                <th className={styles.leftAlign}>Name</th>
                <th className={styles.leftAlign}>Email</th>
                <th>Contact No.</th>
                <th>Reg. Date</th>
                <th>Last Login</th>
                <th>Role</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const roleName = user.userRoles[0]?.role?.roleName ?? 'Customer';
                return (
                  <tr key={user.id}>
                    <td>U-{user.id.toString().padStart(4, '0')}</td>
                    <td>{user.username}</td>
                    <td className={styles.leftAlign}>{user.firstName} {user.lastName}</td>
                    <td className={styles.leftAlign}>{user.email}</td>
                    <td>{user.contactNumber ?? '—'}</td>
                    <td style={{ whiteSpace: 'pre-wrap' }}>{formatDateTime(user.dateTimeRegistered)}</td>
                    <td>{formatLastLogin(user.lastLogin)}</td>
                    <td>
                      <span className={styles.roleBadge}>
                        {roleName}
                      </span>
                    </td>
                    <td className={user.status === 'Active' ? styles.statusActive : styles.statusInactive}>
                      {user.status === 'Active' ? 'Active' : 'Suspended'}
                    </td>
                    <td>
                      <div className={styles.actionGroup}>
                        <button className={`${styles.actionBtn} ${styles.btnArchive}`}>
                          Archive
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

      {/* Shop Management */}
      <div className={styles.sectionHeader} style={{ marginTop: 'var(--space-12)' }}>
        <h2 className={styles.sectionTitle}>Shop Management</h2>
      </div>
      {loadingShops ? (
        <Skeleton height="16rem" />
      ) : !shops.length ? (
        <p className={styles.empty}>No shops found.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Shop ID</th>
                <th>Shop Logo</th>
                <th>Shop Name</th>
                <th className={styles.leftAlign}>Shop Description</th>
                <th>Reg. Date</th>
                <th>Seller Name</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {shops.map((shop) => (
                <tr key={shop.id}>
                  <td>S-{shop.id.toString().padStart(4, '0')}</td>
                  <td>
                    {shop.shopLogoUrl ? (
                      <img src={shop.shopLogoUrl?.startsWith('/') ? shop.shopLogoUrl : `/${shop.shopLogoUrl}`} alt={shop.shopName} width={60} height={60} className={styles.shopImg} />
                    ) : (
                      <div className={styles.shopImg} style={{ background: '#eee' }} />
                    )}
                  </td>
                  <td>{shop.shopName}</td>
                  <td className={`${styles.leftAlign} ${styles.descriptionCell}`}>
                    {shop.shopDescription ? (shop.shopDescription.length > 80 ? shop.shopDescription.substring(0, 80) + '...' : shop.shopDescription) : '—'}
                  </td>
                  <td style={{ whiteSpace: 'pre-wrap' }}>{formatDateTime(shop.registeredAt)}</td>
                  <td>{shop.user.firstName} {shop.user.lastName}</td>
                  <td className={shop.shopStatus === 'Active' ? styles.statusActive : styles.statusInactive}>
                    {shop.shopStatus === 'Active' ? 'Active' : shop.shopStatus}
                  </td>
                  <td>
                    <div className={styles.actionGroup}>
                      <button className={`${styles.actionBtn} ${styles.btnArchive}`}>
                        Archive
                      </button>
                    </div>
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
