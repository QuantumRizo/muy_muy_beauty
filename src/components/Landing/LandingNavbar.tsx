import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'

export default function LandingNavbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50)
    const handleResize = () => setIsMobile(window.innerWidth < 900)

    handleScroll()
    handleResize()

    window.addEventListener('scroll', handleScroll)
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
      background: isScrolled ? 'rgba(255,255,255,0.8)' : (isMobile ? '#fff' : 'transparent'),
      backdropFilter: isScrolled ? 'blur(20px)' : 'none',
      height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '0 24px', transition: 'all 0.4s ease',
      borderBottom: (isScrolled || isMobile) ? '1px solid #f2f2f2' : 'none'
    }}>
      <div style={{ maxWidth: '1100px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/logoVertical.png" alt="MUYMUY" style={{ height: '32px' }} />
          <span style={{ fontWeight: 700, fontSize: '18px', letterSpacing: '-0.5px' }}>MUYMUY</span>
        </div>
        <div style={{ display: 'flex', gap: 30, fontSize: '14px', fontWeight: 500 }} className="desktop-only">
          <a href="#welcome" style={{ textDecoration: 'none', color: 'inherit' }}>Estudio</a>
          <a href="#services" style={{ textDecoration: 'none', color: 'inherit' }}>Servicios</a>
          <a href="#contact" style={{ textDecoration: 'none', color: 'inherit' }}>Contacto</a>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
          <Link to="/reservar" style={{
            background: '#1d1d1f', color: '#fff', border: 'none',
            padding: '8px 18px', borderRadius: '20px', fontSize: '13px', fontWeight: 600,
            cursor: 'pointer', textDecoration: 'none'
          }} className="desktop-only">
            Agendar Online
          </Link>

          <button
            onClick={() => setIsMenuOpen(true)}
            className="mobile-only"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1d1d1f', display: 'flex', alignItems: 'center' }}
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

          <a href="#welcome" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>Estudio</a>
          <a href="#services" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>Servicios</a>
          <a href="#contact" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>Contacto</a>

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
