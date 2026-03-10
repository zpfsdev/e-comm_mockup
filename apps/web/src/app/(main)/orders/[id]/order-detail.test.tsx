import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import OrderDetailPage from './page';
import { notFound } from 'next/navigation';
import { serverFetch } from '@/lib/server-api';

jest.mock('next/navigation', () => ({
  notFound: jest.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

jest.mock('@/lib/server-api', () => ({
  serverFetch: jest.fn(),
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

describe('OrderDetailPage', () => {
  const serverFetchMock = serverFetch as jest.Mock;
  const notFoundMock = notFound as jest.Mock;

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
