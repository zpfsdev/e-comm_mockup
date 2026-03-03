/**
 * Shop data: listing and filters. Replace with API when wired.
 */

import { CATEGORIES, STORES } from "./home-data";

export { CATEGORIES, STORES };

export const AGE_RANGES = ["3+", "5+", "8+"] as const;

export interface ShopProduct {
  id: string;
  name: string;
  price: string;
  age: string;
  category: string;
  store: string;
}

const PRODUCTS: ShopProduct[] = [
  { id: "1", name: "Stacking Ring", price: "Php 349.00", age: "3+", category: "Charts", store: "KIDOS" },
  { id: "2", name: "Wooden Puzzle Set", price: "Php 520.00", age: "3+", category: "Board Games", store: "PLAYBOOK" },
  { id: "3", name: "Story Book Bundle", price: "Php 280.00", age: "5+", category: "Story Books", store: "LARANA" },
  { id: "4", name: "Flash Cards ABC", price: "Php 199.00", age: "3+", category: "Flash Cards", store: "WONDERS" },
  { id: "5", name: "Coloring Book", price: "Php 150.00", age: "5+", category: "Coloring Books", store: "GIGGLING" },
  { id: "6", name: "Number Charts", price: "Php 420.00", age: "5+", category: "Charts", store: "KIDOS" },
  { id: "7", name: "Adventure Board Game", price: "Php 650.00", age: "8+", category: "Board Games", store: "PLAYBOOK" },
  { id: "8", name: "Picture Story Pack", price: "Php 380.00", age: "3+", category: "Story Books", store: "LARANA" },
  { id: "9", name: "Math Flash Cards", price: "Php 220.00", age: "5+", category: "Flash Cards", store: "WONDERS" },
];

export function getShopProducts(filters: {
  category?: string;
  age?: string;
  store?: string;
}): ShopProduct[] {
  return PRODUCTS.filter((p) => {
    if (filters.category && p.category !== filters.category) return false;
    if (filters.age && p.age !== filters.age) return false;
    if (filters.store && p.store !== filters.store) return false;
    return true;
  });
}

export function getProductById(id: string): ShopProduct | undefined {
  return PRODUCTS.find((p) => p.id === id);
}
