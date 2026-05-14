import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminDashboardPage from './page';

jest.mock('next/navigation', () => ({
  usePathname: jest.fn().mockReturnValue('/admin/dashboard'),
}));

jest.mock('@/providers/auth-provider', () => ({
  useAuth: jest.fn().mockReturnValue({ user: { id: 1, firstName: 'Admin', lastName: 'User', userRoles: [{ role: { roleName: 'Admin' } }] } }),
}));

jest.mock('@/lib/api-client', () => ({
  apiClient: { get: jest.fn(), patch: jest.fn(), post: jest.fn() },
}));

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  useQueryClient: jest.fn().mockReturnValue({ invalidateQueries: jest.fn() }),
}));

import { useQuery, useMutation } from '@tanstack/react-query';

const mockStats = {
  totalUsers: 15,
  totalSellers: 5,
  totalOrders: 50,
  totalProducts: 120,
};

describe('AdminDashboardPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useQuery as jest.Mock).mockImplementation((options) => {
      const key = options?.queryKey?.[0];
      if (key === 'admin-stats') return { data: mockStats, isLoading: false, isError: false };
      if (key === 'admin-users') return { data: { users: [], total: 0 }, isLoading: false, isError: false };
      if (key === 'admin-shops') return { data: { shops: [], total: 0 }, isLoading: false, isError: false };
      if (key === 'admin-disputes') return { data: [], isLoading: false, isError: false };
      if (key === 'admin-payouts') return { data: [], isLoading: false, isError: false };
      return { data: undefined, isLoading: false, isError: false };
    });
    (useMutation as jest.Mock).mockReturnValue({ mutate: jest.fn(), isPending: false });
  });

  it('renders dashboard overview statistics', async () => {
    render(<AdminDashboardPage />);
    
    expect(screen.getByRole('heading', { name: /admin dashboard/i })).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('15')).toBeInTheDocument(); // totalUsers
      expect(screen.getByText('5')).toBeInTheDocument(); // totalSellers
      expect(screen.getByText('50')).toBeInTheDocument(); // totalOrders
      expect(screen.getByText('120')).toBeInTheDocument(); // totalProducts
    });
  });

  it('renders section headers correctly', () => {
    render(<AdminDashboardPage />);
    
    expect(screen.getByText('User Management')).toBeInTheDocument();
    expect(screen.getByText('Shop Management')).toBeInTheDocument();
    expect(screen.getByText('Dispute Management')).toBeInTheDocument();
    expect(screen.getByText('Seller Payouts')).toBeInTheDocument();
  });
});
