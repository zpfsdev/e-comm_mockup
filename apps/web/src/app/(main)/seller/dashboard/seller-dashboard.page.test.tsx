import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SellerDashboardPage from './page';

jest.mock('@/providers/auth-provider', () => ({
  useAuth: jest.fn().mockReturnValue({ user: { id: 2, firstName: 'Seller', lastName: 'User' } }),
}));

jest.mock('@/lib/api-client', () => ({
  apiClient: { get: jest.fn(), patch: jest.fn(), delete: jest.fn() },
}));

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  useQueryClient: jest.fn().mockReturnValue({ invalidateQueries: jest.fn() }),
}));

import { useQuery, useMutation } from '@tanstack/react-query';

const mockStats = {
  totalRevenue: '5000.00',
  totalOrders: 25,
  totalProducts: 10,
  pendingOrders: 2,
};

describe('SellerDashboardPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useQuery as jest.Mock).mockImplementation((options) => {
      const key = options?.queryKey?.[0];
      if (key === 'seller-stats') return { data: mockStats, isLoading: false, isError: false };
      if (key === 'seller-products') return { data: { products: [], total: 0 }, isLoading: false, isError: false };
      if (key === 'seller-dashboard') return { data: { recentOrders: [], recentCommissions: [] }, isLoading: false, isError: false };
      if (key === 'categories') return { data: [{ id: 1, categoryName: 'Toys' }], isLoading: false, isError: false };
      if (key === 'age-ranges') return { data: [{ id: 1, label: '0-3 Years' }], isLoading: false, isError: false };
      return { data: undefined, isLoading: false, isError: false };
    });
    (useMutation as jest.Mock).mockReturnValue({ mutate: jest.fn(), isPending: false });
  });

  it('renders dashboard overview statistics', async () => {
    render(<SellerDashboardPage />);
    
    expect(screen.getByRole('heading', { name: /seller dashboard/i })).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('PHP 5000.00')).toBeInTheDocument(); // totalRevenue
      expect(screen.getByText('25')).toBeInTheDocument(); // totalOrders
      expect(screen.getByText('10')).toBeInTheDocument(); // activeProducts
      expect(screen.getByText('2')).toBeInTheDocument(); // pendingOrders
    });
  });

  it('renders section headers correctly', () => {
    render(<SellerDashboardPage />);
    
    expect(screen.getByRole('heading', { name: /my products/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /orders/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /recent commissions/i })).toBeInTheDocument();
  });

  it('swaps to inline product form when Add Product is clicked', async () => {
    const user = userEvent.setup();
    render(<SellerDashboardPage />);
    
    const addBtn = screen.getByRole('button', { name: /add product/i });
    await user.click(addBtn);
    
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /add new product/i })).toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: /orders/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: /recent commissions/i })).not.toBeInTheDocument();
    });
  });
});
