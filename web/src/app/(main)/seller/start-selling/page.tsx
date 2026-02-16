import Link from "next/link";

export const metadata = {
  title: "Start Selling | Artistryx",
  description: "Seller onboarding",
};

export default function StartSellingPage() {
  return (
    <div className="container" style={{ paddingBlock: "2rem" }}>
      <h1>Start Selling</h1>
      <p>Seller onboarding (steps 1/2 and 2/2) will go here. (Placeholder)</p>
      <Link href="/">Back to Home</Link>
    </div>
  );
}
