'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { apiClient } from '@/lib/api-client';
import { Input } from '@/components/ui/input/input';
import { Button } from '@/components/ui/button/button';
import styles from '../dashboard/dashboard.module.css';

interface RegisterSellerPayload {
  shopName: string;
  shopDescription?: string;
  shopLogoUrl?: string;
}

export default function SellerRegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ shopName: '', shopDescription: '', shopLogoUrl: '' });
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: (payload: RegisterSellerPayload) =>
      apiClient.post('/sellers/register', payload),
    onSuccess: () => {
      router.push('/seller/dashboard');
    },
    onError: (err: AxiosError<{ message?: string }>) => {
      setError(err.response?.data?.message ?? 'Failed to register as seller. Please try again.');
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    mutation.mutate({
      shopName: form.shopName,
      ...(form.shopDescription ? { shopDescription: form.shopDescription } : {}),
      ...(form.shopLogoUrl     ? { shopLogoUrl: form.shopLogoUrl }         : {}),
    });
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.heading}>Become a Seller</h1>
        <p className={styles.subheading}>
          Set up your store and start selling early childhood learning products on Artistryx.
        </p>
      </div>

      <div style={{
        maxWidth: '32rem',
        border: '1px solid var(--color-card-border)',
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
      }}>
        <div style={{ padding: 'var(--space-4) var(--space-6)', backgroundColor: 'var(--color-card-border)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', color: 'var(--color-tertiary)' }}>
            Store Details
          </h2>
        </div>
        <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          {error && (
            <p style={{
              fontSize: 'var(--text-sm)', color: 'var(--color-error)',
              backgroundColor: 'rgba(192,57,43,0.08)', borderRadius: 'var(--radius-md)',
              padding: 'var(--space-3) var(--space-4)',
            }}>{error}</p>
          )}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            <Input
              label="Shop Name"
              placeholder="My Learning Store"
              value={form.shopName}
              onChange={(e) => setForm((p) => ({ ...p, shopName: e.target.value }))}
              required
            />
            <div>
              <label htmlFor="shopDescription" style={{
                fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)',
                fontWeight: 'var(--weight-medium)', color: 'var(--color-text)',
                display: 'block', marginBottom: 'var(--space-2)',
              }}>
                Shop Description (optional)
              </label>
              <textarea
                id="shopDescription"
                placeholder="Tell buyers what your store is about…"
                value={form.shopDescription}
                onChange={(e) => setForm((p) => ({ ...p, shopDescription: e.target.value }))}
                rows={4}
              />
            </div>
            <Input
              label="Shop Logo URL (optional)"
              type="url"
              placeholder="https://example.com/logo.png"
              value={form.shopLogoUrl}
              onChange={(e) => setForm((p) => ({ ...p, shopLogoUrl: e.target.value }))}
            />
            <Button variant="primary" full type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Creating store…' : 'Create My Store'}
            </Button>
            <Link href="/" style={{ textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-primary)' }}>
              Maybe later
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
}
