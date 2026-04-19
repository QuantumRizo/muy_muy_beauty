import { useEffect, useRef, useState } from 'react'

const ROWS: {
  height: string
  tiles: {
    title: string
    image: string
    description: string
    flex: string
    radius: string
  }[]
}[] = [
  {
    height: '400px',
    tiles: [
      {
        title: 'Esmaltado Permanente',
        image: '/esmaltado permanente_compressed.webp',
        description: 'Técnica revolucionaria de larga duración and 20Free.',
        flex: '1.2',
        radius: '32px 140px 60px 32px / 32px 120px 80px 32px',
      },
      {
        title: 'Uñas Esculpidas',
        image: '/unas esculpidas_compressed.webp',
        description: 'Técnica de gel con las mejores técnicas del mercado.',
        flex: '0.8',
        radius: '140px 32px 32px 100px / 120px 32px 32px 80px',
      },
      {
        title: 'Eyes & Brows',
        image: '/Eyes Beauty_compressed.webp',
        description: 'Realzamos tu mirada con elegancia y naturalidad.',
        flex: '1',
        radius: '32px 32px 120px 60px / 32px 32px 100px 80px',
      },
    ],
  },
  {
    height: '350px',
    tiles: [
      {
        title: 'Manicura & Spa',
        image: '/manicura_compressed.webp',
        description: 'Cuídalas con nuestros servicios de manicura básica y spa.',
        flex: '0.9',
        radius: '80px 32px 100px 32px / 100px 32px 80px 32px',
      },
      {
        title: 'Cuidado Facial',
        image: '/facial_compressed.webp',
        description: 'Protocolos de higiene profunda y personalizados.',
        flex: '1.3',
        radius: '32px 80px 32px 120px / 80px 32px 120px 32px',
      },
      {
        title: 'Masajes Terapéuticos',
        image: '/Masaje_compressed.webp',
        description: 'Un refugio para el estrés. Sesiones terapéuticas.',
        flex: '0.8',
        radius: '100px 32px 80px 32px / 120px 32px 60px 32px',
      },
    ],
  },
  {
    height: '380px',
    tiles: [
      {
        title: 'Pedicura Avanzada',
        image: '/Pedicura_compressed.webp',
        description: 'Salud y estética integral para tus pies.',
        flex: '1.1',
        radius: '32px 100px 32px 120px / 32px 80px 32px 140px',
      },
      {
        title: 'Nail Art & Diseño',
        image: '/Nail art_compressed.webp',
        description: 'Decoraciones exclusivas y diseños personalizados.',
        flex: '1',
        radius: '100px 32px 140px 32px / 80px 32px 120px 32px',
      },
      {
        title: 'Depilación Láser',
        image: '/depilacion_compressed.webp',
        description: 'Piel suave y perfecta con tecnología indolora.',
        flex: '0.9',
        radius: '32px 120px 32px 100px / 32px 140px 32px 80px',
      },
    ],
  },
]

function Tile({
  tile,
  rowHeight,
  globalIndex,
  isMobile,
}: {
  tile: typeof ROWS[0]['tiles'][0]
  rowHeight: string
  globalIndex: number
  isMobile: boolean
}) {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); io.disconnect() } },
      { threshold: 0.05 }
    )
    if (ref.current) io.observe(ref.current)
    return () => io.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className="svc-tile"
      style={{
        width: isMobile ? '100%' : 'auto',
        flex: isMobile ? 'none' : `${tile.flex} ${tile.flex} 0%`,
        height: isMobile ? '300px' : rowHeight,
        position: 'relative',
        borderRadius: isMobile ? '28px' : tile.radius,
        overflow: 'hidden',
        cursor: 'pointer',
        /* Desktop animation — overridden to visible on mobile via CSS below */
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(40px)',
        transition: `opacity 0.9s ease ${globalIndex * 0.1}s, transform 1.1s cubic-bezier(0.2, 1, 0.3, 1) ${globalIndex * 0.1}s`,
        boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
        flexShrink: 0,
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
        <a href="#reservar" style={{ color: '#fff', fontSize: '13px', fontWeight: 500, textDecoration: 'underline', textUnderlineOffset: '4px', opacity: 0.9 }}>
          Descubre más
        </a>
      </div>
    </div>
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

  let globalIndex = 0

  return (
    <section id="services" style={{ background: '#fcfbf9', padding: isMobile ? '60px 16px' : '120px 40px', overflow: 'hidden' }}>
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

      <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 80 }}>
          <h2 style={{ fontSize: 'clamp(32px, 5vw, 68px)', fontWeight: 900, letterSpacing: '-3px', color: '#1d1d1f', textTransform: 'uppercase' }}>
            Nuestros Servicios
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {ROWS.map((row, rowIdx) => (
            <div
              key={rowIdx}
              style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                gap: '20px',
                alignItems: 'stretch',
              }}
            >
              {row.tiles.map((tile) => (
                <Tile
                  key={tile.title}
                  tile={tile}
                  rowHeight={row.height}
                  globalIndex={globalIndex++}
                  isMobile={isMobile}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}