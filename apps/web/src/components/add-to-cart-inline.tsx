'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers/auth-provider';
import { apiClient } from '@/lib/api-client';

interface AddToCartInlineProps {
  readonly productId: number;
  readonly productName: string;
  readonly className?: string;
}

export function AddToCartInline({ productId, productName, className }: AddToCartInlineProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState<'added' | 'error' | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const mutation = useMutation({
    mutationFn: () => apiClient.post('/cart/items', { productId, quantity: 1 }),
    onSuccess: () => {
      setFeedback('added');
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      timeoutRef.current = setTimeout(() => setFeedback(null), 2000);
    },
    onError: () => {
      setFeedback('error');
      timeoutRef.current = setTimeout(() => setFeedback(null), 2500);
    },
  });

  function handleClick() {
    if (!isAuthenticated) {
      const from = `${pathname}${window.location.search}`;
      router.push(`/auth/sign-in?from=${encodeURIComponent(from)}`);
      return;
    }
    mutation.mutate();
  }

  const buttonLabel =
    mutation.isPending
      ? 'Adding…'
      : feedback === 'added'
        ? '✓ Added!'
        : feedback === 'error'
          ? 'Try again'
          : 'Add to Cart';

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={handleClick}
        disabled={mutation.isPending}
        aria-label={`Add ${productName} to cart`}
      >
        {buttonLabel}
      </button>
      <span aria-live="polite" style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', border: 0 }}>
        {feedback === 'added' ? 'Added to cart' : feedback === 'error' ? 'Failed to add to cart' : ''}
      </span>
    </>
  );
}
