import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'My Profile | Artistryx',
  description: 'Manage your Artistryx account details and preferences.',
};

export default function ProfileLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
