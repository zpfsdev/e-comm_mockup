"use client";

import Link from "next/link";
import styles from "./sign-up.module.css";

export function SignUpForm() {
  return (
    <form className={styles.form} action="#" method="post">
      <input
        id="signup-first"
        type="text"
        name="firstName"
        autoComplete="given-name"
        placeholder="First Name"
        className={styles.input}
        required
      />
      <input
        id="signup-last"
        type="text"
        name="lastName"
        autoComplete="family-name"
        placeholder="Last Name"
        className={styles.input}
        required
      />
      <input
        id="signup-middle"
        type="text"
        name="middleName"
        autoComplete="additional-name"
        placeholder="Middle Name"
        className={styles.input}
      />
      <input
        id="signup-phone"
        type="tel"
        name="phone"
        autoComplete="tel"
        placeholder="Phone Number"
        className={styles.input}
      />
      <input
        id="signup-email"
        type="email"
        name="email"
        autoComplete="email"
        placeholder="Email Address"
        className={styles.input}
        required
      />
      <input
        id="signup-username"
        type="text"
        name="username"
        autoComplete="username"
        placeholder="Username"
        className={styles.input}
        required
      />
      <input
        id="signup-password"
        type="password"
        name="password"
        autoComplete="new-password"
        placeholder="Password"
        className={styles.input}
        required
      />
      <input
        id="signup-confirm"
        type="password"
        name="confirmPassword"
        autoComplete="new-password"
        placeholder="Confirm Password"
        className={styles.input}
        required
      />
      <button type="submit" className={styles.submitBtn}>
        Create Account
      </button>
      <p className={styles.links}>
        Already have an account? <Link href="/sign-in">Sign in</Link>
      </p>
    </form>
  );
}
