import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import OrderDetailPage from './page';
import { notFound } from 'next/navigation';
import { serverFetch } from '@/lib/server-api';

jest.mock('next/navigation', () => ({
  notFound: jest.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
  useRouter: () => ({ refresh: jest.fn() }),
}));

jest.mock('next/link', () => {
  const MockLink = ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>{children}</a>
  );
  MockLink.displayName = 'MockNextLink';
  return MockLink;
});

jest.mock('@/lib/server-api', () => ({
  serverFetch: jest.fn(),
}));

jest.mock('@tanstack/react-query', () => ({
  useMutation: jest.fn().mockReturnValue({ mutate: jest.fn(), isPending: false, isError: false }),
  useQueryClient: jest.fn().mockReturnValue({ invalidateQueries: jest.fn() }),
}));

jest.mock('@/lib/api-client', () => ({
  apiClient: { post: jest.fn() },
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
      product: { id: 5, name: 'Story Book', imageUrl: undefined, seller: { id: 1, shopName: 'Test Store' } },
      review: null,
    },
  ],
  payment: { paymentStatus: 'Unpaid', paymentAmount: '498.00' },
  userAddress: null,
};

describe('OrderDetailPage', () => {
  const serverFetchMock = serverFetch as jest.Mock;
  const notFoundMock = notFound as unknown as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders order details when data is available', async () => {
    serverFetchMock.mockResolvedValue(mockOrder);

    const ui = await OrderDetailPage({ params: Promise.resolve({ id: '101' }) });
    render(ui);

    expect(screen.getByText(/order #101/i)).toBeInTheDocument();
    expect(screen.getByText(/story book/i)).toBeInTheDocument();
    expect(screen.getByText(/unpaid/i)).toBeInTheDocument();
    expect(screen.getByText(/leave at door/i)).toBeInTheDocument();
  });

  it('invokes notFound when the order fetch fails', async () => {
    serverFetchMock.mockRejectedValue(new Error('Not found'));

    await expect(
      OrderDetailPage({ params: Promise.resolve({ id: '999' }) }),
    ).rejects.toThrow('NEXT_NOT_FOUND');
    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });
});
