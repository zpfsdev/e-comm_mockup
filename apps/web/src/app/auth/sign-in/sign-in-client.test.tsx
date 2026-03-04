import '@testing-library/jest-dom';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SignInClientPage from './sign-in-client';

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

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => ({ get: jest.fn().mockReturnValue(null) }),
}));

jest.mock('@tanstack/react-query', () => ({
  useMutation: jest.fn(),
}));

jest.mock('@/lib/api-client', () => ({
  apiClient: { post: jest.fn() },
  CSRF_TOKEN_KEY: 'csrfToken',
}));

function useMutationMock() {
  return (jest.requireMock('@tanstack/react-query') as { useMutation: jest.Mock })
    .useMutation;
}

describe('SignInClientPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useMutationMock().mockReturnValue({ mutate: jest.fn(), isPending: false });
  });

  it('renders email, password inputs and sign-in button', () => {
    render(<SignInClientPage />);

    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('calls mutate with email and password on submit', async () => {
    const mockMutate = jest.fn();
    useMutationMock().mockReturnValue({ mutate: mockMutate, isPending: false });

    const user = userEvent.setup();
    render(<SignInClientPage />);

    await user.type(screen.getByPlaceholderText(/email/i), 'juan@email.com');
    await user.type(screen.getByPlaceholderText('Password'), 'P@ssw0rd123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(mockMutate).toHaveBeenCalledWith({
      email: 'juan@email.com',
      password: 'P@ssw0rd123',
    });
  });

  it('disables sign-in button while pending', () => {
    useMutationMock().mockReturnValue({ mutate: jest.fn(), isPending: true });
    render(<SignInClientPage />);

    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();
  });

  it('displays error banner when onError is invoked', () => {
    let capturedOnError: ((err: unknown) => void) | undefined;
    useMutationMock().mockImplementation(
      ({ onError }: { onError?: (err: unknown) => void }) => {
        capturedOnError = onError;
        return { mutate: jest.fn(), isPending: false };
      },
    );

    render(<SignInClientPage />);

    act(() => {
      capturedOnError?.({
        response: { data: { message: 'Invalid email or password.' } },
      });
    });

    expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
  });
});
