export interface ProductSellerSummaryDto {
  readonly id: number;
  readonly shopName: string;
  readonly shopLogoUrl: string | null;
}

export interface ProductCategoryDto {
  readonly id: number;
  readonly categoryName: string;
}

export interface ProductAgeRangeDto {
  readonly id: number;
  readonly label: string | null;
  readonly minAge: number;
  readonly maxAge: number | null;
}

export interface ProductDetailDto {
  readonly height: number | null;
  readonly weight: number | null;
  readonly width: number | null;
  readonly length: number | null;
  readonly material: string | null;
}

export interface ProductDto {
  readonly id: number;
  readonly name: string;
  readonly description: string;
  readonly imageUrl: string;
  readonly price: string;
  readonly stockQuantity: number;
  readonly status: string;
  readonly dateAdded: Date;
  readonly lastUpdated: Date;
  readonly seller: ProductSellerSummaryDto;
  readonly category: ProductCategoryDto;
  readonly ageRange: ProductAgeRangeDto;
  readonly productDetail: ProductDetailDto | null;
}

export interface ProductListResponseDto {
  readonly products: ProductDto[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly totalPages: number;
}
