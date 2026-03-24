'use client';

import Link from 'next/link';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';

interface OrdersTabsProps {
  activeTab: string;
}

export function OrdersTabs({ activeTab }: OrdersTabsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const tabItems = [
    { label: 'All', value: 'all' },
    { label: 'To Pay', value: 'to-pay' },
    { label: 'To Ship', value: 'to-ship' },
    { label: 'To Receive', value: 'to-receive' },
    { label: 'Completed', value: 'completed' },
    { label: 'Cancelled', value: 'cancelled' },
  ];

  function handleTabClick(e: React.MouseEvent<HTMLAnchorElement>, value: string) {
    e.preventDefault();
    if (isPending) return;
    startTransition(() => {
      router.push(`/orders?tab=${value}`);
    });
  }

  return (
    <div style={{ 
      display: 'flex', 
      gap: 'var(--space-2)', 
      borderBottom: '1px solid var(--color-card-border)', 
      marginBottom: 'var(--space-6)',
      overflowX: 'auto',
      whiteSpace: 'nowrap',
      paddingBottom: '1px'
    }} className="no-scrollbar">
      {tabItems.map(tab => {
        const isActive = activeTab === tab.value;
        const opacity = isPending ? 0.6 : 1;
        return (
          <Link 
            key={tab.value}
            href={`/orders?tab=${tab.value}`}
            onClick={(e) => handleTabClick(e, tab.value)}
            style={{
              padding: 'var(--space-3) var(--space-4)',
              textDecoration: 'none',
              color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
              borderBottom: isActive ? '2px solid var(--color-primary)' : '2px solid transparent',
              fontWeight: isActive ? 600 : 400,
              fontSize: '0.925rem',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              opacity,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              backgroundColor: isActive ? 'rgba(220, 130, 66, 0.04)' : 'transparent',
              borderRadius: 'var(--radius-md) var(--radius-md) 0 0'
            }}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
