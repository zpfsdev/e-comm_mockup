export default function ProductDetailLoading() {
  return (
    <div
      style={{
        maxWidth: '72rem',
        margin: '0 auto',
        padding: 'var(--space-8) var(--space-4)',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 'var(--space-8)',
      }}
    >
      <div
        style={{
          aspectRatio: '1',
          borderRadius: 'var(--radius-xl)',
          background: 'var(--color-card-border)',
          animation: 'pulse 1.5s ease-in-out infinite',
        }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {[180, 80, 60, 100, 140].map((width, i) => (
          <div
            key={i}
            style={{
              width: `${width}px`,
              height: i === 0 ? '2rem' : '1.25rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--color-card-border)',
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          />
        ))}
        <div
          style={{
            height: '3rem',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--color-card-border)',
            marginTop: 'var(--space-4)',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
      </div>
    </div>
  );
}
