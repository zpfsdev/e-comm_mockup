import type { HTMLAttributes } from 'react';
import styles from './skeleton.module.css';

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  readonly width?: string;
  readonly height?: string;
}

export function Skeleton({ width, height, className = '', style, ...props }: SkeletonProps) {
  return (
    <div
      className={[styles.skeleton, className].filter(Boolean).join(' ')}
      style={{ width, height, ...style }}
      aria-hidden="true"
      {...props}
    />
  );
}
