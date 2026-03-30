import '@testing-library/jest-dom';

jest.mock('next/navigation', () => {
  return {
    useRouter: () => ({
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    }),
    usePathname: () => '/',
    useSearchParams: () => ({
      get: jest.fn().mockReturnValue(null),
      toString: () => '',
    }),
  };
});

// Global auth mock — individual tests can override with jest.mocked(useAuth).mockReturnValue(...)
jest.mock('@/providers/auth-provider', () => ({
  useAuth: jest.fn().mockReturnValue({
    user: { sub: 1, firstName: 'Test', lastName: 'User', roles: ['Customer'] },
    isAuthenticated: true,
    isLoading: false,
    logout: jest.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));
