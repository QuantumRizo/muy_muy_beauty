import { useEffect, useState } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { FAMILIES_DATA } from '../data/servicesData'
import LandingNavbar from '../components/Landing/LandingNavbar'
import ContactSection from '../components/Landing/ContactSection'
import { ArrowLeft, Clock } from 'lucide-react'

export default function ServiceFamilyPage() {
  const { slug } = useParams<{ slug: string }>()
  const family = FAMILIES_DATA.find(f => f.slug === slug)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 900)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [slug])

  if (!family) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="landing-editorial" style={{ background: '#fff', color: '#1d1d1f', fontFamily: '"Inter", -apple-system, sans-serif', minHeight: '100vh' }}>
      <LandingNavbar />

      {/* HERO SECTION */}
      <section style={{ 
        position: 'relative', 
        height: isMobile ? '60vh' : '70vh', 
        minHeight: '400px',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        background: '#000'
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url("${family.image}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.7,
          zIndex: 0
        }} />
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)',
          zIndex: 1
        }} />
        
        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: '0 24px', maxWidth: '1000px' }}>
          <nav style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'rgba(255,255,255,0.7)', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>Inicio</Link>
            <span>/</span>
            <span style={{ color: '#fff' }}>Servicios</span>
          </nav>
          <h1 style={{ 
            fontSize: 'clamp(40px, 8vw, 80px)', 
            color: '#fff', 
            margin: 0,
            lineHeight: 0.9,
            textShadow: '0 10px 30px rgba(0,0,0,0.3)'
          }}>
            {family.name}
          </h1>
        </div>
      </section>

      {/* CONTENT SECTION */}
      <section style={{ padding: isMobile ? '60px 24px' : '100px 8%', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '60px' : '100px', alignItems: 'start' }}>
          
          {/* DESCRIPTION */}
          <div>
            <p style={{ fontSize: '18px', lineHeight: 1.7, color: '#444', marginBottom: '48px' }}>
              {family.description}
            </p>
            <Link to="/reservar" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '12px',
              background: '#1d1d1f',
              color: '#fff',
              padding: '20px 40px',
              borderRadius: '100px',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '16px',
              transition: 'all 0.3s ease',
              boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
            }}>
              Reservar ahora
            </Link>
          </div>

          {/* SERVICE LIST */}
          <div style={{ background: '#fcfbf9', padding: isMobile ? '32px' : '56px', borderRadius: '32px', border: '1px solid #eee' }}>
            <h3 style={{ fontSize: '24px', marginBottom: '40px', color: '#000', borderBottom: '1px solid #1d1d1f', paddingBottom: '16px' }}>
              Menú de Servicios
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              {family.services.map((svc) => (
                <div key={svc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px' }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '17px', fontWeight: 700, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {svc.nombre}
                    </h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: '#666', fontSize: '13px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={14} />
                        {svc.duracion_slots * 15} min
                      </span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--accent)' }}>
                      ${parseFloat(svc.precio).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      <div style={{ padding: '0 24px 60px', textAlign: 'center' }}>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#666', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>
          <ArrowLeft size={16} /> Volver a inicio
        </Link>
      </div>

      <ContactSection />

      <style>{`
        .landing-editorial h1, 
        .landing-editorial h2, 
        .landing-editorial h3 {
          font-family: 'Bodoni Moda', serif !important;
          font-weight: 800;
          letter-spacing: -2px;
          text-transform: uppercase;
        }
      `}</style>
    </div>
  )
}
