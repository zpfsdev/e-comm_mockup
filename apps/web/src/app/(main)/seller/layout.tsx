import type { ReactNode } from 'react';
import { requireAuth } from '@/lib/server-api';

interface Props {
  readonly children: ReactNode;
}

export default async function SellerLayout({ children }: Props) {
  await requireAuth();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <main style={{ flex: 1 }}>{children}</main>
    </div>
  );
}
