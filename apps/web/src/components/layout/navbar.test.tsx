import { render, screen } from '@testing-library/react';
import { Navbar } from './navbar';

jest.mock('next/image', () => {
  return (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} />;
});

jest.mock('next/link', () => {
  return ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    // eslint-disable-next-line jsx-a11y/anchor-is-valid
    <a href={href} {...props}>
      {children}
    </a>
  );
});

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
  it('renders logo and admin dashboard link when user is admin', () => {
    render(<Navbar />);

    expect(screen.getByLabelText('Artistryx home')).toBeInTheDocument();
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
  });
});


