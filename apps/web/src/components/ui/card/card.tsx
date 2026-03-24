import type { HTMLAttributes } from 'react';
import styles from './card.module.css';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  readonly variant?: 'default' | 'product';
}

export function Card({ variant = 'default', className = '', children, ...props }: CardProps) {
  const classes = [variant === 'product' ? styles.product : styles.card, className]
    .filter(Boolean)
    .join(' ');
  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={[styles.header, className].filter(Boolean).join(' ')} {...props}>
      {children}
    </div>
  );
}

export function CardBody({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={[styles.body, className].filter(Boolean).join(' ')} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={[styles.footer, className].filter(Boolean).join(' ')} {...props}>
      {children}
    </div>
  );
}
