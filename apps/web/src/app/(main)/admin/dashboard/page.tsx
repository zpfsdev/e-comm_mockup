'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';
import { apiClient } from '@/lib/api-client';
import { Skeleton } from '@/components/ui/skeleton/skeleton';
import { ConfirmModal } from '@/components/ui/confirm-modal/confirm-modal';
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

interface DisputedItem {
  id: number;
  quantity: number;
  price: string;
  orderItemStatus: string;
  dateDelivered: string | null;
  product: {
    id: number;
    name: string;
    imageUrl?: string;
    seller: { id: number; shopName: string };
  };
  order: {
    id: number;
    userId: number;
    user: { firstName: string; lastName: string; email: string };
  };
}

interface SellerPayout {
  sellerId: number;
  shopName: string;
  unpaidCount: number;
  totalUnpaid: string;
}

function getResponseStatus(err: unknown): number | undefined {
  return (err as AxiosError<unknown>)?.response?.status;
}

const fmtDate = new Intl.DateTimeFormat('en-PH', {
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: 'numeric', minute: '2-digit',
});

const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

function formatLastLogin(dateString: string | null): string {
  if (!dateString) return '—';
  try {
    const elapsed = (Date.now() - new Date(dateString).getTime()) / 1000;
    if (elapsed < 60) return rtf.format(-Math.round(elapsed), 'second');
    if (elapsed < 3600) return rtf.format(-Math.round(elapsed / 60), 'minute');
    if (elapsed < 86400) return rtf.format(-Math.round(elapsed / 3600), 'hour');
    if (elapsed < 2592000) return rtf.format(-Math.round(elapsed / 86400), 'day');
    if (elapsed < 31536000) return rtf.format(-Math.round(elapsed / 2592000), 'month');
    return rtf.format(-Math.round(elapsed / 31536000), 'year');
  } catch {
    return '—';
  }
}

function formatDateTime(dateString: string): string {
  try {
    return fmtDate.format(new Date(dateString));
  } catch {
    return dateString;
  }
}

export default function AdminDashboardPage() {
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [selectedShop, setSelectedShop] = useState<AdminShop | null>(null);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [resolvingId, setResolvingId] = useState<number | null>(null);
  const [settlingId, setSettlingId] = useState<number | null>(null);
  const [refMap, setRefMap] = useState<Record<number, string>>({});

  // ConfirmModal state
  const [confirm, setConfirm] = useState<{
    title: string;
    description?: string;
    confirmLabel?: string;
    isDangerous?: boolean;
    onConfirm: () => void;
  } | null>(null);

  const withConfirm = (opts: typeof confirm) => setConfirm(opts);
  const closeConfirm = () => setConfirm(null);

  const updateShopStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiClient.patch(`/admin/shops/${id}/status`, { status }),
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-shops'] });
      toast.success(`Shop status updated to ${status}.`);
      setSelectedShop(null);
    },
    onError: () => toast.error('Failed to update shop status.'),
  });

  const updateUserStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiClient.patch(`/admin/users/${id}/status`, { status }),
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      if (selectedUser) setSelectedUser({ ...selectedUser, status });
      toast.success(`User ${status === 'Active' ? 'activated' : 'suspended'} successfully.`);
    },
    onError: () => toast.error('Failed to update user status.'),
  });

  const resetPassword = useMutation({
    mutationFn: ({ id, newPassword }: { id: number; newPassword?: string }) =>
      apiClient.post(`/admin/users/${id}/reset-password`, { newPassword }),
    onSuccess: (res) => {
      toast.success(res.data.message || 'Password reset successful.');
      setShowPasswordPrompt(false);
      setNewPassword('');
    },
    onError: () => toast.error('Password reset failed.'),
  });

  const elevateRole = useMutation({
    mutationFn: ({ id, role }: { id: number; role: string }) =>
      apiClient.patch(`/admin/users/${id}/role`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setSelectedUser(null);
      toast.success('User role updated.');
    },
    onError: () => toast.error('Failed to update role.'),
  });

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

  const { data: disputes = [], isLoading: loadingDisputes } = useQuery<DisputedItem[]>({
    queryKey: ['admin-disputes'],
    queryFn: async () => {
      const { data } = await apiClient.get<DisputedItem[]>('/orders/items/disputed');
      return data;
    },
    retry: 1,
  });

  const { data: payoutSellers = [], isLoading: loadingPayouts } = useQuery<SellerPayout[]>({
    queryKey: ['admin-payouts'],
    queryFn: async () => {
      const { data } = await apiClient.get<SellerPayout[]>('/commissions/pending');
      return data;
    },
  });

  const resolveMutation = useMutation({
    mutationFn: ({ orderItemId, resolution }: { orderItemId: number; resolution: 'Refunded' | 'Completed' }) =>
      apiClient.patch(`/orders/items/${orderItemId}/resolve`, { resolution }),
    onSuccess: (_, { resolution }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-disputes'] });
      setResolvingId(null);
      toast.success(`Dispute resolved: ${resolution}.`);
    },
    onError: () => toast.error('Failed to resolve dispute.'),
  });

  const settleMutation = useMutation({
    mutationFn: ({ sellerId, referenceNumber }: { sellerId: number; referenceNumber: string }) =>
      apiClient.patch(`/commissions/settle/${sellerId}`, { referenceNumber }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-payouts'] });
      setSettlingId(null);
      toast.success(`Settled ${res.data.settledCount} commission(s). Ref: ${res.data.referenceNumber}`);
    },
    onError: () => toast.error('Failed to settle payout.'),
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
        <h1 className={styles.heading}>Admin Dashboard</h1>
        <p className={styles.subheading}>Platform overview and management</p>
      </div>

      {/* Stats */}
      <div id="overview" className={styles.statsGrid}>
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
                <th>Role(s)</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const roleNames = user.userRoles.map((r) => r.role?.roleName).filter(Boolean).join(', ') || 'Customer';
                return (
                  <tr key={user.id}>
                    <td data-label="User ID">U-{user.id.toString().padStart(4, '0')}</td>
                    <td data-label="Username">{user.username}</td>
                    <td data-label="Name" className={styles.leftAlign}>{user.firstName} {user.lastName}</td>
                    <td data-label="Email" className={styles.leftAlign}>{user.email}</td>
                    <td data-label="Contact No.">{user.contactNumber ?? '—'}</td>
                    <td data-label="Reg. Date" style={{ whiteSpace: 'pre-wrap' }}>{formatDateTime(user.dateTimeRegistered)}</td>
                    <td data-label="Last Login">{formatLastLogin(user.lastLogin)}</td>
                    <td data-label="Role(s)">
                      <span className={styles.roleBadge}>{roleNames}</span>
                    </td>
                    <td data-label="Status" className={user.status === 'Active' ? styles.statusActive : styles.statusInactive}>
                      {user.status === 'Active' ? 'Active' : 'Suspended'}
                    </td>
                    <td data-label="Action">
                      <div className={styles.actionGroup}>
                        <button
                          className={`${styles.actionBtn} ${styles.btnUpdate}`}
                          onClick={() => setSelectedUser(user)}
                        >
                          Manage
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
                  <td data-label="Shop ID">S-{shop.id.toString().padStart(4, '0')}</td>
                  <td data-label="Shop Logo">
                    {shop.shopLogoUrl ? (
                      <img
                        src={shop.shopLogoUrl?.startsWith('/') ? shop.shopLogoUrl : `/${shop.shopLogoUrl}`}
                        alt={shop.shopName}
                        width={60}
                        height={60}
                        className={styles.shopImg}
                      />
                    ) : (
                      <div className={styles.shopImg} style={{ background: '#eee' }} />
                    )}
                  </td>
                  <td data-label="Shop Name">{shop.shopName}</td>
                  <td data-label="Shop Description" className={`${styles.leftAlign} ${styles.descriptionCell}`}>
                    {shop.shopDescription
                      ? shop.shopDescription.length > 80
                        ? shop.shopDescription.substring(0, 80) + '...'
                        : shop.shopDescription
                      : '—'}
                  </td>
                  <td data-label="Reg. Date" style={{ whiteSpace: 'pre-wrap' }}>{formatDateTime(shop.registeredAt)}</td>
                  <td data-label="Seller Name">{shop.user.firstName} {shop.user.lastName}</td>
                  <td data-label="Status" className={
                    shop.shopStatus === 'Active' ? styles.statusActive :
                    shop.shopStatus === 'Pending' ? styles.statusPending : styles.statusInactive
                  }>
                    {shop.shopStatus}
                  </td>
                  <td data-label="Action">
                    <div className={styles.actionGroup}>
                      <button
                        className={`${styles.actionBtn} ${styles.btnUpdate}`}
                        onClick={() => setSelectedShop(shop)}
                      >
                        Manage
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── Manage User Overlay ──────────────────────────────────── */}
      {selectedUser && (
        <div
          className={styles.modalOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="manage-user-title"
          onClick={() => { setSelectedUser(null); setShowPasswordPrompt(false); setNewPassword(''); }}
        >
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 id="manage-user-title" className={styles.modalTitle}>
                Manage User <span className={styles.modalIdBadge}>U-{selectedUser.id.toString().padStart(4, '0')}</span>
              </h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                aria-label="Close manage user dialog"
                onClick={() => { setSelectedUser(null); setShowPasswordPrompt(false); setNewPassword(''); }}
              >
                &times;
              </button>
            </div>

            <div className={styles.modalBody}>
              {/* Info grid */}
              <dl className={styles.infoGrid}>
                <div className={styles.infoRow}>
                  <dt className={styles.infoLabel}>Name</dt>
                  <dd className={styles.infoValue}>{selectedUser.firstName} {selectedUser.lastName}</dd>
                </div>
                <div className={styles.infoRow}>
                  <dt className={styles.infoLabel}>Email</dt>
                  <dd className={styles.infoValue}>{selectedUser.email}</dd>
                </div>
                <div className={styles.infoRow}>
                  <dt className={styles.infoLabel}>Username</dt>
                  <dd className={styles.infoValue}>{selectedUser.username}</dd>
                </div>
                <div className={styles.infoRow}>
                  <dt className={styles.infoLabel}>Status</dt>
                  <dd className={styles.infoValue}>
                    <span className={selectedUser.status === 'Active' ? styles.statusActive : styles.statusInactive}>
                      {selectedUser.status}
                    </span>
                  </dd>
                </div>
                <div className={styles.infoRow}>
                  <dt className={styles.infoLabel}>Roles</dt>
                  <dd className={styles.infoValue}>
                    {selectedUser.userRoles.map((r) => r.role.roleName).join(', ') || 'None'}
                  </dd>
                </div>
              </dl>

              <hr className={styles.modalDivider} />

              {/* Account Status */}
              <fieldset className={styles.fieldset}>
                <legend className={styles.fieldsetLegend}>Account Status</legend>
                <div className={styles.btnRow}>
                  {selectedUser.status !== 'Active' && (
                    <button
                      className={`${styles.actionBtn} ${styles.btnConfirm}`}
                      onClick={() => withConfirm({
                        title: 'Activate Account',
                        description: `Activate account for ${selectedUser.firstName} ${selectedUser.lastName}?`,
                        confirmLabel: 'Activate',
                        onConfirm: () => updateUserStatus.mutate({ id: selectedUser.id, status: 'Active' }),
                      })}
                      disabled={updateUserStatus.isPending}
                    >
                      Activate Account
                    </button>
                  )}
                  {selectedUser.status === 'Active' && (
                    <button
                      className={`${styles.actionBtn} ${styles.btnDelete}`}
                      onClick={() => withConfirm({
                        title: 'Suspend Account',
                        description: `Suspend ${selectedUser.firstName} ${selectedUser.lastName}? They will not be able to log in.`,
                        confirmLabel: 'Suspend',
                        isDangerous: true,
                        onConfirm: () => updateUserStatus.mutate({ id: selectedUser.id, status: 'Suspended' }),
                      })}
                      disabled={updateUserStatus.isPending}
                    >
                      Suspend Account
                    </button>
                  )}
                </div>
              </fieldset>

              {/* Role Management */}
              <fieldset className={styles.fieldset}>
                <legend className={styles.fieldsetLegend}>Assign Role</legend>
                <div className={styles.btnRow}>
                  <button
                    className={`${styles.actionBtn} ${styles.btnConfirm}`}
                    onClick={() => withConfirm({
                      title: 'Assign Admin Role',
                      description: `Grant Admin privileges to ${selectedUser.firstName} ${selectedUser.lastName}?`,
                      confirmLabel: 'Assign Admin',
                      isDangerous: true,
                      onConfirm: () => elevateRole.mutate({ id: selectedUser.id, role: 'Admin' }),
                    })}
                    disabled={elevateRole.isPending}
                  >
                    Admin
                  </button>
                  <button
                    className={`${styles.actionBtn} ${styles.btnUpdate}`}
                    onClick={() => withConfirm({
                      title: 'Assign Seller Role',
                      description: `Assign Seller role to ${selectedUser.firstName} ${selectedUser.lastName}?`,
                      confirmLabel: 'Assign Seller',
                      onConfirm: () => elevateRole.mutate({ id: selectedUser.id, role: 'Seller' }),
                    })}
                    disabled={elevateRole.isPending}
                  >
                    Seller
                  </button>
                  <button
                    className={`${styles.actionBtn} ${styles.btnArchive}`}
                    onClick={() => withConfirm({
                      title: 'Assign Customer Role',
                      description: `Set ${selectedUser.firstName} ${selectedUser.lastName} as Customer?`,
                      confirmLabel: 'Assign Customer',
                      onConfirm: () => elevateRole.mutate({ id: selectedUser.id, role: 'Customer' }),
                    })}
                    disabled={elevateRole.isPending}
                  >
                    Customer
                  </button>
                </div>
              </fieldset>

              {/* Security */}
              <fieldset className={styles.fieldset}>
                <legend className={styles.fieldsetLegend}>Security</legend>
                {!showPasswordPrompt ? (
                  <button
                    className={`${styles.actionBtn} ${styles.btnArchive}`}
                    onClick={() => setShowPasswordPrompt(true)}
                  >
                    Force Password Reset
                  </button>
                ) : (
                  <div className={styles.formGroup}>
                    <label htmlFor="new-password-input" className={styles.formLabel}>
                      New Password
                      <span className={styles.formHint}> (leave blank to use system default)</span>
                    </label>
                    <input
                      id="new-password-input"
                      type="password"
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className={styles.formInput}
                      autoComplete="new-password"
                    />
                    <div className={styles.btnRow}>
                      <button
                        className={`${styles.actionBtn} ${styles.btnConfirm}`}
                        onClick={() => resetPassword.mutate({ id: selectedUser.id, newPassword: newPassword || undefined })}
                        disabled={resetPassword.isPending}
                      >
                        {resetPassword.isPending ? 'Resetting…' : 'Confirm Reset'}
                      </button>
                      <button
                        className={`${styles.actionBtn} ${styles.btnUpdate}`}
                        onClick={() => { setShowPasswordPrompt(false); setNewPassword(''); }}
                        disabled={resetPassword.isPending}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </fieldset>
            </div>
          </div>
        </div>
      )}

      {/* ─── Manage Shop Overlay ──────────────────────────────────── */}
      {selectedShop && (
        <div
          className={styles.modalOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="manage-shop-title"
          onClick={() => setSelectedShop(null)}
        >
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 id="manage-shop-title" className={styles.modalTitle}>
                {selectedShop.shopName}
                <span className={styles.modalIdBadge}>S-{selectedShop.id.toString().padStart(4, '0')}</span>
              </h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                aria-label="Close manage shop dialog"
                onClick={() => setSelectedShop(null)}
              >
                &times;
              </button>
            </div>
            <div className={styles.modalBody}>
              {/* Shop identity */}
              <div className={styles.shopIdentity}>
                {selectedShop.shopLogoUrl ? (
                  <img
                    src={selectedShop.shopLogoUrl.startsWith('/') ? selectedShop.shopLogoUrl : `/${selectedShop.shopLogoUrl}`}
                    alt={selectedShop.shopName}
                    width={64}
                    height={64}
                    className={styles.shopIdentityImg}
                  />
                ) : (
                  <div className={styles.shopIdentityImgPlaceholder} />
                )}
                <div>
                  <p className={styles.shopIdentityName}>{selectedShop.shopName}</p>
                  <p className={styles.shopIdentitySeller}>by {selectedShop.user.firstName} {selectedShop.user.lastName}</p>
                  <span className={
                    selectedShop.shopStatus === 'Active' ? styles.statusActive :
                    selectedShop.shopStatus === 'Pending' ? styles.statusPending : styles.statusInactive
                  }>
                    {selectedShop.shopStatus}
                  </span>
                </div>
              </div>

              <hr className={styles.modalDivider} />

              <dl className={styles.infoGrid}>
                <div className={styles.infoRow}>
                  <dt className={styles.infoLabel}>Registered</dt>
                  <dd className={styles.infoValue}>{formatDateTime(selectedShop.registeredAt)}</dd>
                </div>
                <div className={styles.infoRow}>
                  <dt className={styles.infoLabel}>Description</dt>
                  <dd className={styles.infoValue}>{selectedShop.shopDescription || '—'}</dd>
                </div>
              </dl>

              <hr className={styles.modalDivider} />

              <fieldset className={styles.fieldset}>
                <legend className={styles.fieldsetLegend}>Shop Actions</legend>
                <div className={styles.btnRow}>
                  {selectedShop.shopStatus === 'Pending' && (
                    <>
                      <button
                        className={`${styles.actionBtn} ${styles.btnConfirm}`}
                        onClick={() => withConfirm({
                          title: 'Approve Shop',
                          description: `Approve "${selectedShop.shopName}" and make it live?`,
                          confirmLabel: 'Approve',
                          onConfirm: () => updateShopStatus.mutate({ id: selectedShop.id, status: 'Active' }),
                        })}
                        disabled={updateShopStatus.isPending}
                      >
                        Approve Shop
                      </button>
                      <button
                        className={`${styles.actionBtn} ${styles.btnDelete}`}
                        onClick={() => withConfirm({
                          title: 'Reject Shop',
                          description: `Reject "${selectedShop.shopName}"? The shop will be banned.`,
                          confirmLabel: 'Reject',
                          isDangerous: true,
                          onConfirm: () => updateShopStatus.mutate({ id: selectedShop.id, status: 'Banned' }),
                        })}
                        disabled={updateShopStatus.isPending}
                      >
                        Reject Shop
                      </button>
                    </>
                  )}
                  {selectedShop.shopStatus === 'Active' && (
                    <button
                      className={`${styles.actionBtn} ${styles.btnArchive}`}
                      onClick={() => withConfirm({
                        title: 'Suspend Shop',
                        description: `Suspend "${selectedShop.shopName}"? Products will be hidden.`,
                        confirmLabel: 'Suspend',
                        isDangerous: true,
                        onConfirm: () => updateShopStatus.mutate({ id: selectedShop.id, status: 'Inactive' }),
                      })}
                      disabled={updateShopStatus.isPending}
                    >
                      Suspend Shop
                    </button>
                  )}
                  {selectedShop.shopStatus === 'Inactive' && (
                    <button
                      className={`${styles.actionBtn} ${styles.btnConfirm}`}
                      onClick={() => withConfirm({
                        title: 'Reactivate Shop',
                        description: `Reactivate "${selectedShop.shopName}"?`,
                        confirmLabel: 'Reactivate',
                        onConfirm: () => updateShopStatus.mutate({ id: selectedShop.id, status: 'Active' }),
                      })}
                      disabled={updateShopStatus.isPending}
                    >
                      Reactivate Shop
                    </button>
                  )}
                  {selectedShop.shopStatus === 'Banned' && (
                    <button
                      className={`${styles.actionBtn} ${styles.btnConfirm}`}
                      onClick={() => withConfirm({
                        title: 'Unban Shop',
                        description: `Unban "${selectedShop.shopName}" and restore it to Active status?`,
                        confirmLabel: 'Unban',
                        onConfirm: () => updateShopStatus.mutate({ id: selectedShop.id, status: 'Active' }),
                      })}
                      disabled={updateShopStatus.isPending}
                    >
                      Unban Shop
                    </button>
                  )}
                </div>
              </fieldset>
            </div>
          </div>
        </div>
      )}


      {/* ─── Disputes Section ─────────────────────────────────────── */}
      <section id="disputes" className={styles.sectionHeader} style={{ scrollMarginTop: 'var(--space-6)' }}>
        <h2 className={styles.sectionTitle}>Dispute Management</h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-5)' }}>
          Review and resolve customer disputes. Approving a refund voids the seller commission for that item.
        </p>

        {loadingDisputes && (
          <div style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--color-text-muted)' }}>Loading disputes&hellip;</div>
        )}

        {!loadingDisputes && disputes.length === 0 && (
          <div className={styles.emptyState}>
            <p className={styles.emptyStateTitle}>No Active Disputes</p>
            <p className={styles.emptyStateText}>All customer issues have been resolved.</p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {disputes.map((item) => (
            <div key={item.id} className={styles.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
                <div>
                  <p style={{ fontWeight: 600, marginBottom: 'var(--space-1)' }}>{item.product.name}</p>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                    Order O-{item.order.id.toString().padStart(4, '0')} &middot; {item.order.user.firstName} {item.order.user.lastName} ({item.order.user.email})
                  </p>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                    Shop: {item.product.seller.shopName} &middot; Qty: {item.quantity} &middot; PHP {Number(item.price).toFixed(2)}
                  </p>
                  {item.dateDelivered && (
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
                      Delivered: {fmtDate.format(new Date(item.dateDelivered))}
                    </p>
                  )}
                </div>
                <span className={styles.statusDisputed}>{item.orderItemStatus}</span>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <button
                  type="button"
                  className={`${styles.actionBtn} ${styles.btnDelete}`}
                  disabled={resolveMutation.isPending && resolvingId === item.id}
                  onClick={() => withConfirm({
                    title: 'Approve Refund',
                    description: `Approve refund for "${item.product.name}"? This will void the seller's commission for this item.`,
                    confirmLabel: 'Approve Refund',
                    isDangerous: true,
                    onConfirm: () => { setResolvingId(item.id); resolveMutation.mutate({ orderItemId: item.id, resolution: 'Refunded' }); },
                  })}
                >
                  Approve Refund
                </button>
                <button
                  type="button"
                  className={`${styles.actionBtn} ${styles.btnArchive}`}
                  disabled={resolveMutation.isPending && resolvingId === item.id}
                  onClick={() => withConfirm({
                    title: 'Reject Dispute',
                    description: `Reject the dispute for "${item.product.name}"? The order will be marked Completed.`,
                    confirmLabel: 'Reject Dispute',
                    isDangerous: true,
                    onConfirm: () => { setResolvingId(item.id); resolveMutation.mutate({ orderItemId: item.id, resolution: 'Completed' }); },
                  })}
                >
                  Reject Dispute
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Payouts Section ──────────────────────────────────────── */}
      <section id="payouts" className={styles.sectionHeader} style={{ scrollMarginTop: 'var(--space-6)' }}>
        <h2 className={styles.sectionTitle}>Seller Payouts</h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-5)' }}>
          Review and settle pending seller commissions. Enter a reference number to log the payment.
        </p>

        {loadingPayouts && (
          <div style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--color-text-muted)' }}>Loading payouts&hellip;</div>
        )}

        {!loadingPayouts && payoutSellers.length === 0 && (
          <div className={styles.emptyState}>
            <p className={styles.emptyStateTitle}>All Payouts Settled</p>
            <p className={styles.emptyStateText}>No pending commissions for any seller.</p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {payoutSellers.map((seller) => (
            <div key={seller.sellerId} className={styles.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                <div>
                  <p style={{ fontWeight: 600, marginBottom: 'var(--space-1)' }}>{seller.shopName}</p>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                    {seller.unpaidCount} unpaid commission{seller.unpaidCount !== 1 ? 's' : ''}
                  </p>
                </div>
                <span style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', color: 'var(--color-primary)' }}>
                  PHP {Number(seller.totalUnpaid).toFixed(2)}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                <label htmlFor={`ref-${seller.sellerId}`} className={styles.visuallyHidden}>Reference Number</label>
                <input
                  id={`ref-${seller.sellerId}`}
                  type="text"
                  placeholder="Reference # (e.g. TXN-20260330-001)"
                  value={refMap[seller.sellerId] ?? ''}
                  onChange={(e) => setRefMap((prev) => ({ ...prev, [seller.sellerId]: e.target.value }))}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-card-border)',
                    background: 'rgba(0,0,0,0.04)',
                    color: 'inherit',
                    fontSize: 'var(--text-sm)',
                  }}
                />
                <button
                  type="button"
                  className={`${styles.actionBtn} ${styles.btnConfirm}`}
                  disabled={!refMap[seller.sellerId]?.trim() || (settleMutation.isPending && settlingId === seller.sellerId)}
                  onClick={() => {
                    setSettlingId(seller.sellerId);
                    settleMutation.mutate({ sellerId: seller.sellerId, referenceNumber: refMap[seller.sellerId] });
                  }}
                  style={{ whiteSpace: 'nowrap', minWidth: 'max-content' }}
                >
                  {settleMutation.isPending && settlingId === seller.sellerId ? 'Settling…' : 'Settle Payout'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
