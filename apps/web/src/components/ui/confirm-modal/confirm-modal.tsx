'use client';

import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button/button';
import styles from './confirm-modal.module.css';

export interface ConfirmModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Modal heading */
  title: string;
  /** Descriptive body text */
  description?: string;
  /** Label for the confirm button (default: "Confirm") */
  confirmLabel?: string;
  /** Label for the cancel button (default: "Cancel") */
  cancelLabel?: string;
  /** Use danger styling for the confirm button */
  isDangerous?: boolean;
  /** Called when the user clicks confirm */
  onConfirm: () => void;
  /** Called when the user clicks cancel or the backdrop */
  onCancel: () => void;
}

/**
 * Reusable confirmation modal.
 * Traps focus, closes on Escape key, and calls onCancel when the backdrop is clicked.
 */
export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDangerous = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  // Focus the confirm button when the modal opens
  useEffect(() => {
    if (open) {
      // Defer so the element is rendered first
      setTimeout(() => confirmBtnRef.current?.focus(), 50);
    }
  }, [open]);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className={styles.backdrop}
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby={description ? 'confirm-modal-desc' : undefined}
        className={styles.dialog}
      >
        {/* Icon */}
        <div className={`${styles.iconWrap} ${isDangerous ? styles.iconDanger : styles.iconInfo}`}>
          {isDangerous ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden width="24" height="24">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden width="24" height="24">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          )}
        </div>

        <h2 id="confirm-modal-title" className={styles.title}>{title}</h2>
        {description && (
          <p id="confirm-modal-desc" className={styles.description}>{description}</p>
        )}

        <div className={styles.actions}>
          <Button variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <button
            ref={confirmBtnRef}
            className={`${styles.confirmBtn} ${isDangerous ? styles.confirmDanger : styles.confirmPrimary}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
