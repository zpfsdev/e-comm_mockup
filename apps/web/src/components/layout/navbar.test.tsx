import { render, screen } from '@testing-library/react';
import { Navbar } from './navbar';

jest.mock('next/image', () => {
  const MockImage = ({
    priority: _priority,
    fill: _fill,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & {
    priority?: boolean;
    fill?: boolean;
  }) => <img {...props} alt={props.alt ?? ''} />;
  MockImage.displayName = 'MockNextImage';
  return MockImage;
});

jest.mock('next/link', () => {
  const MockLink = ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  );
  MockLink.displayName = 'MockNextLink';
  return MockLink;
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


