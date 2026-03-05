import { API_BASE_URL } from '@/lib/constants';
import type { ProductAgeRange, ProductCategory, ProductSeller, ProductsResponse } from './products-client';
import { ProductsClient } from './products-client';

interface SearchParams {
  search?: string;
  categoryId?: string;
  ageRangeId?: string;
  sellerId?: string;
  page?: string;
}

interface ProductsPageProps {
  searchParams: Promise<SearchParams>;
}

/** Fetches public data from the API on the server — no auth required. */
async function publicFetch<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    next: { revalidate: 3600 },
  });
  if (!response.ok) throw new Error(`API error ${response.status}: ${path}`);
  return response.json() as Promise<T>;
}

/** RSC wrapper that server-renders the initial product list for SEO and performance.
 *  Passes data as `initialData` to the client component so the first paint
 *  shows real content without a client-side waterfall. */
export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;

  const qs = new URLSearchParams();
  if (params.search) qs.set('search', params.search);
  if (params.categoryId) qs.set('categoryId', params.categoryId);
  if (params.ageRangeId) qs.set('ageRangeId', params.ageRangeId);
  if (params.sellerId) qs.set('sellerId', params.sellerId);
  qs.set('page', params.page ?? '1');
  qs.set('limit', '12');

  const [initialProducts, initialCategories, initialAgeRanges, initialSellers] = await Promise.all([
    publicFetch<ProductsResponse>(`/products?${qs.toString()}`).catch(() => ({
      products: [],
      total: 0,
      page: 1,
      limit: 12,
      totalPages: 0,
    })),
    publicFetch<ProductCategory[]>('/categories').catch(() => []),
    publicFetch<ProductAgeRange[]>('/categories/age-ranges').catch(() => []),
    publicFetch<{ sellers: ProductSeller[] }>('/sellers?limit=50').catch(() => ({ sellers: [] })),
  ]);

  return (
    <ProductsClient
      initialProducts={initialProducts}
      initialCategories={initialCategories}
      initialAgeRanges={initialAgeRanges}
      initialSellers={initialSellers.sellers}
    />
  );
}
