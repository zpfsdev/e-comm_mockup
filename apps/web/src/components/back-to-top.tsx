'use client';

import { useEffect, useState } from 'react';
import { ArrowUpIcon } from './icons';
import styles from './back-to-top.module.css';

const SCROLL_THRESHOLD = 300;

export function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setIsVisible(window.scrollY > SCROLL_THRESHOLD);
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (!isVisible) return null;

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
