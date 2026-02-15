import Link from "next/link";

export const metadata = {
  title: "Sign In | Artistryx",
  description: "Sign in to your account",
};

export default function SignInPage() {
  return (
    <div className="container" style={{ paddingBlock: "2rem" }}>
      <h1>Sign In</h1>
      <p>Sign-in form will go here. (Placeholder)</p>
      <Link href="/sign-up">Sign Up</Link>
      <span style={{ margin: "0 0.5rem" }}>|</span>
      <Link href="/">Back to Home</Link>
    </div>
  );
}
