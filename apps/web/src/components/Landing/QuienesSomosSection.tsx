interface QuienesSomosSectionProps {
  isMobile: boolean
}

export default function QuienesSomosSection({ isMobile }: QuienesSomosSectionProps) {
  return (
    <section id="welcome" style={{
      position: 'relative',
      padding: isMobile ? '60px 24px' : '80px 24px',
      minHeight: isMobile ? 'auto' : '350px',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      background: '#000'
    }}>
      {/* Background Image */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'url(/who_we_are.webp)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: 0.7,
        zIndex: 0
      }} />

      {/* Elegant Overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.7))',
        zIndex: 1
      }} />

      {/* Content Container */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        maxWidth: '900px',
        width: '100%',
        textAlign: 'center',
        color: '#fff',
        padding: '0 20px'
      }}>

        <h2 style={{
          fontSize: 'clamp(38px, 6vw, 68px)',
          fontWeight: 800,
          lineHeight: 1,
          marginBottom: '32px',
          letterSpacing: '-2px',
          textTransform: 'uppercase'
        }}>
          La Excelencia en <br />
          <span style={{
            color: 'var(--accent)'
          }}>Cada Detalle</span>
        </h2>

        <p style={{
          fontSize: 'clamp(18px, 2.5vw, 22px)',
          color: 'rgba(255,255,255,0.85)',
          lineHeight: 1.6,
          marginBottom: '48px',
          maxWidth: '700px',
          margin: '0 auto 48px'
        }}>
          En MUYMUY Beauty Studio, creemos que tu belleza es única. Nuestro equipo de expertos fusiona arte y técnica para crear experiencias que trascienden lo estético.
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
          transition: 'all 0.3s ease',
          backdropFilter: 'none'
        }}>
          Descubre nuestra historia
        </button>
      </div>

      <style>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  )
}
