import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { requireAuth } from '@/lib/server-api';

export const metadata: Metadata = {
  title: 'My Orders | Artistryx',
  description: 'View and track all your Artistryx orders.',
};

export default async function OrdersLayout({ children }: { children: ReactNode }) {
  await requireAuth();
  return <>{children}</>;
}
