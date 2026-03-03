'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

const ROLE_CLASS: Record<string, string> = {
  ADMIN:  styles.roleAdmin,
  SELLER: styles.roleSeller,
  BUYER:  styles.roleBuyer,
};

export default function AdminDashboardPage() {
  const queryClient = useQueryClient();

  const { data: stats, isLoading: loadingStats, isError: statsError } = useQuery<AdminStats>({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const { data } = await apiClient.get<AdminStats>('/admin/stats');
      return data;
    },
  });

  const { data: users = [], isLoading: loadingUsers, isError: usersError } = useQuery<User[]>({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data } = await apiClient.get<User[]>('/users');
      return data;
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      apiClient.patch(`/users/${id}`, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const STATS = [
    { label: 'Total Users',   value: stats?.totalUsers ?? 0 },
    { label: 'Total Sellers', value: stats?.totalSellers ?? 0 },
    { label: 'Total Orders',  value: stats?.totalOrders ?? 0 },
    { label: 'Total Revenue', value: `₱${Number(stats?.totalRevenue ?? 0).toFixed(2)}` },
  ];

  if (statsError || usersError) {
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
                    <button
                      type="button"
                      className={`${styles.actionBtn} ${user.isActive ? styles.suspendBtn : styles.activateBtn}`}
                      onClick={() => {
                        const action = user.isActive ? 'suspend' : 'activate';
                        if (window.confirm(`Are you sure you want to ${action} ${user.firstName} ${user.lastName}?`)) {
                          toggleMutation.mutate({ id: user.id, isActive: !user.isActive });
                        }
                      }}
                      disabled={toggleMutation.isPending}
                    >
                      {user.isActive ? 'Suspend' : 'Activate'}
                    </button>
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
