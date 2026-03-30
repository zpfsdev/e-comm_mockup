'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

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

export default function AdminDisputesPage() {
  const queryClient = useQueryClient();
  const [resolving, setResolving] = useState<number | null>(null);

  const { data: items = [], isLoading } = useQuery<DisputedItem[]>({
    queryKey: ['admin-disputes'],
    queryFn: async () => {
      // We'll use the orders endpoint to get disputed items
      // For now, we'll fetch from a special admin endpoint
      const { data } = await apiClient.get('/orders/items/disputed');
      return data;
    },
    retry: 1,
  });

  const resolveMutation = useMutation({
    mutationFn: async ({
      orderItemId,
      resolution,
    }: {
      orderItemId: number;
      resolution: 'Refunded' | 'Completed';
    }) => {
      const { data } = await apiClient.patch(
        `/orders/items/${orderItemId}/resolve`,
        { resolution },
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-disputes'] });
      setResolving(null);
    },
  });

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem var(--container-pad)' }}>
      <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', marginBottom: '1.5rem' }}>
        🛡️ Dispute Management
      </h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem', fontSize: 'var(--text-sm)' }}>
        Review and resolve customer disputes. Approving a refund will void the seller&apos;s commission for that item.
      </p>

      {isLoading && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
          Loading disputes...
        </div>
      )}

      {!isLoading && items.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
          <p style={{ fontSize: 'var(--text-lg)', marginBottom: '0.5rem' }}>✅ No active disputes</p>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>All customer issues have been resolved.</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {items.map((item) => (
          <div
            key={item.id}
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              padding: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, marginBottom: '4px' }}>
                  {item.product.name}
                </h3>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                  Order #{item.order.id} · {item.order.user.firstName} {item.order.user.lastName} ({item.order.user.email})
                </p>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                  Seller: {item.product.seller.shopName} · Qty: {item.quantity} · ₱{Number(item.price).toFixed(2)}
                </p>
              </div>
              <span style={{
                background: 'rgba(239,68,68,0.15)',
                color: '#ef4444',
                padding: '4px 12px',
                borderRadius: '999px',
                fontSize: '0.75rem',
                fontWeight: 600,
              }}>
                {item.orderItemStatus}
              </span>
            </div>

            {item.dateDelivered && (
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                Delivered: {new Date(item.dateDelivered).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            )}

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                disabled={resolveMutation.isPending && resolving === item.id}
                onClick={() => {
                  setResolving(item.id);
                  resolveMutation.mutate({ orderItemId: item.id, resolution: 'Refunded' });
                }}
                style={{
                  padding: '8px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#ef4444',
                  color: '#fff',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Approve Refund
              </button>
              <button
                type="button"
                disabled={resolveMutation.isPending && resolving === item.id}
                onClick={() => {
                  setResolving(item.id);
                  resolveMutation.mutate({ orderItemId: item.id, resolution: 'Completed' });
                }}
                style={{
                  padding: '8px 20px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.15)',
                  background: 'none',
                  color: 'rgba(255,255,255,0.8)',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                Reject Dispute
              </button>
            </div>

            {resolveMutation.isError && resolving === item.id && (
              <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                {(resolveMutation.error as any)?.response?.data?.message ?? 'Failed to resolve dispute.'}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
