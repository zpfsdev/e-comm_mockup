import type { HTMLAttributes } from 'react';
import styles from './avatar.module.css';

type AvatarSize = 'sm' | 'md' | 'lg';

interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  readonly src?: string;
  readonly alt?: string;
  readonly initials?: string;
  readonly size?: AvatarSize;
}

export function Avatar({ src, alt = '', initials, size = 'md', className = '', ...props }: AvatarProps) {
  const classes = [styles.avatar, styles[size], className].filter(Boolean).join(' ');
  return (
    <div className={classes} {...props}>
      {src ? (
        <img src={src} alt={alt} />
      ) : (
        <span aria-label={alt}>{initials ?? '?'}</span>
      )}
    </div>
  );
}
