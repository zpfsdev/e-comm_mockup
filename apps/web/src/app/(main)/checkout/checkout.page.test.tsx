import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import CheckoutPage from './page';

jest.mock('next/link', () => {
  const MockLink = ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>{children}</a>
  );
  MockLink.displayName = 'MockNextLink';
  return MockLink;
});

jest.mock('@/lib/api-client', () => ({
  apiClient: { get: jest.fn(), post: jest.fn() },
}));

jest.mock('@/lib/constants', () => ({
  SHIPPING_FEE: 58,
}));

/**
 * The checkout page makes FOUR useQuery calls (in order):
 *  1. checkout-profile
 *  2. checkout-addresses
 *  3. cart
 *  4. (potentially more in nested components)
 *
 * We use a factory so each test can configure the call sequence.
 */
function makeUseQueryMock(cartData: unknown) {
  let callCount = 0;
  return jest.fn().mockImplementation(() => {
    callCount++;
    if (callCount === 1) {
      // checkout-profile
      return { data: undefined, isLoading: false, isError: false };
    }
    if (callCount === 2) {
      // checkout-addresses → must be an array
      return { data: [], isLoading: false, isError: false };
    }
    // cart query
    if (cartData instanceof Error || cartData === 'error') {
      return { data: undefined, isLoading: false, isError: true, refetch: jest.fn(), isFetching: false };
    }
    if (cartData === 'loading') {
      return { data: undefined, isLoading: true, isError: false, refetch: jest.fn(), isFetching: false };
    }
    return { data: cartData, isLoading: false, isError: false, refetch: jest.fn(), isFetching: false };
  });
}

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn().mockReturnValue({ mutate: jest.fn(), isPending: false }),
  useQueryClient: jest.fn().mockReturnValue({ invalidateQueries: jest.fn() }),
}));

function rq() {
  return jest.requireMock('@tanstack/react-query') as {
    useQuery: jest.Mock;
    useMutation: jest.Mock;
  };
}

describe('CheckoutPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    rq().useMutation.mockReturnValue({ mutate: jest.fn(), isPending: false });
  });

  it('shows loading skeleton while cart is fetching', () => {
    rq().useQuery.mockImplementation(makeUseQueryMock('loading'));
    render(<CheckoutPage />);

    expect(screen.queryByRole('heading', { name: /checkout/i })).not.toBeInTheDocument();
  });

  it('shows empty cart message when cart has no items', () => {
    rq().useQuery.mockImplementation(makeUseQueryMock({ items: [] }));
    render(<CheckoutPage />);

    expect(screen.getByRole('heading', { name: /checkout/i })).toBeInTheDocument();
    expect(screen.getByText(/no items selected for checkout/i)).toBeInTheDocument();
  });

  it('renders cart items and place order button when cart has items', () => {
    rq().useQuery.mockImplementation(
      makeUseQueryMock({
        items: [
          { id: 1, quantity: 2, product: { id: 5, name: 'Story Book', price: 199, imageUrl: undefined } },
        ],
      }),
    );
    render(<CheckoutPage />);

    expect(screen.getByRole('heading', { name: /checkout/i })).toBeInTheDocument();
    expect(screen.getByText(/story book/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /place order/i })).toBeInTheDocument();
  });

  it('shows error message when cart load fails', () => {
    rq().useQuery.mockImplementation(makeUseQueryMock('error'));
    render(<CheckoutPage />);

    expect(screen.getByText(/failed to load your cart/i)).toBeInTheDocument();
  });
});
