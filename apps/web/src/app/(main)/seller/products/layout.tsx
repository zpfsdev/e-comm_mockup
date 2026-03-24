import type { ReactNode } from 'react';
import { requireAuth } from '@/lib/server-api';

interface Props {
  readonly children: ReactNode;
}

export default async function SellerProductsLayout({ children }: Props) {
  await requireAuth();
  return children;
}

