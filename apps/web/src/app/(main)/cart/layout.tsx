import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { requireAuth } from '@/lib/server-api';

export const metadata: Metadata = {
  title: 'My Cart | Artistryx',
  description: 'Review and manage items in your Artistryx shopping cart.',
};

export default async function CartLayout({ children }: { children: ReactNode }) {
  await requireAuth();
  return <>{children}</>;
}
