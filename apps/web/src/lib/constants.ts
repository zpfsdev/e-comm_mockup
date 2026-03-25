/** Canonical shipping fee — must match `Order.shippingFee` default in schema.prisma (58). */
export const SHIPPING_FEE = 58;

/** Single source of truth for the API base URL. */
export const API_BASE_URL =
  typeof window === 'undefined'
    ? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1'
    : '/api/v1';
