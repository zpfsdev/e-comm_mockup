import Link from "next/link";

export const metadata = {
  title: "Profile | Artistryx",
  description: "Your account profile",
};

export default function ProfilePage() {
  return (
    <div className="container" style={{ paddingBlock: "2rem" }}>
      <h1>Profile</h1>
      <p>Profile and account settings will go here. (Placeholder)</p>
      <Link href="/">Back to Home</Link>
    </div>
  );
}
