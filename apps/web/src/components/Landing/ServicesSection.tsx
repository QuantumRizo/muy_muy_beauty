import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

const SLUG_MAP: Record<string, string> = {
  'Esmaltado Permanente': 'esmaltado-permanente',
  'Uñas Esculpidas': 'unas-esculpidas',
  'Eyes & Brows': 'eyes-brows',
  'Manicura & Spa': 'manicura-spa',
  'Cuidado Facial': 'cuidado-facial',
  'Masajes Terapéuticos': 'masajes-terapeuticos',
  'Pedicura Avanzada': 'pedicura-avanzada',
  'Nail Art & Diseño': 'nail-art-diseno',
  'Depilación Láser': 'depilacion-laser'
}

const SERVICES_DATA = [
  {
    title: 'Esmaltado Permanente',
    image: '/esmaltado permanente_compressed.webp',
    description: 'Técnica revolucionaria de larga duración con acabado profesional.',
  },
  {
    title: 'Uñas Esculpidas',
    image: '/unas esculpidas_compressed.webp',
    description: 'Técnica de gel con las mejores técnicas del mercado.',
  },
  {
    title: 'Eyes & Brows',
    image: '/Eyes Beauty_compressed.webp',
    description: 'Realzamos tu mirada con elegancia y naturalidad.',
  },
  {
    title: 'Manicura & Spa',
    image: '/manicura_compressed.webp',
    description: 'Cuídalas con nuestros servicios de manicura básica y spa.',
  },
  {
    title: 'Cuidado Facial',
    image: '/facial_compressed.webp',
    description: 'Protocolos de higiene profunda y personalizados.',
  },
  {
    title: 'Masajes Terapéuticos',
    image: '/Masaje_compressed.webp',
    description: 'Un refugio para el estrés. Sesiones terapéuticas.',
  },
  {
    title: 'Pedicura Avanzada',
    image: '/Pedicura_compressed.webp',
    description: 'Salud y estética integral para tus pies.',
  },
  {
    title: 'Nail Art & Diseño',
    image: '/Nail art_compressed.webp',
    description: 'Decoraciones exclusivas y diseños personalizados.',
  },
  {
    title: 'Depilación Láser',
    image: '/depilacion_compressed.webp',
    description: 'Piel suave y perfecta con tecnología indolora.',
  },
]

function Tile({
  tile,
  globalIndex,
  isMobile,
}: {
  tile: typeof SERVICES_DATA[0]
  globalIndex: number
  isMobile: boolean
}) {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); io.disconnect() } },
      { threshold: 0.05 }
    )
    if (ref.current) io.observe(ref.current)
    return () => io.disconnect()
  }, [])

  return (
    <Link
      to={`/servicios/${SLUG_MAP[tile.title] || ''}`}
      ref={ref}
      className="svc-tile"
      style={{
        display: 'block',
        textDecoration: 'none',
        width: '100%',
        aspectRatio: isMobile ? '1 / 1' : '4 / 5',
        position: 'relative',
        borderRadius: '24px',
        overflow: 'hidden',
        cursor: 'pointer',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(40px)',
        transition: `opacity 0.9s ease ${globalIndex * 0.1}s, transform 1.1s cubic-bezier(0.2, 1, 0.3, 1) ${globalIndex * 0.1}s`,
        boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
      }}
    >
      <img
        src={tile.image}
        alt={tile.title}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
      />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)',
      }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: isMobile ? '24px' : '32px', zIndex: 1 }}>
        <h3 style={{ color: '#fff', fontSize: isMobile ? '22px' : '26px', fontWeight: 800, marginBottom: 8, letterSpacing: '-0.5px', lineHeight: 1.1 }}>
          {tile.title}
        </h3>
        <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '14px', lineHeight: 1.45, marginBottom: 16, maxWidth: '95%' }}>
          {tile.description}
        </p>
        <span style={{ color: '#fff', fontSize: '13px', fontWeight: 500, textDecoration: 'underline', textUnderlineOffset: '4px', opacity: 0.9 }}>
          Descubre más
        </span>
      </div>
    </Link>
  )
}

export default function ServicesSection() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 880 : false
  )

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 880)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <section id="services" style={{ background: '#ffffff', padding: isMobile ? '60px 16px' : '120px 40px', overflow: 'hidden' }}>
      {/*
        CSS puro: en móvil los tiles SIEMPRE visibles, sin depender de JS ni IntersectionObserver.
        Desktop queda intacto con su animación de scroll reveal.
      */}
      <style>{`
        @media (max-width: 879px) {
          .svc-tile {
            opacity: 1 !important;
            transform: none !important;
            transition: none !important;
          }
        }
      `}</style>

      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 80 }}>
          <h2 style={{ fontSize: 'clamp(32px, 5vw, 68px)', fontWeight: 900, letterSpacing: '-3px', color: '#1d1d1f', textTransform: 'uppercase' }}>
            Nuestros Servicios
          </h2>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', 
          gap: '32px' 
        }}>
          {SERVICES_DATA.map((tile, idx) => (
            <Tile
              key={tile.title}
              tile={tile}
              globalIndex={idx}
              isMobile={isMobile}
            />
          ))}
        </div>
      </div>
    </section>
  )
}