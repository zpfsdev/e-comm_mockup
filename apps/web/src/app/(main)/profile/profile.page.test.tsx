import '@testing-library/jest-dom';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProfilePage from './page';

jest.mock('@/lib/api-client', () => ({
  apiClient: { get: jest.fn(), patch: jest.fn() },
}));

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  useQueryClient: jest.fn().mockReturnValue({ invalidateQueries: jest.fn() }),
}));

const mockProfile = {
  id: 1,
  firstName: 'Juan',
  middleName: undefined,
  lastName: 'dela Cruz',
  username: 'juandc',
  email: 'juan@email.com',
  contactNumber: '09171234567',
  status: 'Active',
  dateTimeRegistered: '2025-01-01T00:00:00Z',
  userRoles: [{ role: { roleName: 'Customer' } }],
};

function mocks() {
  return jest.requireMock('@tanstack/react-query') as {
    useQuery: jest.Mock;
    useMutation: jest.Mock;
  };
}

describe('ProfilePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocks().useQuery.mockReturnValue({ data: undefined, isLoading: false, isError: false });
    mocks().useMutation.mockReturnValue({ mutate: jest.fn(), isPending: false });
  });

  it('shows loading skeleton while fetching', () => {
    mocks().useQuery.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    render(<ProfilePage />);

    expect(screen.queryByRole('heading', { name: /my profile/i })).not.toBeInTheDocument();
  });

  it('renders profile info when data is loaded', () => {
    mocks().useQuery.mockReturnValue({ data: mockProfile, isLoading: false, isError: false });
    render(<ProfilePage />);

    expect(screen.getByRole('heading', { name: /my profile/i })).toBeInTheDocument();
    // Email and username appear as disabled input values
    expect(screen.getByDisplayValue('juan@email.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('juandc')).toBeInTheDocument();
  });

  it('shows error state when profile fetch fails', () => {
    mocks().useQuery.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    render(<ProfilePage />);

    expect(screen.getByText(/failed to load your profile/i)).toBeInTheDocument();
  });

  it('calls mutate with filled form fields on save', async () => {
    const mockMutate = jest.fn();
    mocks().useQuery.mockReturnValue({ data: mockProfile, isLoading: false, isError: false });
    mocks().useMutation.mockReturnValue({ mutate: mockMutate, isPending: false });

    const user = userEvent.setup();
    render(<ProfilePage />);

    // First Name input (enabled, labelled by "First Name")
    const firstNameInput = screen.getByLabelText(/first name/i);
    await user.clear(firstNameInput);
    await user.type(firstNameInput, 'Maria');

    // The submit button renders as "Save" (not "Save Changes")
    await user.click(screen.getByRole('button', { name: /^save$/i }));

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({ firstName: 'Maria' }),
    );
  });

  it('shows success message after successful update', () => {
    let capturedOnSuccess: (() => void) | undefined;
    mocks().useQuery.mockReturnValue({ data: mockProfile, isLoading: false, isError: false });
    mocks().useMutation.mockImplementation(
      ({ onSuccess }: { onSuccess?: () => void }) => {
        capturedOnSuccess = onSuccess;
        return { mutate: jest.fn(), isPending: false };
      },
    );

    render(<ProfilePage />);

    act(() => {
      capturedOnSuccess?.();
    });

    expect(screen.getByText(/profile updated successfully/i)).toBeInTheDocument();
  });

  it('shows error message after failed update', () => {
    let capturedOnError: (() => void) | undefined;
    mocks().useQuery.mockReturnValue({ data: mockProfile, isLoading: false, isError: false });
    mocks().useMutation.mockImplementation(
      ({ onError }: { onError?: () => void }) => {
        capturedOnError = onError;
        return { mutate: jest.fn(), isPending: false };
      },
    );

    render(<ProfilePage />);

    act(() => {
      capturedOnError?.();
    });

    expect(screen.getByText(/failed to update profile/i)).toBeInTheDocument();
  });
});
