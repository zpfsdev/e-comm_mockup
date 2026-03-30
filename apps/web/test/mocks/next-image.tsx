import React from 'react';

interface MockImageProps {
  src?: string;
  alt?: string;
  priority?: boolean;
  fill?: boolean;
  sizes?: string;
  width?: number | string;
  height?: number | string;
  style?: React.CSSProperties;
  className?: string;
}

const MockNextImage = ({ src, alt = '', priority, fill, ...rest }: MockImageProps) => (
  <span
    data-testid="mock-next-image"
    data-src={src}
    data-alt={alt}
    data-priority={priority ? 'true' : undefined}
    data-fill={fill ? 'true' : undefined}
    aria-label={alt || undefined}
    {...(rest as object)}
  />
);

MockNextImage.displayName = 'MockNextImage';

export default MockNextImage;
