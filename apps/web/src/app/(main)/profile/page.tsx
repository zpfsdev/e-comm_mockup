'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Input } from '@/components/ui/input/input';
import { Button } from '@/components/ui/button/button';
import { Skeleton } from '@/components/ui/skeleton/skeleton';
import styles from './profile.module.css';

interface UserProfile {
  id: number;
  firstName: string;
  middleName?: string;
  lastName: string;
  username: string;
  email: string;
  contactNumber?: string;
  profilePictureUrl?: string;
  dateOfBirth?: string;
  dateTimeRegistered: string;
  lastLogin?: string;
  status: string;
  userRoles: { role: { roleName: string } }[];
}

interface EditForm {
  firstName: string;
  middleName: string;
  lastName: string;
  contactNumber: string;
  profilePictureUrl: string;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<EditForm>({ firstName: '', middleName: '', lastName: '', contactNumber: '', profilePictureUrl: '' });
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const { data: profile, isLoading, isError } = useQuery<UserProfile>({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data } = await apiClient.get<UserProfile>('/users/profile');
      return data;
    },
  });

  // Sync loaded profile into the edit form once the query resolves.
  useEffect(() => {
    if (!profile) return;
    // Intentional: syncing external server state into controlled form inputs.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm({
      firstName: profile.firstName,
      middleName: profile.middleName ?? '',
      lastName: profile.lastName,
      contactNumber: profile.contactNumber ?? '',
      profilePictureUrl: profile.profilePictureUrl ?? '',
    });
  }, [profile]);

  const mutation = useMutation({
    mutationFn: (payload: Partial<EditForm>) => apiClient.patch('/users/profile', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setFeedback({ type: 'success', message: 'Profile updated successfully.' });
      setTimeout(() => setFeedback(null), 4000);
    },
    onError: () => {
      setFeedback({ type: 'error', message: 'Failed to update profile. Please try again.' });
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload: Partial<EditForm> = {};
    if (form.firstName)        payload.firstName        = form.firstName;
    if (form.middleName)       payload.middleName       = form.middleName;
    if (form.lastName)         payload.lastName         = form.lastName;
    if (form.contactNumber)    payload.contactNumber    = form.contactNumber;
    if (form.profilePictureUrl) payload.profilePictureUrl = form.profilePictureUrl;
    mutation.mutate(payload);
  }

  const fullName  = profile ? `${profile.firstName} ${profile.lastName}` : '';
  const initials  = profile ? `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase() : '';
  const roleNames = profile?.userRoles.map((ur) => ur.role.roleName) ?? [];

  if (isError) {
    return (
      <div className={styles.page}>
        <p style={{ color: 'var(--color-error, #ef4444)', padding: 'var(--space-8)' }}>
          Failed to load your profile. Please try again.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={styles.page}>
        <Skeleton height="2.5rem" width="14rem" />
        <div style={{ marginTop: 'var(--space-8)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Skeleton height="7rem" style={{ borderRadius: 'var(--radius-xl)' }} />
          <Skeleton height="18rem" style={{ borderRadius: 'var(--radius-xl)' }} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>My Profile</h1>

      {/* Profile header */}
      <div className={styles.profileHeader}>
        <div className={styles.avatar} style={{ position: 'relative', overflow: 'hidden' }}>
          {profile?.profilePictureUrl
            ? (
              <Image
                src={profile.profilePictureUrl}
                alt={fullName}
                fill
                sizes="5rem"
                style={{ objectFit: 'cover' }}
              />
            )
            : <span className={styles.avatarText}>{initials}</span>
          }
        </div>
        <div className={styles.profileMeta}>
          <p className={styles.fullName}>{fullName}</p>
          <p className={styles.email}>{profile?.email}</p>
          <div className={styles.roles}>
            {roleNames.map((role) => (
              <span key={role} className={styles.roleBadge}>{role}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Edit form */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Edit Profile</h2>
        </div>
        <div className={styles.sectionBody}>
          {feedback && (
            <p className={feedback.type === 'success' ? styles.successMsg : styles.errorMsg}>
              {feedback.message}
            </p>
          )}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            <div className={styles.row}>
              <Input
                label="First Name"
                value={form.firstName}
                onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
              />
              <Input
                label="Last Name"
                value={form.lastName}
                onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
              />
            </div>
            <Input
              label="Middle Name (optional)"
              value={form.middleName}
              onChange={(e) => setForm((p) => ({ ...p, middleName: e.target.value }))}
            />
            <Input
              label="Contact Number"
              type="tel"
              placeholder="09171234567"
              value={form.contactNumber}
              onChange={(e) => setForm((p) => ({ ...p, contactNumber: e.target.value }))}
            />
            <Input
              label="Profile Picture URL (optional)"
              type="url"
              placeholder="https://example.com/photo.jpg"
              value={form.profilePictureUrl}
              onChange={(e) => setForm((p) => ({ ...p, profilePictureUrl: e.target.value }))}
            />
            <Button variant="primary" type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </div>
      </div>

      {/* Account info (read-only) */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Account Details</h2>
        </div>
        <div className={styles.sectionBody}>
          <div className={styles.metaList}>
            <div className={styles.metaRow}>
              <span className={styles.metaKey}>Username</span>
              <span className={styles.metaVal}>@{profile?.username}</span>
            </div>
            <div className={styles.metaRow}>
              <span className={styles.metaKey}>Email</span>
              <span className={styles.metaVal}>{profile?.email}</span>
            </div>
            <div className={styles.metaRow}>
              <span className={styles.metaKey}>Date of Birth</span>
              <span className={styles.metaVal}>{formatDate(profile?.dateOfBirth)}</span>
            </div>
            <div className={styles.metaRow}>
              <span className={styles.metaKey}>Member since</span>
              <span className={styles.metaVal}>{formatDate(profile?.dateTimeRegistered)}</span>
            </div>
            <div className={styles.metaRow}>
              <span className={styles.metaKey}>Last login</span>
              <span className={styles.metaVal}>{formatDate(profile?.lastLogin)}</span>
            </div>
            <div className={styles.metaRow}>
              <span className={styles.metaKey}>Account status</span>
              <span className={styles.metaVal}>{profile?.status}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
