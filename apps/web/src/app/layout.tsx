import type { Metadata } from 'next';
import { Outfit, Paytone_One } from 'next/font/google';
import './globals.css';
import { QueryProvider } from '@/providers/query-provider';
import { AuthProvider } from '@/providers/auth-provider';
import { Toaster } from 'sonner';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

const paytoneOne = Paytone_One({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-paytone-one',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Artistryx — Early Childhood Learning Products',
  description:
    'Premium early childhood learning treasures designed to inspire creativity and independence.',
  icons: {
    icon: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} ${paytoneOne.variable}`}>
      <body>
        <QueryProvider>
          <AuthProvider>{children}</AuthProvider>
        </QueryProvider>
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
