import type { ElementType, ComponentPropsWithoutRef } from 'react';
import styles from './button.module.css';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

type PolymorphicProps<T extends ElementType> = {
  readonly as?: T;
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly full?: boolean;
  readonly className?: string;
  readonly children?: React.ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'variant' | 'size' | 'full'>;

export function Button<T extends ElementType = 'button'>({
  as,
  variant = 'primary',
  size = 'md',
  full = false,
  className = '',
  children,
  ...props
}: PolymorphicProps<T>) {
  const Tag = (as ?? 'button') as ElementType;

  const classes = [
    styles.button,
    styles[variant],
    size !== 'md' ? styles[size] : '',
    full ? styles.full : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Tag className={classes} {...props}>
      {children}
    </Tag>
  );
}
