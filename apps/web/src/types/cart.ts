export interface CartItemProduct {
  id: number;
  name: string;
  price: number;
  imageUrl?: string;
  /** Only present in cart view, not checkout. */
  stock?: number;
}

export interface CartItem {
  id: number;
  quantity: number;
  product: CartItemProduct;
}

export interface Cart {
  items: CartItem[];
}
