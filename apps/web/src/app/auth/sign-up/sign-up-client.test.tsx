import '@testing-library/jest-dom';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SignUpClientPage from './sign-up-client';

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

describe('SignUpClientPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useMutationMock().mockReturnValue({ mutate: jest.fn(), isPending: false });
  });

  it('renders key form fields', () => {
    render(<SignUpClientPage />);

    expect(screen.getByPlaceholderText(/first name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/last name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/email address/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/username/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('shows error when passwords do not match without calling mutate', async () => {
    const mockMutate = jest.fn();
    useMutationMock().mockReturnValue({ mutate: mockMutate, isPending: false });

    const user = userEvent.setup();
    render(<SignUpClientPage />);

    await user.type(screen.getByPlaceholderText('Password'), 'abc123');
    await user.type(screen.getByPlaceholderText('Confirm Password'), 'different');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('disables create account button while pending', () => {
    useMutationMock().mockReturnValue({ mutate: jest.fn(), isPending: true });
    render(<SignUpClientPage />);

    expect(screen.getByRole('button', { name: /creating account/i })).toBeDisabled();
  });

  it('shows API error banner when onError is invoked', () => {
    let capturedOnError: ((err: unknown) => void) | undefined;
    useMutationMock().mockImplementation(
      ({ onError }: { onError?: (err: unknown) => void }) => {
        capturedOnError = onError;
        return { mutate: jest.fn(), isPending: false };
      },
    );

    render(<SignUpClientPage />);

    act(() => {
      capturedOnError?.({
        response: { data: { message: 'Email already in use.' } },
      });
    });

    expect(screen.getByText(/email already in use/i)).toBeInTheDocument();
  });
});
