'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button/button';

interface ReviewButtonProps {
  orderItemId: number;
  productName: string;
  existingReview?: { rating: number; comment?: string } | null;
}

export function ReviewButton({ orderItemId, productName, existingReview }: ReviewButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState<number>(existingReview?.rating || 0);
  const [comment, setComment] = useState<string>(existingReview?.comment || '');
  const [hoverRating, setHoverRating] = useState<number>(0);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post(`/reviews`, {
        orderItemId,
        rating,
        comment: comment.trim() !== '' ? comment.trim() : undefined,
      });
      return res.data;
    },
    onSuccess: () => {
      setIsOpen(false);
      // Wait for server-side revalidation or force client refresh
      window.location.reload(); 
    },
  });

  if (existingReview) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: 'var(--space-2)' }}>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>You rated:</span>
        <div style={{ display: 'flex', gap: '2px' }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <svg key={star} width="12" height="12" viewBox="0 0 24 24" fill={existingReview.rating >= star ? '#fbbf24' : 'none'} stroke={existingReview.rating >= star ? '#fbbf24' : '#ccc'} strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setIsOpen(true)} style={{ marginTop: 'var(--space-2)' }}>
        Write a Review
      </Button>

      {isOpen && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-4)'
        }}>
          <div style={{
            background: 'var(--surface-primary)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-6)',
            width: '100%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>Review Product</h3>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-6)' }}>{productName}</p>
            
            <div style={{ display: 'flex', gap: '8px', marginBottom: 'var(--space-6)', justifyContent: 'center' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  <svg width="32" height="32" viewBox="0 0 24 24" fill={(hoverRating || rating) >= star ? '#fbbf24' : 'none'} stroke={(hoverRating || rating) >= star ? '#fbbf24' : '#ccc'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'all 0.1s ease' }}>
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </button>
              ))}
            </div>

            <textarea
              placeholder="What did you think about this product? (Optional)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              style={{
                width: '100%', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-input-border)', background: 'var(--color-input-bg)',
                color: 'var(--color-text)', resize: 'vertical', marginBottom: 'var(--space-6)',
                fontFamily: 'inherit', fontSize: 'var(--text-sm)'
              }}
            />

            <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={mutation.isPending}>
                Cancel
              </Button>
              <Button 
                type="button" 
                variant="primary" 
                onClick={() => mutation.mutate()} 
                disabled={rating === 0 || mutation.isPending}
              >
                {mutation.isPending ? 'Submitting...' : 'Submit Review'}
              </Button>
            </div>
            {mutation.isError && (
              <p style={{ color: 'var(--color-error)', fontSize: 'var(--text-xs)', marginTop: 'var(--space-3)', textAlign: 'right' }}>
                Failed to submit review.
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
