import Image from "next/image";
import Link from "next/link";
import { SignInForm } from "./sign-in-form";
import styles from "./sign-in.module.css";

export const metadata = {
  title: "Sign In | Artistryx",
  description: "Sign in to your account",
};

export default function SignInPage() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.layout}>
        <div className={styles.formColumn}>
          <div className={styles.logoBlock}>
            <Link href="/" className={styles.logoLink}>
              <Image src="/logo.png" alt="Artistryx" width={240} height={195} priority />
            </Link>
            <h1 className={styles.title}>Welcome Back!</h1>
          </div>
          <p className={styles.tagline}>
            Sign in to explore features and enjoy quicker, smoother purchases
          </p>
          <p className={styles.subtitle}>Sign in to your account</p>
          <SignInForm />
          <div className={styles.links}>
            <p>
              Don&apos;t have an account? <Link href="/sign-up">Sign up</Link>
            </p>
          </div>
        </div>
        <div className={styles.decorColumn}>
          <div className={styles.decor} aria-hidden>
            <Image src="/sign-in-hero.png" alt="" fill sizes="50vw" className={styles.decorImage} />
          </div>
          <p className={styles.goBack}>
            Don&apos;t want to sign in? <Link href="/">Go back to Home</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
