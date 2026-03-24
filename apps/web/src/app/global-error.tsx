'use client';

import { useEffect } from 'react';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: '1.5rem',
          padding: '2rem',
          textAlign: 'center',
          fontFamily: 'sans-serif',
          background: '#fff',
        }}
      >
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Something went wrong</h2>
        <p style={{ color: '#6b7280', maxWidth: '28rem' }}>
          A critical error occurred. Please try refreshing the page.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            padding: '0.6rem 1.5rem',
            background: '#dc8242',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
