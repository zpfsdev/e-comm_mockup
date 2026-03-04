/** Canonical shipping fee — must match `Order.shippingFee` default in schema.prisma (58). */
export const SHIPPING_FEE = 58;

/** Single source of truth for the API base URL. */
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
if (!apiUrl && process.env.NODE_ENV === 'production') {
  console.warn('[Artistryx] NEXT_PUBLIC_API_URL is not set — falling back to localhost. Set this env var in production.');
}
export const API_BASE_URL = apiUrl ?? 'http://localhost:3001/api/v1';
