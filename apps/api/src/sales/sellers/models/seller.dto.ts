export interface SellerProductPreviewDto {
  readonly id: number;
  readonly name: string;
  readonly imageUrl: string | null;
  /** Product price serialized as a decimal string. */
  readonly price: string;
  readonly category: string | null;
  readonly ageRange: {
    readonly label: string | null;
    readonly minAge: number;
    readonly maxAge: number | null;
  } | null;
}

/** Public shop profile — no internal fields (userId, shopStatus, etc.). */
export interface SellerPublicDto {
  readonly id: number;
  readonly shopName: string;
  readonly shopLogoUrl: string | null;
  readonly shopDescription: string | null;
  readonly registeredAt: Date;
  readonly products: SellerProductPreviewDto[];
}

/** Minimal shop info returned in list views. */
export interface SellerSummaryDto {
  readonly id: number;
  readonly shopName: string;
  readonly shopLogoUrl: string | null;
  readonly shopDescription: string | null;
  readonly registeredAt: Date;
}

export interface SellerRecentOrderDto {
  readonly id: number;
  readonly orderItemStatus: string;
  readonly quantity: number;
  readonly price: string;
  readonly productName: string;
  readonly productImageUrl: string | null;
  readonly customerName: string;
  readonly orderDate: Date;
  readonly dateDelivered: Date | null;
  readonly shippingAddress: string;
}

/** Dashboard response — no raw seller row or customer PII in nested objects. */
export interface SellerDashboardDto {
  readonly shopName: string;
  readonly shopLogoUrl: string | null;
  readonly stats: {
    readonly products: number;
    readonly totalCommission: string | null;
  };
  readonly recentOrders: SellerRecentOrderDto[];
}

export interface SellerStatsDto {
  readonly totalProducts: number;
  readonly totalOrders: number;
  readonly pendingOrders: number;
  /** Aggregate seller revenue serialized as a decimal string. */
  readonly totalRevenue: string;
}

export interface SellerSaleItemDto {
  readonly id: number;
  readonly orderItemStatus: string;
  readonly quantity: number;
  /** Price at the time of sale — the canonical sold price from the order item. */
  readonly price: string;
  readonly productName: string;
  /** Current product price — may differ from the price-at-sale. */
  readonly currentProductPrice: string;
  readonly orderDate: Date;
}

export interface PaginatedSalesReportDto {
  readonly items: SellerSaleItemDto[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly totalPages: number;
}

/** Paginated seller list response. */
export interface PaginatedSellersResponseDto {
  readonly sellers: SellerSummaryDto[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly totalPages: number;
}
