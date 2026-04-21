import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'

export default function LandingNavbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    let ticking = false
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 50)
          ticking = false
        })
        ticking = true
      }
    }
    const handleResize = () => setIsMobile(window.innerWidth < 900)

    handleScroll()
    handleResize()

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleResize, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  const textColor = isScrolled ? '#1d1d1f' : (isMobile ? '#1d1d1f' : '#fff')
  const logoFilter = isScrolled ? 'none' : (isMobile ? 'none' : 'brightness(0) invert(1)')

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
      background: isScrolled ? 'rgba(255,255,255,0.98)' : (isMobile ? '#fff' : 'transparent'),
      backdropFilter: 'none',
      height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '0 24px', transition: 'all 0.4s ease',
      borderBottom: (isScrolled || isMobile) ? '1px solid #f2f2f2' : 'none',
      color: textColor
    }}>
      <div style={{ maxWidth: '1100px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'inherit' }}>
          <img src="/logoVertical.png" alt="MUYMUY" style={{ height: '32px', filter: logoFilter, transition: 'all 0.4s ease' }} />
          <span style={{ fontWeight: 700, fontSize: '18px', letterSpacing: '-0.5px' }}>MUYMUY</span>
        </Link>
        <div style={{ display: 'flex', gap: 30, fontSize: '14px', fontWeight: 500 }} className="desktop-only">
          <Link to="/#welcome" style={{ textDecoration: 'none', color: 'inherit', transition: 'all 0.3s' }}>Estudio</Link>
          <Link to="/#services" style={{ textDecoration: 'none', color: 'inherit', transition: 'all 0.3s' }}>Servicios</Link>
          <Link to="/#contact" style={{ textDecoration: 'none', color: 'inherit', transition: 'all 0.3s' }}>Contacto</Link>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
          <Link to="/reservar" style={{
            background: isScrolled ? '#1d1d1f' : (isMobile ? '#1d1d1f' : '#fff'), 
            color: isScrolled ? '#fff' : (isMobile ? '#fff' : '#1d1d1f'), 
            border: 'none',
            padding: '8px 18px', borderRadius: '20px', fontSize: '13px', fontWeight: 600,
            cursor: 'pointer', textDecoration: 'none', transition: 'all 0.4s ease'
          }} className="desktop-only">
            Agendar Online
          </Link>

          <button
            onClick={() => setIsMenuOpen(true)}
            className="mobile-only"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: textColor, display: 'flex', alignItems: 'center' }}
          >
            <Menu size={24} />
          </button>
        </div>
      </div>

      {/* ─── MOBILE MENU OVERLAY ───────────────────────── */}
      {isMenuOpen && (
        <div className="mobile-menu-overlay">
          <button className="mobile-menu-close" onClick={() => setIsMenuOpen(false)}>
            <X size={24} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <img src="/logoVertical.png" alt="MUYMUY" style={{ height: '32px' }} />
            <span style={{ fontWeight: 700, fontSize: '20px', letterSpacing: '-0.5px' }}>MUYMUY</span>
          </div>

          <Link to="/#welcome" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>Estudio</Link>
          <Link to="/#services" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>Servicios</Link>
          <Link to="/#contact" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>Contacto</Link>

          <div style={{ marginTop: 'auto' }}>
            <Link to="/reservar" onClick={() => setIsMenuOpen(false)} style={{
              background: '#1d1d1f', color: '#fff', border: 'none',
              padding: '16px', borderRadius: '16px', fontSize: '16px', fontWeight: 600,
              cursor: 'pointer', textDecoration: 'none', display: 'block', textAlign: 'center'
            }}>
              Agendar cita ahora
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
