import { MapPin } from 'lucide-react'

// ─── Componente SVG de Instagram ──────────────────────────────
const InstagramIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" style={{ stopColor: '#f09433' }} />
        <stop offset="25%" style={{ stopColor: '#e6683c' }} />
        <stop offset="50%" style={{ stopColor: '#dc2743' }} />
        <stop offset="75%" style={{ stopColor: '#cc2366' }} />
        <stop offset="100%" style={{ stopColor: '#bc1888' }} />
      </linearGradient>
    </defs>
    <path d="M12 2C9.27 2 8.93 2.01 7.86 2.06C6.8 2.11 6.07 2.28 5.45 2.52C4.81 2.77 4.27 3.1 3.73 3.64C3.19 4.18 2.86 4.72 2.61 5.36C2.37 5.98 2.2 6.71 2.15 7.77C2.1 8.84 2.1 9.18 2.1 11.91C2.1 14.64 2.1 14.98 2.15 16.05C2.2 17.11 2.37 17.84 2.61 18.46C2.86 19.1 3.19 19.64 3.73 20.18C4.27 20.72 4.81 21.05 5.45 21.3C6.07 21.54 6.8 21.71 7.86 21.76C8.93 21.81 9.27 21.82 12 21.82C14.73 21.82 15.07 21.81 16.14 21.76C17.2 21.71 17.93 21.54 18.55 21.3C19.19 21.05 19.73 20.72 20.27 20.18C20.81 19.64 21.14 19.1 21.39 18.46C21.63 17.84 21.8 17.11 21.85 16.05C21.9 14.98 21.9 14.64 21.9 11.91C21.9 9.18 21.9 8.84 21.85 7.77C21.8 6.71 21.63 5.98 21.39 5.36C21.14 4.72 20.81 4.18 20.27 3.64C19.73 3.1 19.19 2.77 18.55 2.52C17.93 2.28 17.2 2.11 16.14 2.06C15.07 2.01 14.73 2 12 2V2ZM12 4.16C14.68 4.16 15 4.17 16.06 4.22C17.04 4.26 17.57 4.43 17.93 4.57C18.41 4.75 18.74 4.97 19.1 5.33C19.46 5.69 19.68 6.02 19.86 6.5C20 6.86 20.17 7.39 20.21 8.37C20.26 9.43 20.27 9.75 20.27 12.43C20.27 15.11 20.26 15.43 20.21 16.49C20.17 17.47 20 18 19.86 18.36C19.68 18.84 19.46 19.17 19.1 19.53C18.74 19.89 18.41 20.11 17.93 20.29C17.57 20.43 17.04 20.6 16.06 20.64C15 20.69 14.68 20.7 12 20.7C9.32 20.7 9 20.69 7.94 20.64C6.96 20.6 6.43 20.43 6.07 20.29C5.59 20.11 5.26 19.89 4.9 19.53C4.54 19.17 4.32 18.84 4.14 18.36C4 18 3.83 17.47 3.79 16.49C3.74 15.43 3.73 15.11 3.73 12.43C3.73 9.75 3.74 9.43 3.79 8.37C3.83 7.39 4 6.86 4.14 6.5C4.32 5.02 4.54 5.69 4.9 5.33C5.26 4.97 5.59 4.75 6.07 4.57C6.43 4.43 6.96 4.26 7.94 4.22C9 4.17 9.32 4.16 12 4.16V4.16ZM12 6.83C9.13 6.83 6.83 9.13 6.83 12C6.83 14.87 9.13 17.17 12 17.17C14.87 17.17 17.17 14.87 17.17 12C17.17 9.13 14.87 6.83 12 6.83ZM12 15.39C10.13 15.39 8.61 13.87 8.61 12C8.61 10.13 10.13 8.61 12 8.61C13.87 8.61 15.39 10.13 15.39 12C15.39 13.87 13.87 15.39 12 15.39ZM18.57 6.64C18.57 7.31 18.03 7.85 17.36 7.85C16.69 7.85 16.15 7.31 16.15 6.64C16.15 5.97 16.69 5.43 17.36 5.43C18.03 5.43 18.57 5.97 18.57 6.64Z" fill="url(#ig-grad)" />
  </svg>
)

const BRANCHES = [
  {
    nombre: "Homero",
    direccion: "Av. Homero 1629, Polanco I Secc, Miguel Hidalgo, 11510 CDMX",
    telefono: "55 2703 2830"
  },
  {
    nombre: "Newton",
    direccion: "Av. Isaac Newton 215, Polanco V Secc, Miguel Hidalgo, 11560 CDMX",
    telefono: "56 1901 1318"
  },
  {
    nombre: "Euler",
    direccion: "Euler 152, Polanco V Secc, Miguel Hidalgo, 11550 CDMX",
    telefono: "55 4939 5929"
  },
  {
    nombre: "Campos Eliseos",
    direccion: "Campos Elíseos 169, Polanco V Secc, Miguel Hidalgo, 11580 CDMX",
    telefono: "55 4453 3065"
  }
]

export default function ContactSection() {
  return (
    <section id="contact" style={{ padding: '100px 24px', background: '#1d1d1f', color: '#fff' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 80, marginBottom: 80 }}>
          {/* Info de la marca */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
              <img src="/logoVertical.png" alt="MUYMUY" style={{ height: '44px', filter: 'invert(1)' }} />
              <span style={{ fontWeight: 700, fontSize: '26px', letterSpacing: '-1px' }}>MUYMUY</span>
            </div>
            <p style={{ fontSize: '17px', color: '#86868b', lineHeight: 1.6, marginBottom: 40, maxWidth: '400px' }}>
              Redefiniendo los estándares de belleza y bienestar. Visítanos en cualquiera de nuestras sucursales en Polanco.
            </p>
            <div style={{ display: 'flex', gap: 24, marginBottom: 32 }}>
              <a href="https://instagram.com" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(255,255,255,0.05)', borderRadius: '12px', width: '48px', height: '48px'
              }}>
                <InstagramIcon size={30} />
              </a>
            </div>
          </div>

          {/* Sucursales */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 40 }}>
            {BRANCHES.map((branch, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <MapPin size={18} color="var(--accent)" />
                  <h4 style={{ fontSize: '18px', fontWeight: 700 }}>{branch.nombre}</h4>
                </div>
                <p style={{ fontSize: '14px', color: '#86868b', lineHeight: 1.5, minHeight: '44px' }}>
                  {branch.direccion}
                </p>
                <a href={`tel:${branch.telefono.replace(/\s/g, '')}`} style={{
                  fontSize: '14px', color: '#fff', textDecoration: 'none',
                  display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600
                }}>
                  {branch.telefono}
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '40px 0 0',
          borderTop: '1px solid rgba(255,255,255,0.1)', textAlign: 'center',
          fontSize: '13px', color: '#86868b'
        }}>
          © 2026 MUYMUY Beauty Studio. Todos los derechos reservados.
        </div>
      </div>
    </section>
  )
}
