import Link from "next/link";

export const metadata = {
  title: "Sign Up | Artistryx",
  description: "Create an account",
};

export default function SignUpPage() {
  return (
    <div className="container" style={{ paddingBlock: "2rem" }}>
      <h1>Sign Up / Register</h1>
      <p>Registration form will go here. (Placeholder)</p>
      <Link href="/sign-in">Sign In</Link>
      <span style={{ margin: "0 0.5rem" }}>|</span>
      <Link href="/">Back to Home</Link>
    </div>
  );
}
