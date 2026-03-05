export default function ProfileLoading() {
  return (
    <div
      style={{
        maxWidth: '40rem',
        margin: '0 auto',
        padding: 'var(--space-8) var(--space-4)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-5)',
      }}
    >
      <div
        style={{
          width: '10rem',
          height: '2rem',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--color-card-border)',
          animation: 'pulse 1.5s ease-in-out infinite',
        }}
      />
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          style={{
            height: '3.5rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-card-border)',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
      ))}
      <div
        style={{
          height: '2.75rem',
          width: '8rem',
          borderRadius: 'var(--radius-md)',
          background: 'var(--color-card-border)',
          animation: 'pulse 1.5s ease-in-out infinite',
        }}
      />
    </div>
  );
}
