export interface CartProductDto {
  readonly id: number;
  readonly name: string;
  readonly price: string;
  readonly imageUrl: string;
  readonly stock: number;
  readonly seller?: { id: number; shopName: string };
}

export interface CartItemDto {
  readonly id: number;
  readonly quantity: number;
  readonly product: CartProductDto;
}

export interface CartDto {
  readonly items: CartItemDto[];
}
