export interface SellerProductPreviewDto {
  readonly id: number;
  readonly name: string;
  readonly imageUrl: string | null;
  readonly price: string;
  readonly category: string | null;
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
  readonly customerName: string;
  readonly orderDate: Date;
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
