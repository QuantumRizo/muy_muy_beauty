interface ProductosSectionProps {
  isMobile: boolean
}

export default function ProductosSection({ isMobile }: ProductosSectionProps) {
  return (
    <section id="productos" style={{
      padding: isMobile ? '80px 24px' : '120px 24px',
      textAlign: 'center',
      background: '#f9f9fb',
      borderTop: '1px solid #f2f2f2',
      borderBottom: '1px solid #f2f2f2'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h2 style={{
          fontSize: 'clamp(32px, 6vw, 52px)',
          fontWeight: 800,
          lineHeight: 1.1,
          color: '#1d1d1f',
          marginBottom: 44,
          letterSpacing: '-1.5px'
        }}>
          Nuestros Productos
        </h2>

        <button style={{
          background: '#1d1d1f',
          color: '#fff',
          border: 'none',
          padding: '18px 44px',
          borderRadius: '40px',
          fontSize: '16px',
          fontWeight: 600,
          cursor: 'default',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          Descubre más
        </button>
      </div>
    </section>
  )
}
