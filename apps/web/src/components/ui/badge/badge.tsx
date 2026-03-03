import type { HTMLAttributes } from 'react';
import styles from './badge.module.css';

type BadgeVariant = 'lemon' | 'peach' | 'mint' | 'primary' | 'secondary' | 'success' | 'neutral';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  readonly variant?: BadgeVariant;
}

export function Badge({ variant = 'neutral', className = '', children, ...props }: BadgeProps) {
  const classes = [styles.badge, styles[variant], className].filter(Boolean).join(' ');
  return (
    <span className={classes} {...props}>
      {children}
    </span>
  );
}
