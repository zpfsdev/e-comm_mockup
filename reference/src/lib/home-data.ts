/**
 * Home page data: categories, age cards, stores, placeholder products.
 * Replace with API when backend is wired.
 */

export const CATEGORIES = [
  "Charts",
  "Coloring Books",
  "Board Games",
  "Flash Cards",
  "Story Books",
] as const;

export const AGE_CARDS = [
  { age: "3+", bg: "age3" as const },
  { age: "5+", bg: "age5" as const },
  { age: "8+", bg: "age8" as const },
] as const;

export const STORES = ["KIDOS", "PLAYBOOK", "LARANA", "WONDERS", "GIGGLING"] as const;

/** Store name -> public image filename (for Shop by Store circles). */
export const STORE_IMAGES: Record<(typeof STORES)[number], string> = {
  KIDOS: "/kidos.png",
  PLAYBOOK: "/playbook.png",
  LARANA: "/larama.png",
  WONDERS: "/wonders.png",
  GIGGLING: "/giggling.png",
};

export const PLACEHOLDER_PRODUCTS = [
  { name: "Stacking Ring", price: "Php 349.00", age: "3+" },
  { name: "Product Name", price: "Price", age: "3+" },
  { name: "Product Name", price: "Price", age: "3+" },
  { name: "Product Name", price: "Price", age: "7+" },
] as const;
