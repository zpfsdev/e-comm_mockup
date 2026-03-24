import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { requireAuth } from '@/lib/server-api';

export const metadata: Metadata = {
  title: 'My Profile | Artistryx',
  description: 'Manage your Artistryx account details and preferences.',
};

export default async function ProfileLayout({ children }: { children: ReactNode }) {
  await requireAuth();
  return <>{children}</>;
}
