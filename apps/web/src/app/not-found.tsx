import Link from 'next/link';

/** Custom 404 page — renders inside the root layout with the design system. */
export default function NotFound() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: '1.25rem',
        padding: '2rem',
        textAlign: 'center',
        fontFamily: 'var(--font-body, sans-serif)',
      }}
    >
      <span
        style={{
          fontSize: '5rem',
          fontWeight: 900,
          color: 'var(--color-accent-soft, #dc8242)',
          lineHeight: 1,
        }}
      >
        404
      </span>
      <h1
        style={{
          fontSize: '1.5rem',
          fontWeight: 700,
          color: 'var(--color-text, #1a1a1a)',
          margin: 0,
        }}
      >
        Page not found
      </h1>
      <p style={{ color: 'var(--color-text-muted, #6b7280)', maxWidth: '28rem', margin: 0 }}>
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link
          href="/"
          style={{
            padding: '0.6rem 1.5rem',
            background: 'var(--color-accent-soft, #dc8242)',
            color: '#fff',
            borderRadius: '6px',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Go home
        </Link>
        <Link
          href="/products"
          style={{
            padding: '0.6rem 1.5rem',
            color: 'var(--color-accent-soft, #dc8242)',
            border: '1.5px solid var(--color-accent-soft, #dc8242)',
            borderRadius: '6px',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Browse products
        </Link>
      </div>
    </div>
  );
}
