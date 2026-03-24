// Types used across homepage sections
export interface Product {
  readonly id: number;
  readonly name: string;
  readonly price: string;
  readonly imageUrl: string;
  readonly ageRange: {
    readonly label: string | null;
    readonly minAge: number;
    readonly maxAge: number | null;
  };
  readonly seller: {
    readonly id: number;
    readonly shopName: string;
    readonly shopLogoUrl: string | null;
  };
}

export interface Category {
  readonly id: number;
  readonly categoryName: string;
  readonly imageUrl: string | null;
}

export interface AgeRange {
  readonly id: number;
  readonly minAge: number;
  readonly maxAge: number | null;
  readonly label: string | null;
}

export interface Seller {
  readonly id: number;
  readonly shopName: string;
  readonly shopLogoUrl: string | null;
}
