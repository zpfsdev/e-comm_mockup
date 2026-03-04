import '@testing-library/jest-dom';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CheckoutPage from './page';

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

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('@/lib/api-client', () => ({
  apiClient: { get: jest.fn(), post: jest.fn() },
}));

jest.mock('@/lib/constants', () => ({
  SHIPPING_FEE: 58,
}));

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  useQueryClient: jest.fn().mockReturnValue({ invalidateQueries: jest.fn() }),
}));

const mockCartItems = [
  {
    id: 1,
    quantity: 2,
    product: { id: 5, name: 'Story Book', price: 199, imageUrl: undefined },
  },
];

function mocks() {
  return jest.requireMock('@tanstack/react-query') as {
    useQuery: jest.Mock;
    useMutation: jest.Mock;
  };
}

describe('CheckoutPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocks().useMutation.mockReturnValue({ mutate: jest.fn(), isPending: false });
  });

  it('shows loading skeleton while cart is fetching', () => {
    mocks().useQuery.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    render(<CheckoutPage />);

    expect(screen.queryByRole('heading', { name: /checkout/i })).not.toBeInTheDocument();
  });

  it('shows empty cart message when cart has no items', () => {
    mocks().useQuery.mockReturnValue({
      data: { items: [] },
      isLoading: false,
      isError: false,
    });
    render(<CheckoutPage />);

    expect(screen.getByRole('heading', { name: /checkout/i })).toBeInTheDocument();
    expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument();
  });

  it('renders cart items and place order button when cart has items', () => {
    mocks().useQuery.mockReturnValue({
      data: { items: mockCartItems },
      isLoading: false,
      isError: false,
    });
    render(<CheckoutPage />);

    expect(screen.getByRole('heading', { name: /checkout/i })).toBeInTheDocument();
    expect(screen.getByText(/story book/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /place order/i })).toBeInTheDocument();
  });

  it('shows error message when cart load fails', () => {
    mocks().useQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: jest.fn(),
      isFetching: false,
    });
    render(<CheckoutPage />);

    expect(screen.getByText(/failed to load your cart/i)).toBeInTheDocument();
  });

  it('shows order error banner when onError is invoked', () => {
    mocks().useQuery.mockReturnValue({
      data: { items: mockCartItems },
      isLoading: false,
      isError: false,
    });

    let capturedOnError: ((err: unknown) => void) | undefined;
    mocks().useMutation.mockImplementation(
      ({ onError }: { onError?: (err: unknown) => void }) => {
        capturedOnError = onError;
        return { mutate: jest.fn(), isPending: false };
      },
    );

    render(<CheckoutPage />);

    act(() => {
      capturedOnError?.({
        response: { data: { message: 'Insufficient stock.' } },
      });
    });

    expect(screen.getByText(/insufficient stock/i)).toBeInTheDocument();
  });

  it('calls mutate with items and delivery address on form submit', async () => {
    const mockMutate = jest.fn();
    mocks().useQuery.mockReturnValue({
      data: { items: mockCartItems },
      isLoading: false,
      isError: false,
    });
    mocks().useMutation.mockReturnValue({ mutate: mockMutate, isPending: false });

    const user = userEvent.setup();
    render(<CheckoutPage />);

    await user.type(screen.getByPlaceholderText('123 Rizal St.'), '123 Rizal St.');
    await user.type(screen.getByPlaceholderText('Brgy. San Roque'), 'Brgy. San Roque');
    await user.type(screen.getByPlaceholderText('Legazpi City'), 'Legazpi City');
    await user.click(screen.getByRole('button', { name: /place order/i }));

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        items: [{ productId: 5, quantity: 2 }],
        deliveryAddress: expect.objectContaining({ streetLine: '123 Rizal St.' }),
      }),
    );
  });
});
