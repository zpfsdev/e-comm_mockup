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
  { bg: '#ece4b7', text: '#b3a869' },
  { bg: '#fce4c7', text: '#a33e00' },
  { bg: '#5ae79a', text: '#247348' },
  { bg: '#c7ebe8', text: '#1a6060' },
  { bg: '#ffd6a5', text: '#8b4a00' },
  { bg: '#e8c7f5', text: '#5c2080' },
  { bg: '#c7e0f5', text: '#1a4060' },
] as const;

export const STORES = ['KIDOS', 'PLAYBOOK', 'LARANA', 'WONDERS', 'GIGGLING'] as const;

export const STORE_IMAGES: Record<(typeof STORES)[number], string> = {
  KIDOS:    '/kidos.png',
  PLAYBOOK: '/playbook.png',
  LARANA:   '/larana.png',
  WONDERS:  '/wonders.png',
  GIGGLING: '/giggling.png',
};
