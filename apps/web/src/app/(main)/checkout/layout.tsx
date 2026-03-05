import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Checkout | Artistryx',
  description: 'Complete your Artistryx order securely.',
};

export default function CheckoutLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
