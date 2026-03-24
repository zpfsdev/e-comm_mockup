/** Cycled gradient backgrounds for the category pill circles. */
export const CATEGORY_GRADIENT_PALETTE = [
  'radial-gradient(circle, #e9e3e3 0%, #57e799 100%)',
  'radial-gradient(circle, #e9e3e3 0%, #ff751f 100%)',
  'radial-gradient(circle, #e9e3e3 0%, #7dcfb6 100%)',
  'radial-gradient(circle, #e9e3e3 0%, #fe873d 100%)',
  'radial-gradient(circle, #e9e3e3 0%, #ece4b7 100%)',
  'radial-gradient(circle, #e9e3e3 0%, #a78bfa 100%)',
  'radial-gradient(circle, #e9e3e3 0%, #fb7185 100%)',
  'radial-gradient(circle, #e9e3e3 0%, #34d399 100%)',
] as const;

/** Cycled background + text colour pairs for age range cards. */
export const AGE_COLOR_PALETTE = [
  { bg: '#ece4b7', text: '#888f3e' }, // 0-2
  { bg: '#fff5e9', text: '#a33e00' }, // 3-5
  { bg: '#d8f2e4', text: '#247348' }, // 6+
] as const;
