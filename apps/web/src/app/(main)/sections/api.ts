import { API_BASE_URL } from '@/lib/constants';
import type { Product, Category, AgeRange, Seller } from './types';

export async function fetchProducts(sort: string): Promise<Product[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/products?limit=8&sort=${sort}`, {
      next: { revalidate: 0 },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { products?: Product[]; data?: Product[] };
    return json.products ?? json.data ?? [];
  } catch {
    return [];
  }
}

export async function fetchCategories(): Promise<Category[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/categories`, { next: { revalidate: 0 } });
    if (!res.ok) return [];
    return (await res.json()) as Category[];
  } catch {
    return [];
  }
}

export async function fetchAgeRanges(): Promise<AgeRange[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/categories/age-ranges`, { next: { revalidate: 0 } });
    if (!res.ok) return [];
    return (await res.json()) as AgeRange[];
  } catch {
    return [];
  }
}

export async function fetchSellers(limit = 12): Promise<Seller[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/sellers?limit=${limit}`, {
      next: { revalidate: 0 },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { sellers?: Seller[] };
    return json.sellers ?? [];
  } catch {
    return [];
  }
}
