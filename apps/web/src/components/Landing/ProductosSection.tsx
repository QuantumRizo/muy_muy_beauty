interface ProductosSectionProps {
  isMobile: boolean
}

export default function ProductosSection({ isMobile }: ProductosSectionProps) {
  return (
    <section id="productos" style={{
      position: 'relative',
      padding: isMobile ? '80px 24px' : '140px 24px',
      textAlign: 'center',
      background: '#000',
      overflow: 'hidden'
    }}>
      {/* Background Image - Same as Quienes Somos */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'url(/who_we_are.webp)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: 0.6,
        zIndex: 0
      }} />

      {/* Elegant Overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.8))',
        zIndex: 1
      }} />

      <div style={{ position: 'relative', zIndex: 2, maxWidth: '800px', margin: '0 auto' }}>
        <h2 style={{
          fontSize: 'clamp(42px, 7vw, 68px)',
          fontWeight: 800,
          lineHeight: 1.1,
          color: '#fff',
          marginBottom: 44,
          letterSpacing: '-2px',
          textTransform: 'uppercase'
        }}>
          Nuestros <br />
          <span style={{ color: 'var(--accent)' }}>Productos</span>
        </h2>

        <p style={{
          fontSize: 'clamp(18px, 2.5vw, 22px)',
          color: 'rgba(255,255,255,0.85)',
          lineHeight: 1.6,
          marginBottom: '48px',
          maxWidth: '600px',
          margin: '0 auto 48px'
        }}>
          Llevamos la calidad de nuestro estudio a tu hogar. Descubre nuestra curaduría de productos premium para el cuidado de tu belleza.
        </p>

        <button style={{
          background: 'transparent',
          color: '#fff',
          border: '2px solid #fff',
          padding: '18px 48px',
          borderRadius: '40px',
          fontSize: '16px',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.3s ease'
        }}>
          Catálogo próximamente
        </button>
      </div>
    </section>
  )
}
