import Link from "next/link";

export const metadata = {
  title: "Cart | Artistryx",
  description: "Your shopping cart",
};

export default function CartPage() {
  return (
    <div className="container" style={{ paddingBlock: "2rem" }}>
      <h1>Shopping Cart</h1>
      <p>Cart content will go here. (Placeholder)</p>
      <Link href="/">Back to Home</Link>
    </div>
  );
}
