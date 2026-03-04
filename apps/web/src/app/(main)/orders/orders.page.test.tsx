/**
 * The orders list page is an async RSC that calls serverFetch on the server.
 * In the jsdom test environment we mock serverFetch and render the component
 * synchronously (Next.js RSC test support requires resolving the async component).
 */
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import OrdersPage from './page';

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

jest.mock('@/lib/server-api', () => ({
  serverFetch: jest.fn(),
}));

jest.mock('./orders-error', () => ({
  OrdersError: () => <p>Failed to load your orders. Please try again.</p>,
}));

const mockOrders = [
  {
    id: 101,
    orderStatus: 'Pending' as const,
    totalAmount: 498,
    orderDate: '2026-01-15T10:00:00Z',
    orderItems: [
      { id: 1, quantity: 2, product: { name: 'Story Book', imageUrl: undefined } },
    ],
  },
];

function serverFetchMock() {
  return (jest.requireMock('@/lib/server-api') as { serverFetch: jest.Mock }).serverFetch;
}

async function renderPage() {
  const jsx = await OrdersPage();
  return render(jsx);
}

describe('OrdersPage (RSC)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders order cards when orders are returned', async () => {
    serverFetchMock().mockResolvedValue({
      orders: mockOrders,
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });

    await renderPage();

    expect(screen.getByRole('heading', { name: /my orders/i })).toBeInTheDocument();
    expect(screen.getByText(/order #101/i)).toBeInTheDocument();
    expect(screen.getByText(/pending/i)).toBeInTheDocument();
    expect(screen.getByText(/story book/i)).toBeInTheDocument();
  });

  it('shows empty state when there are no orders', async () => {
    serverFetchMock().mockResolvedValue({
      orders: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    });

    await renderPage();

    expect(screen.getByText(/haven't placed any orders yet/i)).toBeInTheDocument();
  });

  it('renders OrdersError when serverFetch throws', async () => {
    serverFetchMock().mockRejectedValue(new Error('API error'));

    await renderPage();

    expect(screen.getByText(/failed to load your orders/i)).toBeInTheDocument();
  });
});
