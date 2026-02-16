import Link from "next/link";
import { CartIcon } from "@/components/icons";
import styles from "./cart.module.css";

export const metadata = {
  title: "Cart | Artistryx",
  description: "Your shopping cart",
};

export default function CartPage() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <span className={styles.emptyIcon} aria-hidden>
          <CartIcon />
        </span>
        <h1 className={styles.emptyTitle}>You haven&apos;t added anything yet</h1>
        <p className={styles.emptyText}>
          Sign in or create an account to save your cart, or start shopping to add
          items.
        </p>
        <div className={styles.actions}>
          <Link href="/sign-in" className={styles.linkSecondary}>
            Sign in / Sign up
          </Link>
          <Link href="/shop" className={styles.linkPrimary}>
            Go Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
