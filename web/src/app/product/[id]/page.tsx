import Link from "next/link";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  return {
    title: `Product ${id} | Artistryx`,
    description: "Product details",
  };
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  return (
    <div className="container" style={{ paddingBlock: "2rem" }}>
      <h1>Product {id}</h1>
      <p>Product detail view will go here. (Placeholder)</p>
      <Link href="/shop">Back to Shop</Link>
      <span style={{ margin: "0 0.5rem" }}>|</span>
      <Link href="/">Home</Link>
    </div>
  );
}
