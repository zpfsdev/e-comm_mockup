import Link from "next/link";

export const metadata = {
  title: "My Addresses | Artistryx",
  description: "Manage your delivery addresses",
};

export default function AddressPage() {
  return (
    <div className="container" style={{ paddingBlock: "2rem" }}>
      <h1>My Addresses</h1>
      <p>Address list and add-new-address flow will go here. (Placeholder)</p>
      <Link href="/profile">Profile</Link>
      <span style={{ margin: "0 0.5rem" }}>|</span>
      <Link href="/">Back to Home</Link>
    </div>
  );
}
