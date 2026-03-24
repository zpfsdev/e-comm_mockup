'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/providers/auth-provider';
import styles from './register.module.css';

interface RegisterSellerPayload {
  shopName: string;
  shopDescription?: string;
  shopLogoUrl?: string;
}

interface UserProfile {
  firstName: string;
  lastName: string;
  contactNumber?: string;
  email: string;
}

export default function SellerRegisterPage() {
  const router = useRouter();
  const { refreshUser, user } = useAuth();
  const [form, setForm] = useState({ shopName: '', shopDescription: '', shopLogoUrl: '' });
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  // Check if profile is complete
  const { data: profile, isLoading: profileLoading } = useQuery<UserProfile>({
    queryKey: ['profile-check'],
    queryFn: async () => {
      const { data } = await apiClient.get<UserProfile>('/users/profile');
      return data;
    },
  });

  const isProfileIncomplete = profile && (!profile.firstName || !profile.lastName || !profile.contactNumber);

  const mutation = useMutation({
    mutationFn: (payload: RegisterSellerPayload) =>
      apiClient.post('/sellers/register', payload),
    onSuccess: async () => {
      await refreshUser();
      router.push('/seller/dashboard');
    },
    onError: (err: AxiosError<{ message?: string }>) => {
      setError(err.response?.data?.message ?? 'Failed to create your store. Please try again.');
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isProfileIncomplete) {
      setError('Please complete your profile first (name and contact number).');
      return;
    }
    setError('');
    mutation.mutate({
      shopName: form.shopName,
      ...(form.shopDescription ? { shopDescription: form.shopDescription } : {}),
      ...(form.shopLogoUrl     ? { shopLogoUrl: form.shopLogoUrl }         : {}),
    });
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        setForm((p) => ({ ...p, shopLogoUrl: data.url }));
      } else {
        setError('Logo upload failed: ' + data.message);
      }
    } catch (err) {
      setError('Logo upload error: ' + String(err));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.splitCard}>
          
          {/* Left panel - Promotional */}
          <div className={styles.leftPanel}>
            <span className={styles.marketplaceLabel}>Artistryx Marketplace</span>
            <h1 className={styles.title}>
              Where Business Builds<br />Bright Futures
            </h1>
            
            <ul className={styles.benefitsList}>
              <li className={styles.benefitItem}>
                <svg className={styles.benefitIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <span>Join a marketplace dedicated exclusively to early childhood learning products.</span>
              </li>
              <li className={styles.benefitItem}>
                <svg className={styles.benefitIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <span>Expand your business while contributing to children&apos;s learning and development.</span>
              </li>
              <li className={styles.benefitItem}>
                <svg className={styles.benefitIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <span>Increase your visibility within a community actively seeking specialized learning tools.</span>
              </li>
            </ul>
          </div>

          {/* Right panel - Form */}
          <div className={styles.rightPanel}>
            <h2 className={styles.formTitle}>CREATE YOUR STORE</h2>

            {/* Incomplete profile warning */}
            {isProfileIncomplete && (
              <div style={{
                backgroundColor: 'rgba(255, 60, 60, 0.25)',
                border: '1px solid rgba(255, 60, 60, 0.5)',
                padding: 'var(--space-3) var(--space-4)',
                borderRadius: 'var(--radius-md)',
                marginBottom: 'var(--space-6)',
                fontSize: 'var(--text-sm)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span>
                  Please <Link href="/profile" style={{ color: '#fff', textDecoration: 'underline' }}>complete your profile</Link> first (name and contact number).
                </span>
              </div>
            )}
            
            {error && (
              <div style={{
                backgroundColor: 'rgba(255, 60, 60, 0.15)',
                border: '1px solid rgba(255, 60, 60, 0.3)',
                padding: 'var(--space-3) var(--space-4)',
                borderRadius: 'var(--radius-md)',
                marginBottom: 'var(--space-6)',
                fontSize: 'var(--text-sm)',
                color: '#fff'
              }}>
                {error}
              </div>
            )}

            <form className={styles.formBox} onSubmit={handleSubmit}>
              <div>
                <label className={styles.formLabel} htmlFor="shopName">Store Name</label>
                <input
                  id="shopName"
                  className={styles.formInput}
                  type="text"
                  required
                  placeholder="My Learning Store"
                  value={form.shopName}
                  onChange={(e) => setForm((p) => ({ ...p, shopName: e.target.value }))}
                />
              </div>

              <div>
                <label className={styles.formLabel} htmlFor="shopDescription">Store Description</label>
                <textarea
                  id="shopDescription"
                  className={styles.formTextarea}
                  placeholder="Tell buyers what your store is about..."
                  value={form.shopDescription}
                  onChange={(e) => setForm((p) => ({ ...p, shopDescription: e.target.value }))}
                />
              </div>

              <div>
                <label className={styles.formLabel} htmlFor="shopLogo">Store Logo</label>
                <div className={styles.fileUploadRow}>
                  <span className={styles.fileUploadName}>
                    {form.shopLogoUrl ? form.shopLogoUrl.split('/').pop() : 'No file chosen'}
                  </span>
                  <label htmlFor="shopLogo" className={styles.fileUploadLabel}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    Choose File
                  </label>
                  <input
                    id="shopLogo"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className={styles.fileUploadHidden}
                  />
                  {uploading && <span className={styles.fileUploadStatus} style={{ color: 'rgba(255,255,255,0.7)' }}>Uploading...</span>}
                  {form.shopLogoUrl && !uploading && <span className={styles.fileUploadStatus} style={{ color: '#4ade80' }}>✓</span>}
                </div>
                {form.shopLogoUrl && (
                  <div className={styles.fileUploadPreview}>
                    <img src={form.shopLogoUrl} alt="Logo preview" />
                  </div>
                )}
              </div>

              <div style={{ marginTop: 'var(--space-4)' }}>
                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={mutation.isPending || uploading || !!isProfileIncomplete}
                  style={isProfileIncomplete ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
                >
                  {mutation.isPending ? 'Creating...' : 'Next'}
                </button>
                <Link href="/" className={styles.cancelLink}>Cancel</Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
