import Link from "next/link";

export const metadata = {
  title: "Shop | Artistryx",
  description: "Browse products by category, age, or store",
};

export default function ShopPage() {
  return (
    <div className="container" style={{ paddingBlock: "2rem" }}>
      <h1>Shop</h1>
      <p>Product listing (category / age / store filters) will go here. (Placeholder)</p>
      <Link href="/">Back to Home</Link>
    </div>
  );
}
