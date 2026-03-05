import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { requireAuth } from '@/lib/server-api';

export const metadata: Metadata = {
  title: 'Order Details | Artistryx',
  description: 'Track and review your Artistryx order details.',
};

export default async function OrderDetailLayout({ children }: { children: ReactNode }) {
  await requireAuth();
  return <>{children}</>;
}
