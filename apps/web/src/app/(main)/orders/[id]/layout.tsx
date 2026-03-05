import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Order Details | Artistryx',
  description: 'Track and review your Artistryx order details.',
};

export default function OrderDetailLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
