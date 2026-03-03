export const CATEGORIES = [
  'Charts',
  'Coloring Books',
  'Board Games',
  'Flash Cards',
  'Story Books',
] as const;

export const CATEGORY_GRADIENTS: Record<(typeof CATEGORIES)[number], string> = {
  'Charts':         'radial-gradient(circle, #e9e3e3 0%, #57e799 100%)',
  'Coloring Books': 'radial-gradient(circle, #e9e3e3 0%, #ff751f 100%)',
  'Board Games':    'radial-gradient(circle, #e9e3e3 0%, #7dcfb6 100%)',
  'Flash Cards':    'radial-gradient(circle, #e9e3e3 0%, #fe873d 100%)',
  'Story Books':    'radial-gradient(circle, #e9e3e3 0%, #ece4b7 100%)',
};

export const AGE_CARDS = [
  { age: '3+', bg: 'age3' as const },
  { age: '5+', bg: 'age5' as const },
  { age: '8+', bg: 'age8' as const },
] as const;

export const STORES = ['KIDOS', 'PLAYBOOK', 'LARANA', 'WONDERS', 'GIGGLING'] as const;

export const STORE_IMAGES: Record<(typeof STORES)[number], string> = {
  KIDOS:    '/kidos.png',
  PLAYBOOK: '/playbook.png',
  LARANA:   '/larana.png',
  WONDERS:  '/wonders.png',
  GIGGLING: '/giggling.png',
};
