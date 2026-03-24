import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import { AddToCartInline } from './add-to-cart-inline';

const pushMock = jest.fn();

jest.mock('@tanstack/react-query', () => ({
  useMutation: () => ({
    mutate: jest.fn(),
    isPending: false,
  }),
  useQueryClient: () => ({
    invalidateQueries: jest.fn(),
  }),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
  usePathname: () => '/products',
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock('@/providers/auth-provider', () => ({
  useAuth: () => ({
    isAuthenticated: false,
  }),
}));

jest.mock('@/lib/api-client', () => ({
  apiClient: {
    post: jest.fn(),
  },
}));

describe('AddToCartInline', () => {
  it('redirects unauthenticated users to sign-in with from param', async () => {
    const user = userEvent.setup();
    render(<AddToCartInline productId={1} productName="Toy" className="btn" />);

    const button = screen.getByRole('button', { name: /add toy to cart/i });
    await user.click(button);

    expect(pushMock).toHaveBeenCalledWith('/auth/sign-in?from=%2Fproducts');
  });
});


