import type { ReactNode } from 'react';
import { requireAuth } from '@/lib/server-api';

interface Props {
  readonly children: ReactNode;
}

export default async function AdminLayout({ children }: Props) {
  await requireAuth();
  return children;
}

