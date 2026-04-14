const CATEGORIES = [
  {
    title: "Esmaltado Permanente",
    image: "/esmaltado permanente_compressed.webp",
    description: "La novedosa técnica que ha revolucionado el mundo de las uñas: el único esmaltado permanente de larga duración y 20Free.",
    linkText: "Descubre más"
  },
  {
    title: "Uñas Esculpidas",
    image: "/unas esculpidas_compressed.webp",
    description: "Uñas esculpidas con las mejores técnicas del mercado: uñas de gel, uñas en acrílico... ¡Ponte en buenas manos! ¡No esperes más!",
    linkText: "Descubre más"
  },
  {
    title: "Manicura & Spa",
    image: "/manicura_compressed.webp",
    description: "¡Tus manos hablan de ti! Cuídalas con nuestros servicios de manicura: limar y esmaltar, manicura básica, spa, etc.",
    linkText: "Descubre más"
  },
  {
    title: "Cuidado Facial",
    image: "/facial_compressed.webp",
    description: "Protocolos de higiene profunda y tratamientos personalizados para una piel luminosa, sana y revitalizada.",
    linkText: "Descubre más"
  },
  {
    title: "Masajes Terapéuticos",
    image: "/Masaje_compressed.webp",
    description: "Un refugio para el estrés. Sesiones de relajación profunda y reflexología para restaurar tu equilibrio corporal y mental.",
    linkText: "Descubre más"
  },
  {
    title: "Pedicura Avanzada",
    image: "/Pedicura_compressed.webp",
    description: "Salud y estética integral para tus pies. Desde relajantes sesiones spa hasta pedicuras técnicas especializadas.",
    linkText: "Descubre más"
  },
  {
    title: "Eyes & Brows",
    image: "/Eyes Beauty_compressed.webp",
    description: "Realzamos tu mirada. Diseños de cejas y elevación de pestañas que enmarcan tu rostro con elegancia y naturalidad.",
    linkText: "Descubre más"
  },
  {
    title: "Depilación Premium",
    image: "/depilacion_compressed.webp",
    description: "Suavidad duradera con técnicas delicadas y efectivas. Una experiencia de depilación profesional en un ambiente de confort.",
    linkText: "Descubre más"
  },
  {
    title: "Nail Art & Diseño",
    image: "/Nail art_compressed.webp",
    description: "El toque artístico final. Decoraciones exclusivas y diseños personalizados para que tus uñas sean una obra de arte.",
    linkText: "Descubre más"
  }
]

export default function ServicesSection() {
  return (
    <section id="services" style={{ padding: '120px 24px', background: '#fff' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 80 }}>
          <h2 style={{ fontSize: 'clamp(32px, 6vw, 56px)', fontWeight: 800, letterSpacing: '-2px', marginBottom: 20 }}>
            Nuestro Menú de Servicios
          </h2>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          columnGap: '40px',
          rowGap: '60px'
        }}>
          {CATEGORIES.map((cat, idx) => (
            <div key={idx} style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              cursor: 'default'
            }}>
              <div style={{
                width: '100%',
                aspectRatio: '16/10',
                borderRadius: '12px',
                overflow: 'hidden',
                marginBottom: '24px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
              }}>
                <img
                  src={cat.image}
                  alt={cat.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.6s ease' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                />
              </div>

              <h3 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '12px', color: '#000' }}>
                {cat.title}
              </h3>

              <p style={{
                fontSize: '15px',
                color: '#1d1d1f',
                lineHeight: '1.5',
                marginBottom: '16px',
                maxWidth: '300px'
              }}>
                {cat.description}
              </p>

              <a href="#" style={{
                fontSize: '15px',
                fontStyle: 'italic',
                color: '#1d1d1f',
                textDecoration: 'none',
                borderBottom: '1px solid #1d1d1f',
                paddingBottom: '2px'
              }}>
                {cat.linkText}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
