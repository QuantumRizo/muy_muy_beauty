import { Link } from 'react-router-dom'

interface HeroSectionProps {
  isMobile: boolean
}

export default function HeroSection({ isMobile }: HeroSectionProps) {
  return (
    <section id="welcome" style={{
      position: 'relative',
      height: isMobile ? 'auto' : '90vh',
      minHeight: isMobile ? '80vh' : '800px',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: isMobile ? 'center' : 'flex-start',
      overflow: 'hidden',
      background: '#000'
    }}>
      {/* Background Image with Overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'var(--hero-image)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: 0.85,
        zIndex: 0
      }} />

      {/* Sophisticated Gradient Overlay for readability */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: isMobile
          ? 'radial-gradient(circle at center, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.6) 100%)'
          : 'linear-gradient(90deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.1) 100%)',
        zIndex: 1
      }} />

      {/* Content Container */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        maxWidth: '1200px',
        width: '100%',
        padding: isMobile ? '120px 24px 60px' : '0 8%',
        textAlign: isMobile ? 'center' : 'left',
        color: '#fff'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: isMobile ? 'center' : 'flex-start',
          animation: 'fadeInUp 1s ease-out'
        }}>
          <img
            src="/logoVertical.png"
            alt="MUYMUY Logo"
            style={{
              width: 'auto',
              height: '60px',
              marginBottom: '32px',
              filter: 'brightness(0) invert(1)' // Make logo white for elegance
            }}
          />

          <h1 style={{
            fontSize: 'clamp(48px, 8vw, 90px)',
            fontWeight: 800,
            letterSpacing: '-3px',
            lineHeight: 0.9,
            margin: '0 0 24px',
            textTransform: 'uppercase',
            maxWidth: '800px'
          }}>
            Atrevidas<br />
            Únicas<br />
            <span style={{
              color: 'var(--accent)'
            }}>Modernas</span>
          </h1>

          <p style={{
            fontSize: 'clamp(18px, 2.5vw, 22px)',
            fontWeight: 400,
            color: 'rgba(255,255,255,0.8)',
            lineHeight: 1.6,
            marginBottom: '56px',
            maxWidth: '520px',
            letterSpacing: '-0.2px'
          }}>
            Diseños de uñas vanguardistas y manicuras de lujo diseñadas para la mujer que se atreve a brillar.
          </p>

          <div style={{
            display: 'flex',
            gap: 20,
            flexDirection: isMobile ? 'column' : 'row',
            width: isMobile ? '100%' : 'auto'
          }}>
            <Link to="/reservar" style={{
              background: 'var(--accent)',
              color: '#fff',
              border: 'none',
              padding: '20px 42px',
              borderRadius: '40px',
              fontSize: '18px',
              fontWeight: 600,
              cursor: 'pointer',
              minWidth: '220px',
              textDecoration: 'none',
              textAlign: 'center',
              transition: 'all 0.3s ease'
            }}>
              Reserva tu cita
            </Link>
            <a href="#services" style={{
              background: 'rgba(255,255,255,0.1)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.3)',
              backdropFilter: 'none',
              padding: '20px 42px',
              borderRadius: '40px',
              fontSize: '18px',
              fontWeight: 600,
              cursor: 'pointer',
              minWidth: '220px',
              textDecoration: 'none',
              textAlign: 'center',
              transition: 'all 0.3s ease'
            }}>
              Ver Servicios
            </a>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  )
}
