import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { requireAuth } from '@/lib/server-api';

export const metadata: Metadata = {
  title: 'Checkout | Artistryx',
  description: 'Complete your Artistryx order securely.',
};

export default async function CheckoutLayout({ children }: { children: ReactNode }) {
  await requireAuth();
  return <>{children}</>;
}
