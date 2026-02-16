"use client";

import { useState } from "react";
import styles from "./product.module.css";

const MIN_QTY = 1;
const MAX_QTY = 99;

export function ProductDetailClient() {
  const [quantity, setQuantity] = useState(1);

  const decrement = () => setQuantity((q) => Math.max(MIN_QTY, q - 1));
  const increment = () => setQuantity((q) => Math.min(MAX_QTY, q + 1));

  return (
    <div className={styles.quantityControls}>
      <button
        type="button"
        className={styles.quantityBtn}
        onClick={decrement}
        disabled={quantity <= MIN_QTY}
        aria-label="Decrease quantity"
      >
        −
      </button>
      <span className={styles.quantityValue} aria-live="polite">
        {quantity}
      </span>
      <button
        type="button"
        className={styles.quantityBtn}
        onClick={increment}
        disabled={quantity >= MAX_QTY}
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}
