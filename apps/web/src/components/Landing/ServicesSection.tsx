import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

function slugify(text: string) {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-')
}

function Tile({
  tile,
  globalIndex,
  isMobile,
}: {
  tile: { nombre: string; imagen_url: string; descripcion?: string }
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
      to={`/servicios/${slugify(tile.nombre)}`}
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
        backgroundColor: '#f5f5f7'
      }}
    >
      {tile.imagen_url && (
        <img
          src={tile.imagen_url}
          alt={tile.nombre}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
      )}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)',
      }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: isMobile ? '24px' : '32px', zIndex: 1 }}>
        <h3 style={{ color: '#fff', fontSize: isMobile ? '22px' : '26px', fontWeight: 800, marginBottom: 8, letterSpacing: '-0.5px', lineHeight: 1.1 }}>
          {tile.nombre}
        </h3>
        <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '14px', lineHeight: 1.45, marginBottom: 16, maxWidth: '95%' }}>
          {tile.descripcion || 'Descubre nuestros servicios de alta calidad y atención personalizada.'}
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
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 880)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    async function loadCategories() {
      const { data } = await supabase
        .from('categorias_servicio')
        .select('id, nombre, descripcion, imagen_url, orden')
        .eq('activo', true)
        .order('orden')
      setCategories(data || [])
      setLoading(false)
    }
    loadCategories()
  }, [])

  return (
    <section id="services" style={{ background: '#ffffff', padding: isMobile ? '60px 16px' : '120px 40px', overflow: 'hidden' }}>
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

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#888' }}>
            Cargando servicios...
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', 
            gap: '32px' 
          }}>
            {categories.map((cat, idx) => (
              <Tile
                key={cat.id}
                tile={cat}
                globalIndex={idx}
                isMobile={isMobile}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}