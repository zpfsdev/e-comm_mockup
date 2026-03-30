'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useRouter } from 'next/navigation';

interface DisputeButtonProps {
  readonly orderItemId: number;
  readonly productName: string;
  readonly status: string;
}

export function DisputeButton({ orderItemId, productName, status }: DisputeButtonProps) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [reason, setReason] = useState('');

  const mutation = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post(`/orders/items/${orderItemId}/dispute`, {
        reason: reason || undefined,
      });
      return data;
    },
    onSuccess: () => {
      setShowConfirm(false);
      router.refresh();
    },
  });

  // Only show for Completed items
  if (status !== 'Completed') return null;

  if (!showConfirm) {
    return (
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        style={{
          marginTop: '8px',
          background: 'none',
          border: '1px solid rgba(239,68,68,0.4)',
          color: '#ef4444',
          padding: '4px 12px',
          borderRadius: '6px',
          fontSize: '0.8rem',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        Request Refund
      </button>
    );
  }

  return (
    <div style={{
      marginTop: '8px',
      border: '1px solid rgba(239,68,68,0.3)',
      borderRadius: '8px',
      padding: '12px',
      background: 'rgba(239,68,68,0.05)',
    }}>
      <p style={{ fontSize: '0.85rem', marginBottom: '8px', color: 'var(--color-text-muted)' }}>
        Dispute &quot;{productName}&quot;? You have 14 days from delivery.
      </p>
      <textarea
        placeholder="Reason for refund request (optional)..."
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={2}
        style={{
          width: '100%',
          resize: 'vertical',
          padding: '8px',
          borderRadius: '6px',
          border: '1px solid rgba(255,255,255,0.15)',
          background: 'rgba(255,255,255,0.06)',
          color: 'inherit',
          fontSize: '0.85rem',
          marginBottom: '8px',
        }}
      />
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          type="button"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          style={{
            padding: '6px 16px',
            borderRadius: '6px',
            border: 'none',
            background: '#ef4444',
            color: '#fff',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: mutation.isPending ? 'not-allowed' : 'pointer',
            opacity: mutation.isPending ? 0.7 : 1,
          }}
        >
          {mutation.isPending ? 'Submitting...' : 'Confirm Dispute'}
        </button>
        <button
          type="button"
          onClick={() => setShowConfirm(false)}
          style={{
            padding: '6px 16px',
            borderRadius: '6px',
            border: '1px solid rgba(255,255,255,0.15)',
            background: 'none',
            color: 'rgba(255,255,255,0.7)',
            fontSize: '0.8rem',
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      </div>
      {mutation.isError && (
        <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '6px' }}>
          {(mutation.error as any)?.response?.data?.message ?? 'Failed to submit dispute.'}
        </p>
      )}
    </div>
  );
}
