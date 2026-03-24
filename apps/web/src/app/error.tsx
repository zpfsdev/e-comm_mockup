'use client';

import { useEffect } from 'react';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: '1.5rem',
        padding: '2rem',
        textAlign: 'center',
        fontFamily: 'var(--font-body, sans-serif)',
      }}
    >
      <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text, #1a1a1a)' }}>
        Something went wrong
      </h2>
      <p style={{ color: 'var(--color-text-muted, #6b7280)', maxWidth: '28rem' }}>
        An unexpected error occurred. You can try again or return to the home page.
      </p>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <button
          type="button"
          onClick={reset}
          style={{
            padding: '0.6rem 1.5rem',
            background: 'var(--color-accent-soft, #dc8242)',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
        <Link
          href="/"
          style={{
            padding: '0.6rem 1.5rem',
            background: 'transparent',
            color: 'var(--color-accent-soft, #dc8242)',
            border: '1.5px solid var(--color-accent-soft, #dc8242)',
            borderRadius: '6px',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
