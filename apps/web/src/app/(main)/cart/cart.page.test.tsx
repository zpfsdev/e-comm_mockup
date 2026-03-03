import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import CartPage from './page';

jest.mock('next/image', () => {
  return (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} />;
});

jest.mock('next/link', () => {
  return ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    // eslint-disable-next-line jsx-a11y/anchor-is-valid
    <a href={href} {...props}>
      {children}
    </a>
  );
});

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn().mockReturnValue({ mutate: jest.fn() }),
  useQueryClient: jest.fn().mockReturnValue({ invalidateQueries: jest.fn() }),
}));

describe('CartPage', () => {
  it('renders empty cart message when there are no items', () => {
    const useQueryMock = require('@tanstack/react-query').useQuery as jest.Mock;
    useQueryMock.mockReturnValue({
      data: { items: [] },
      isLoading: false,
      isError: false,
    });

    render(<CartPage />);

    expect(
      screen.getByText(/your cart is empty\. you haven't added anything yet\./i),
    ).toBeInTheDocument();
  });
});


