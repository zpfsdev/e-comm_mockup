import type { Metadata } from 'next';
import { Suspense } from 'react';
import SignInClientPage from './sign-in-client';

export const metadata: Metadata = {
  title: 'Sign In | Artistryx',
  description: 'Sign in to your Artistryx account to shop early childhood learning products.',
};

function SignInSkeleton() {
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
      aria-label="Loading sign-in form"
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
        {[240, 32, 48, 48, 44].map((h, i) => (
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

export default function SignInPage() {
  return (
    <Suspense fallback={<SignInSkeleton />}>
      <SignInClientPage />
    </Suspense>
  );
}
