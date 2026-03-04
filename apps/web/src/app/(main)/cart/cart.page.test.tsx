import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import CartPage from './page';

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
  const MockLink = ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  );
  MockLink.displayName = 'MockNextLink';
  return MockLink;
});

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn().mockReturnValue({ mutate: jest.fn() }),
  useQueryClient: jest.fn().mockReturnValue({ invalidateQueries: jest.fn() }),
}));

describe('CartPage', () => {
  it('renders empty cart message when there are no items', () => {
    const useQueryMock = (jest.requireMock('@tanstack/react-query') as { useQuery: jest.Mock }).useQuery;
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


