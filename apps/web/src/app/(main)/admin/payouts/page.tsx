'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

interface SellerPayout {
  sellerId: number;
  shopName: string;
  unpaidCount: number;
  totalUnpaid: string;
}

export default function AdminPayoutsPage() {
  const queryClient = useQueryClient();
  const [refMap, setRefMap] = useState<Record<number, string>>({});
  const [settlingId, setSettlingId] = useState<number | null>(null);

  const { data: sellers = [], isLoading } = useQuery<SellerPayout[]>({
    queryKey: ['admin-payouts'],
    queryFn: async () => {
      const { data } = await apiClient.get('/commissions/pending');
      return data;
    },
  });

  const settleMutation = useMutation({
    mutationFn: async ({ sellerId, referenceNumber }: { sellerId: number; referenceNumber: string }) => {
      const { data } = await apiClient.patch(`/commissions/settle/${sellerId}`, { referenceNumber });
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-payouts'] });
      setSettlingId(null);
      alert(`✅ Settled ${data.settledCount} commission(s) for ₱${Number(data.totalSettled).toFixed(2)}\nRef: ${data.referenceNumber}`);
    },
  });

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem var(--container-pad)' }}>
      <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', marginBottom: '1.5rem' }}>
        💰 Seller Payouts
      </h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem', fontSize: 'var(--text-sm)' }}>
        Review and settle pending seller commissions. Enter a custom reference number to log the payment.
      </p>

      {isLoading && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
          Loading pending payouts...
        </div>
      )}

      {!isLoading && sellers.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
          <p style={{ fontSize: 'var(--text-lg)', marginBottom: '0.5rem' }}>✅ All payouts settled</p>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>No pending commissions for any seller.</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {sellers.map((seller) => (
          <div
            key={seller.sellerId}
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              padding: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, marginBottom: '4px' }}>
                  {seller.shopName}
                </h3>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                  {seller.unpaidCount} unpaid commission{seller.unpaidCount !== 1 ? 's' : ''}
                </p>
              </div>
              <span style={{
                fontSize: 'var(--text-lg)',
                fontWeight: 'var(--weight-bold)',
                color: 'var(--color-primary)',
              }}>
                ₱{Number(seller.totalUnpaid).toFixed(2)}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Reference # (e.g. TXN-20260330-001)"
                value={refMap[seller.sellerId] ?? ''}
                onChange={(e) => setRefMap((prev) => ({ ...prev, [seller.sellerId]: e.target.value }))}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.15)',
                  background: 'rgba(255,255,255,0.06)',
                  color: 'inherit',
                  fontSize: '0.85rem',
                }}
              />
              <button
                type="button"
                disabled={
                  !refMap[seller.sellerId]?.trim() ||
                  (settleMutation.isPending && settlingId === seller.sellerId)
                }
                onClick={() => {
                  setSettlingId(seller.sellerId);
                  settleMutation.mutate({
                    sellerId: seller.sellerId,
                    referenceNumber: refMap[seller.sellerId],
                  });
                }}
                style={{
                  padding: '8px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: !refMap[seller.sellerId]?.trim()
                    ? 'rgba(255,255,255,0.1)'
                    : 'var(--color-primary)',
                  color: '#fff',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: !refMap[seller.sellerId]?.trim() ? 'not-allowed' : 'pointer',
                  opacity: !refMap[seller.sellerId]?.trim() ? 0.5 : 1,
                  whiteSpace: 'nowrap',
                }}
              >
                {settleMutation.isPending && settlingId === seller.sellerId
                  ? 'Settling...'
                  : 'Settle Payout'}
              </button>
            </div>

            {settleMutation.isError && settlingId === seller.sellerId && (
              <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                {(settleMutation.error as any)?.response?.data?.message ?? 'Failed to settle payout.'}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
