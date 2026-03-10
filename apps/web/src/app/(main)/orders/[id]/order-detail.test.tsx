import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import OrderDetailPage from './page';

jest.mock('next/navigation', () => ({
  useParams: jest.fn().mockReturnValue({ id: '101' }),
  useRouter: jest.fn(),
}));

jest.mock('next/link', () => {
  const MockLink = ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  );
  MockLink.displayName = 'MockNextLink';
  return MockLink;
});

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
}));

jest.mock('@/lib/api-client', () => ({
  apiClient: { get: jest.fn() },
}));

const mockOrder = {
  id: 101,
  orderStatus: 'Pending' as const,
  totalAmount: '498.00',
  shippingFee: '58.00',
  orderDate: '2026-01-15T10:00:00Z',
  notes: 'Leave at door',
  orderItems: [
    {
      id: 1,
      quantity: 2,
      price: '199.00',
      orderItemStatus: 'Pending',
      product: { id: 5, name: 'Story Book', imageUrl: undefined },
    },
  ],
  payment: { paymentStatus: 'Unpaid', paymentAmount: '498.00' },
  userAddress: undefined,
};

describe.skip('OrderDetailPage', () => {
  const useQueryMock = () =>
    (jest.requireMock('@tanstack/react-query') as { useQuery: jest.Mock }).useQuery;

  it('shows loading skeleton while fetching', () => {
    useQueryMock().mockReturnValue({ data: undefined, isLoading: true, error: null });

    render(<OrderDetailPage />);

    expect(screen.queryByText(/order #101/i)).not.toBeInTheDocument();
  });

  it('renders order details when data is available', () => {
    useQueryMock().mockReturnValue({ data: mockOrder, isLoading: false, error: null });

    render(<OrderDetailPage />);

    expect(screen.getByText(/order #101/i)).toBeInTheDocument();
    expect(screen.getByText(/story book/i)).toBeInTheDocument();
    expect(screen.getByText(/unpaid/i)).toBeInTheDocument();
    expect(screen.getByText(/leave at door/i)).toBeInTheDocument();
  });

  it('shows not found message when order is null', () => {
    useQueryMock().mockReturnValue({ data: null, isLoading: false, error: new Error('Not found') });

    render(<OrderDetailPage />);

    expect(screen.getByText(/order not found/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to orders/i })).toBeInTheDocument();
  });
});
