/**
 * Static data for the home page – categories, age cards, stores, placeholder products.
 * Replace with API data when backend is wired.
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

export const PLACEHOLDER_PRODUCTS = [
  { name: "Stacking Ring", price: "Php 349.00", age: "3+" },
  { name: "Product Name", price: "Price", age: "3+" },
  { name: "Product Name", price: "Price", age: "3+" },
  { name: "Product Name", price: "Price", age: "7+" },
] as const;
