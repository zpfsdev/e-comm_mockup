export interface ProductCategory {
  id: number;
  name?: string;
  categoryName: string;
}

export interface ProductAgeRange {
  id: number;
  minAge: number;
  maxAge: number | null;
  label?: string;
}

export interface ProductSeller {
  id: number;
  shopName: string;
  shopLogoUrl?: string | null;
  shopDescription?: string | null;
  description?: string | null;
}

export interface ProductListItem {
  id: number;
  name: string;
  price: string | number;
  description?: string;
  imageUrl?: string;
  seller?: ProductSeller;
  category?: ProductCategory;
  ageRange?: ProductAgeRange;
}

export interface ProductsResponse {
  products: ProductListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ProductSpecifications {
  material?: string | null;
  height?: number | null;
  width?: number | null;
  length?: number | null;
  weight?: number | null;
}

export interface ProductDetail {
  id: number;
  name: string;
  price: string | number;
  description: string;
  imageUrl?: string;
  stockQuantity: number;
  dateAdded?: string;
  seller: ProductSeller;
  category: ProductCategory;
  ageRange: ProductAgeRange;
  specifications?: ProductSpecifications;
}
