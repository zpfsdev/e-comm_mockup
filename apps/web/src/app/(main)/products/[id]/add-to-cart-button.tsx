'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers/auth-provider';
import { apiClient } from '@/lib/api-client';
import styles from './product-detail.module.css';

interface AddToCartButtonProps {
  readonly productId: number;
  readonly stock?: number;
}

const MIN_QTY = 1;
const MAX_QTY = 99;

export function AddToCartButton({ productId, stock }: AddToCartButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(1);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  );
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const mutation = useMutation({
    mutationFn: () => apiClient.post('/cart/items', { productId, quantity }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      setFeedback({ type: 'success', message: 'Added to cart!' });
      timeoutRef.current = setTimeout(() => setFeedback(null), 3000);
    },
    onError: () => {
      setFeedback({ type: 'error', message: 'Failed to add to cart. Please try again.' });
      timeoutRef.current = setTimeout(() => setFeedback(null), 3000);
    },
  });

  const buyNowMutation = useMutation({
    mutationFn: () => apiClient.post('/cart/items', { productId, quantity }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      router.push('/checkout');
    },
    onError: () => {
      setFeedback({ type: 'error', message: 'Failed to add to cart. Please try again.' });
      timeoutRef.current = setTimeout(() => setFeedback(null), 3000);
    },
  });

  function handleAddToCart() {
    if (isOutOfStock) {
      return;
    }
    if (!isAuthenticated) {
      const from = `${pathname}${window.location.search}`;
      router.push(`/auth/sign-in?from=${encodeURIComponent(from)}`);
      return;
    }
    mutation.mutate();
  }

  function handleBuyNow() {
    if (isOutOfStock) {
      return;
    }
    if (!isAuthenticated) {
      const from = '/checkout';
      router.push(`/auth/sign-in?from=${encodeURIComponent(from)}`);
      return;
    }
    buyNowMutation.mutate();
  }

  const isPending = mutation.isPending || buyNowMutation.isPending;
  const isOutOfStock = stock !== undefined && stock <= 0;

  return (
    <>
      <div className={styles.quantityRow}>
        <span className={styles.quantityLabel}>Quantity:</span>
        <div className={styles.quantityControls}>
          <button
            type="button"
            className={styles.quantityBtn}
            onClick={() => setQuantity((q) => Math.max(MIN_QTY, q - 1))}
            disabled={isOutOfStock || quantity <= MIN_QTY}
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className={styles.quantityValue} aria-live="polite">
            {quantity}
          </span>
          <button
            type="button"
            className={styles.quantityBtn}
            onClick={() => setQuantity((q) => Math.min(MAX_QTY, q + 1))}
            disabled={isOutOfStock || quantity >= MAX_QTY}
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
      </div>

      {feedback && feedback.type === 'error' && (
        <p
          className={`${styles.feedback} ${styles.feedbackError}`}
          role="status"
        >
          {feedback.message}
        </p>
      )}

      <div className={styles.actionRow}>
        <button
          type="button"
          className={styles.btnAddToCart}
          onClick={handleAddToCart}
          disabled={isOutOfStock || isPending || feedback?.type === 'success'}
          style={feedback?.type === 'success' ? { backgroundColor: 'var(--color-success)', color: 'white', borderColor: 'var(--color-success)' } : undefined}
        >
          {isOutOfStock ? 'Out of Stock' : mutation.isPending ? 'Adding…' : feedback?.type === 'success' ? 'Added to Cart!' : 'Add to Cart'}
        </button>
        <button
          type="button"
          className={styles.btnBuyNow}
          onClick={handleBuyNow}
          disabled={isOutOfStock || isPending}
        >
          {isOutOfStock ? 'Out of Stock' : buyNowMutation.isPending ? 'Processing…' : 'Buy Now'}
        </button>
      </div>
    </>
  );
}
