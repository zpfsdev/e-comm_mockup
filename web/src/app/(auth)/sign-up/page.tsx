import Image from "next/image";
import Link from "next/link";
import { SignUpForm } from "./sign-up-form";
import styles from "./sign-up.module.css";

export const metadata = {
  title: "Sign Up | Artistryx",
  description: "Create an account",
};

export default function SignUpPage() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.layout}>
        <h1 className={styles.title}>CREATE AN ACCOUNT</h1>
        <div className={styles.formColumn}>
          <SignUpForm />
        </div>
        <div className={styles.decorColumn}>
          <div className={styles.decor} aria-hidden>
            <Image src="/register-hero.png" alt="" fill sizes="50vw" className={styles.decorImage} />
            <p className={styles.decorTitle}>
              Start Your Shopping
              <br />
              Journey!
            </p>
          </div>
          <p className={styles.goBack}>
            Not ready to create an account?
            <br />
            <Link href="/">Go back to Home</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
