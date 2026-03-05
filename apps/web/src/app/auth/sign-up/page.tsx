import type { Metadata } from 'next';
import { Suspense } from 'react';
import SignUpClientPage from './sign-up-client';

export const metadata: Metadata = {
  title: 'Create Account | Artistryx',
  description: 'Create an Artistryx account and start shopping early childhood learning products.',
};

function SignUpSkeleton() {
  return (
    <div
      style={{
        minHeight: '100svh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fafbf7',
      }}
      aria-busy="true"
      aria-label="Loading sign-up form"
    >
      <div
        style={{
          width: '100%',
          maxWidth: '28rem',
          padding: 'var(--space-8)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)',
        }}
      >
        {[32, 48, 48, 48, 48, 48, 48, 44].map((h, i) => (
          <div
            key={i}
            style={{
              height: h,
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-card-border)',
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<SignUpSkeleton />}>
      <SignUpClientPage />
    </Suspense>
  );
}
