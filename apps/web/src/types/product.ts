export interface ProductCategory {
  readonly id: number;
  readonly categoryName: string;
}

export interface ProductAgeRange {
  readonly id: number;
  readonly label: string | null;
  readonly minAge: number;
  readonly maxAge: number | null;
}

export interface ProductSeller {
  readonly id: number;
  readonly shopName: string;
  readonly shopLogoUrl: string | null;
}

export interface ProductListItem {
  readonly id: number;
  readonly name: string;
  readonly price: string;
  readonly imageUrl: string;
  readonly category: ProductCategory;
  readonly ageRange: ProductAgeRange;
}

export interface ProductDetail extends ProductListItem {
  readonly description: string;
  readonly stockQuantity: number;
  readonly seller: ProductSeller;
}

export interface ProductsResponse {
  readonly products: ProductListItem[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly totalPages: number;
}
