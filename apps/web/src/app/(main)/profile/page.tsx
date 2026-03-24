'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/providers/auth-provider';
import Link from 'next/link';
import { Input } from '@/components/ui/input/input';
import { Button } from '@/components/ui/button/button';
import { Skeleton } from '@/components/ui/skeleton/skeleton';
import { ProfileSidebar } from '@/components/profile/profile-sidebar';
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

function isSafeImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url, window.location.origin);
    return parsed.protocol === 'https:' || parsed.pathname.startsWith('/uploads/');
  } catch {
    return false;
  }
}

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const { logout } = useAuth();
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { register, handleSubmit, reset, setValue } = useForm<EditForm>({
    defaultValues: { firstName: '', middleName: '', lastName: '', contactNumber: '', profilePictureUrl: '' },
  });

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    };
  }, []);

  const { data: profile, isLoading, isError } = useQuery<UserProfile>({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data } = await apiClient.get<UserProfile>('/users/profile');
      return data;
    },
  });

  useEffect(() => {
    if (!profile) return;
    reset({
      firstName: profile.firstName,
      middleName: profile.middleName ?? '',
      lastName: profile.lastName,
      contactNumber: profile.contactNumber ?? '',
      profilePictureUrl: profile.profilePictureUrl ?? '',
    });
  }, [profile, reset]);

  const mutation = useMutation({
    mutationFn: (payload: Partial<EditForm>) => apiClient.patch('/users/profile', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setFeedback({ type: 'success', message: 'Profile updated successfully!' });
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = setTimeout(() => setFeedback(null), 4000);
    },
    onError: () => {
      setFeedback({ type: 'error', message: 'Failed to update profile. Please try again.' });
    },
  });

  function onSubmit(form: EditForm): void {
    mutation.mutate({
      ...(form.firstName && { firstName: form.firstName }),
      ...(form.lastName && { lastName: form.lastName }),
      middleName: form.middleName,
      contactNumber: form.contactNumber,
      profilePictureUrl: form.profilePictureUrl,
    });
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        setValue('profilePictureUrl', data.url);
        mutation.mutate({ profilePictureUrl: data.url });
      } else {
        setFeedback({ type: 'error', message: 'Upload failed: ' + data.message });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Upload error: ' + String(err) });
    } finally {
      setUploading(false);
    }
  }

  const fullName = profile ? `${profile.firstName} ${profile.lastName}` : '';
  const initials = profile
    ? `${profile.firstName?.[0] ?? ''}${profile.lastName?.[0] ?? ''}`.toUpperCase()
    : '';

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
        <div className={styles.profileLayout}>
          <Skeleton height="18rem" width="250px" />
          <div style={{ flex: 1 }}>
            <Skeleton height="30rem" style={{ borderRadius: 'var(--radius-lg)' }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.profileLayout}>
        {/* SIDEBAR */}
        <ProfileSidebar />

        {/* MAIN CONTENT */}
        <main className={styles.mainContent}>
          <h1 className={styles.heading}>My Profile</h1>
          <p className={styles.subheading}>Manage your account</p>

          {profile && (!profile.firstName || !profile.lastName || !profile.contactNumber) && (
            <div className={styles.errorMsg} style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)', marginBottom: 'var(--space-8)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: '2px' }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <div>
                <strong style={{ display: 'block', marginBottom: 'var(--space-1)' }}>Complete your profile</strong>
                Your profile is incomplete. Please fill in your first name, last name, and contact number below. Some features may be restricted until your profile is complete.
              </div>
            </div>
          )}

          <div className={styles.formSection}>
            {feedback && (
              <div
                className={feedback.type === 'success' ? styles.successMsg : styles.errorMsg}
                role={feedback.type === 'success' ? 'status' : 'alert'}
                aria-live="polite"
                style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}
              >
                {feedback.type === 'success' ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                )}
                {feedback.message}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)}>
              <div className={styles.row} style={{ marginBottom: 'var(--space-6)' }}>
                <div className={styles.fieldGroup}>
                  <label htmlFor="profile-username" className={styles.fieldLabel}>Username</label>
                  <Input id="profile-username" disabled value={profile?.username || ''} placeholder="Username" />
                </div>
                <div className={styles.fieldGroup}>
                  <label htmlFor="profile-email" className={styles.fieldLabel}>Email</label>
                  <Input id="profile-email" disabled value={profile?.email || ''} placeholder="Email Address" />
                </div>
              </div>

              <div className={styles.row} style={{ marginBottom: 'var(--space-6)' }}>
                <div className={styles.fieldGroup}>
                  <label htmlFor="profile-phone" className={styles.fieldLabel}>Phone Number</label>
                  <Input id="profile-phone" type="tel" placeholder="09171234567" {...register('contactNumber')} />
                </div>
                <div className={styles.fieldGroup}>
                  <label htmlFor="profile-dob" className={styles.fieldLabel}>Date of Birth</label>
                  <Input id="profile-dob" placeholder="DD / MM / YYYY" disabled value={formatDate(profile?.dateOfBirth)} />
                </div>
              </div>

              <div className={styles.row} style={{ marginBottom: 'var(--space-6)' }}>
                <div className={styles.fieldGroup}>
                  <label htmlFor="profile-first-name" className={styles.fieldLabel}>First Name</label>
                  <Input id="profile-first-name" {...register('firstName')} />
                </div>
                <div className={styles.fieldGroup}>
                  <label htmlFor="profile-last-name" className={styles.fieldLabel}>Last Name</label>
                  <Input id="profile-last-name" {...register('lastName')} />
                </div>
              </div>

              <div className={styles.avatarSection}>
                <div className={styles.avatar}>
                  {profile?.profilePictureUrl && isSafeImageUrl(profile.profilePictureUrl)
                    ? <img src={profile.profilePictureUrl} alt={fullName} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                    : <span className={styles.avatarText}>{initials}</span>
                  }
                </div>
                <div>
                  <label htmlFor="avatar-upload" className={styles.avatarSelectBtn} style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                    </svg>
                    {uploading ? 'Uploading...' : 'Select Image'}
                  </label>
                  <input id="avatar-upload" type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
                </div>
              </div>

              <div className={styles.saveBtnContainer}>
                <Button variant="primary" type="submit" disabled={mutation.isPending || uploading}>
                  {mutation.isPending ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
