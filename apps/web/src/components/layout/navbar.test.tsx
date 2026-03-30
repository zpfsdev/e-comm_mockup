import { render, screen } from '@testing-library/react';
import { Navbar } from './navbar';

jest.mock('next/link', () => {
  const MockLink = ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  );
  MockLink.displayName = 'MockNextLink';
  return MockLink;
});

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => '/',
  useSearchParams: () => ({ get: jest.fn().mockReturnValue(null) }),
}));

jest.mock('@tanstack/react-query', () => ({
  useQuery: () => ({
    data: { items: [] },
    isError: false,
  }),
}));

jest.mock('@/providers/auth-provider', () => ({
  useAuth: () => ({
    user: {
      firstName: 'Alice',
      lastName: 'Admin',
      roles: ['Admin'],
    },
    isAuthenticated: true,
    logout: jest.fn(),
  }),
}));

jest.mock('@/lib/api-client', () => ({
  apiClient: {
    get: jest.fn(),
  },
}));

describe('Navbar', () => {
  it('renders logo and admin panel link when user is admin', () => {
    render(<Navbar />);

    expect(screen.getByLabelText('Artistryx home')).toBeInTheDocument();
    // The mobile menu renders "Admin Panel" text
    expect(screen.getByText('Admin Panel')).toBeInTheDocument();
  });
});


