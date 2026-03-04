'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

interface QueryProviderProps {
  children: React.ReactNode;
}

const QUERY_CLIENT_OPTIONS = {
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: 1,
    },
  },
};

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(() => new QueryClient(QUERY_CLIENT_OPTIONS));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
