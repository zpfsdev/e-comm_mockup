import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import CartPage from './page';

jest.mock('next/link', () => {
  const MockLink = ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  );
  MockLink.displayName = 'MockNextLink';
  return MockLink;
});

// Each useQuery call needs a correct return type.
// cart → { items: [] }, addresses → []
jest.mock('@tanstack/react-query', () => {
  let callCount = 0;
  const useQueryMock = jest.fn().mockImplementation(() => {
    callCount++;
    if (callCount === 1) {
      // First call: cart query → empty cart
      return { data: { items: [] }, isLoading: false, isError: false, refetch: jest.fn(), isFetching: false };
    }
    if (callCount === 2) {
      // Second call: cart-profile query
      return { data: undefined, isLoading: false, isError: false };
    }
    // Third call: addresses query  → empty array so .find() works
    return { data: [], isLoading: false, isError: false };
  });

  return {
    useQuery: useQueryMock,
    useMutation: jest.fn().mockReturnValue({ mutate: jest.fn() }),
    useQueryClient: jest.fn().mockReturnValue({ invalidateQueries: jest.fn() }),
  };
});

describe('CartPage', () => {
  beforeEach(() => {
    // Reset call count between tests by clearing mock
    const rq = jest.requireMock('@tanstack/react-query') as { useQuery: jest.Mock };
    let callCount = 0;
    rq.useQuery.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return { data: { items: [] }, isLoading: false, isError: false, refetch: jest.fn(), isFetching: false };
      if (callCount === 2) return { data: undefined, isLoading: false, isError: false };
      return { data: [], isLoading: false, isError: false };
    });
  });

  it('renders empty cart message when there are no items', () => {
    render(<CartPage />);

    expect(
      screen.getByText(/your cart is empty\. you haven't added anything yet\./i),
    ).toBeInTheDocument();
  });
});
