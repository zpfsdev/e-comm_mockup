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
