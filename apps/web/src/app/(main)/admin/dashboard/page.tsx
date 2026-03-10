'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { apiClient } from '@/lib/api-client';
import { Skeleton } from '@/components/ui/skeleton/skeleton';
import styles from './admin.module.css';

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
}

interface AdminStats {
  totalUsers: number;
  totalSellers: number;
  totalOrders: number;
  totalRevenue: number;
}

interface AdminUsersResponse {
  users: Array<{
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    status: string;
    userRoles: Array<{ role: { roleName: string } }>;
  }>;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const ROLE_CLASS: Record<string, string> = {
  Admin:    styles.roleAdmin,
  Seller:   styles.roleSeller,
  Customer: styles.roleBuyer,
};

function mapApiUserToUser(apiUser: AdminUsersResponse['users'][number]): User {
  const roleName = apiUser.userRoles[0]?.role?.roleName ?? 'Customer';
  return {
    id: apiUser.id,
    firstName: apiUser.firstName,
    lastName: apiUser.lastName,
    email: apiUser.email,
    role: roleName,
    isActive: apiUser.status === 'Active',
  };
}

function getResponseStatus(err: unknown): number | undefined {
  return (err as AxiosError<unknown>)?.response?.status;
}

export default function AdminDashboardPage() {
  const queryClient = useQueryClient();
  const [confirmingUserId, setConfirmingUserId] = useState<number | null>(null);

  const { data: stats, isLoading: loadingStats, isError: statsError, error: statsErrorObj } = useQuery<AdminStats>({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const { data } = await apiClient.get<AdminStats>('/admin/stats');
      return data;
    },
    retry: (_, error) => getResponseStatus(error) !== 403,
  });

  const { data: usersData, isLoading: loadingUsers, isError: usersError, error: usersErrorObj } = useQuery<AdminUsersResponse>({
    queryKey: ['admin-users', 1],
    queryFn: async () => {
      const { data } = await apiClient.get<AdminUsersResponse>('/admin/users', { params: { page: 1, limit: 50 } });
      return data;
    },
    retry: (_, error) => getResponseStatus(error) !== 403,
  });

  const users: User[] = usersData?.users?.map(mapApiUserToUser) ?? [];

  const toggleMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'Active' | 'Inactive' }) =>
      apiClient.patch(`/admin/users/${id}/status`, { status }),
    onSuccess: () => {
      setConfirmingUserId(null);
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  const STATS = [
    { label: 'Total Users',   value: stats?.totalUsers ?? 0 },
    { label: 'Total Sellers', value: stats?.totalSellers ?? 0 },
    { label: 'Total Orders',  value: stats?.totalOrders ?? 0 },
    { label: 'Total Revenue', value: `₱${Number(stats?.totalRevenue ?? 0).toFixed(2)}` },
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

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Admin Dashboard</h1>
      <p className={styles.subheading}>Platform overview and user management</p>

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

      {/* Users */}
      <h2 className={styles.sectionTitle}>User Management</h2>
      {loadingUsers ? (
        <Skeleton height="12rem" />
      ) : !users.length ? (
        <p className={styles.empty}>No users found.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.firstName} {user.lastName}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`${styles.roleBadge} ${ROLE_CLASS[user.role] ?? styles.roleBuyer}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>{user.isActive ? 'Active' : 'Suspended'}</td>
                  <td>
                    {confirmingUserId === user.id ? (
                      <div className={styles.confirmInline} role="group" aria-label="Confirm action">
                        <span
                          className={styles.confirmText}
                          aria-live="polite"
                        >
                          {user.isActive ? 'Suspend this user?' : 'Activate this user?'}
                        </span>
                        <button
                          type="button"
                          className={`${styles.actionBtn} ${styles.confirmBtn}`}
                          autoFocus
                          onClick={() => {
                            toggleMutation.mutate({
                              id: user.id,
                              status: user.isActive ? 'Inactive' : 'Active',
                            });
                          }}
                          disabled={toggleMutation.isPending}
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          className={`${styles.actionBtn} ${styles.cancelBtn}`}
                          onClick={() => setConfirmingUserId(null)}
                          disabled={toggleMutation.isPending}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className={`${styles.actionBtn} ${user.isActive ? styles.suspendBtn : styles.activateBtn}`}
                        onClick={() => setConfirmingUserId(user.id)}
                        disabled={toggleMutation.isPending}
                      >
                        {user.isActive ? 'Suspend' : 'Activate'}
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
