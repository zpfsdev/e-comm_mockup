"use client";

import { useEffect, useState } from "react";
import { ArrowUpIcon } from "./icons";
import styles from "./back-to-top.module.css";

const SCROLL_THRESHOLD = 300;

export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > SCROLL_THRESHOLD);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!visible) return null;

  return (
    <button
      type="button"
      className={styles.backToTop}
      onClick={scrollToTop}
      aria-label="Scroll back to top"
    >
      <ArrowUpIcon />
    </button>
  );
}
