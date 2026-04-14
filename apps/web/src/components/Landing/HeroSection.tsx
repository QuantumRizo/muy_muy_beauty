import { Link } from 'react-router-dom'

interface HeroSectionProps {
  isMobile: boolean
}

export default function HeroSection({ isMobile }: HeroSectionProps) {
  return (
    <section id="welcome" style={{
      display: 'flex',
      flexDirection: isMobile ? 'column-reverse' : 'row',
      minHeight: '65vh',
      width: '100%',
      overflow: 'hidden'
    }}>
      {/* Panel Izquierdo: Contenido */}
      <div style={{
        flex: 1,
        background: '#fff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: isMobile ? 'center' : 'flex-start',
        padding: isMobile ? '60px 24px' : '10%',
        textAlign: isMobile ? 'center' : 'left'
      }}>
        <img
          src="/logo.jpeg"
          alt="MUYMUY Logo"
          style={{ width: '140px', height: 'auto', marginBottom: '48px' }}
        />

        <h1 style={{
          fontSize: 'clamp(42px, 7vw, 76px)',
          fontWeight: 800,
          letterSpacing: '-2px',
          lineHeight: 0.95,
          margin: '0 0 24px',
          color: '#1d1d1f',
          textTransform: 'uppercase'
        }}>
          Atrevidas,<br />
          Únicas,<br />
          <span style={{ color: 'var(--accent)' }}>Modernas.</span>
        </h1>

        <p style={{
          fontSize: 'clamp(17px, 2.5vw, 20px)',
          fontWeight: 400,
          color: '#6e6e73',
          lineHeight: 1.5,
          marginBottom: '48px',
          maxWidth: '440px'
        }}>
          Diseños de uñas vanguardistas y manicuras de lujo diseñadas para la mujer que se atreve a brillar.
        </p>

        <div style={{ display: 'flex', gap: 16, flexDirection: isMobile ? 'column' : 'row', width: isMobile ? '100%' : 'auto' }}>
          <Link to="/reservar" style={{
            background: '#1d1d1f', color: '#fff', border: 'none',
            padding: '18px 36px', borderRadius: '40px', fontSize: '17px', fontWeight: 600,
            cursor: 'pointer', minWidth: '200px', textDecoration: 'none', textAlign: 'center'
          }}>
            Reserva tu cita
          </Link>
          <a href="#services" style={{
            background: '#fff', color: '#1d1d1f', border: '2px solid #1d1d1f',
            padding: '18px 36px', borderRadius: '40px', fontSize: '17px', fontWeight: 600,
            cursor: 'pointer', minWidth: '200px', textDecoration: 'none', textAlign: 'center'
          }}>
            Ver Servicios
          </a>
        </div>
      </div>

      {/* Panel Derecho: Imagen */}
      <div style={{
        flex: 1,
        backgroundImage: 'var(--hero-image)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: isMobile ? '45vh' : 'auto'
      }} />
    </section>
  )
}
