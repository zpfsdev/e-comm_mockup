export interface OrderItemProductSummaryDto {
  readonly id: number;
  readonly name: string;
  readonly imageUrl: string;
}

export interface OrderItemDto {
  readonly id: number;
  readonly product: OrderItemProductSummaryDto;
  readonly quantity: number;
  readonly price: string;
  readonly orderItemStatus: string;
  readonly dateDelivered: Date | null;
}

export interface OrderPaymentDto {
  readonly id: number;
  readonly paymentAmount: string;
  readonly paymentStatus: string;
  readonly paymentDate: Date | null;
}

export interface OrderAddressLocationDto {
  readonly cityName: string;
  readonly barangayName: string;
}

export interface OrderAddressDto {
  readonly id: number;
  readonly streetLine: string | null;
  readonly postalCode: string | null;
  readonly location: OrderAddressLocationDto | null;
}

export interface OrderSummaryDto {
  readonly id: number;
  readonly orderDate: Date;
  readonly totalAmount: string;
  readonly shippingFee: string;
  readonly notes: string | null;
  readonly orderItems: OrderItemDto[];
  readonly payment: OrderPaymentDto | null;
  readonly userAddress: OrderAddressDto | null;
}

export interface PaginatedOrdersResponseDto {
  readonly orders: OrderSummaryDto[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly totalPages: number;
}
