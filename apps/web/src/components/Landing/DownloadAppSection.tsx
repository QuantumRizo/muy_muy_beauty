import { Calendar, History, Trophy } from 'lucide-react'

interface DownloadAppSectionProps {
  isMobile: boolean
}

export default function DownloadAppSection({ isMobile }: DownloadAppSectionProps) {
  return (
    <section id="download-app" style={{
      background: '#fff',
      padding: isMobile ? '80px 24px' : '140px 40px',
      overflow: 'hidden'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: 'center',
        gap: isMobile ? '60px' : '100px'
      }}>
        
        {/* Content Column */}
        <div style={{ flex: 1, textAlign: isMobile ? 'center' : 'left' }}>
          <h2 style={{
            fontSize: 'clamp(36px, 6vw, 64px)',
            lineHeight: 1,
            color: '#1d1d1f',
            marginBottom: '40px',
            textTransform: 'uppercase',
            letterSpacing: '-2px'
          }}>
            Descárgate <br /> nuestra app
          </h2>

          <p style={{
            fontSize: '20px',
            color: '#666',
            marginBottom: '56px',
            maxWidth: '500px',
            lineHeight: 1.6
          }}>
            Lleva la experiencia MUYMUY en tu bolsillo. Gestiona tus citas y accede a beneficios exclusivos desde cualquier lugar.
          </p>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '32px',
            marginBottom: '64px'
          }}>
            {[
              { icon: <Calendar size={24} />, text: 'Agendar citas en segundos' },
              { icon: <History size={24} />, text: 'Historial completo de tus visitas' },
              { icon: <Trophy size={24} />, text: 'Programa de lealtad', badge: 'Próximamente' }
            ].map((item, idx) => (
              <div key={idx} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                justifyContent: isMobile ? 'center' : 'flex-start'
              }}>
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '16px',
                  background: '#fcfbf9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent)',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.05)'
                }}>
                  {item.icon}
                </div>
                <div style={{ textAlign: 'left' }}>
                  <span style={{ fontSize: '18px', fontWeight: 600, color: '#1d1d1f' }}>
                    {item.text}
                  </span>
                  {item.badge && (
                    <span style={{
                      display: 'block',
                      fontSize: '12px',
                      color: 'var(--accent)',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      marginTop: '4px',
                      letterSpacing: '1px'
                    }}>
                      {item.badge}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div style={{
            display: 'flex',
            gap: '16px',
            justifyContent: isMobile ? 'center' : 'flex-start'
          }}>
            {/* Minimalist App Badges */}
          <div style={{
            display: 'flex',
            gap: '16px',
            justifyContent: isMobile ? 'center' : 'flex-start',
            alignItems: 'center'
          }}>
            <img 
              src="/appstore.webp" 
              alt="Download on App Store" 
              style={{ height: '54px', width: 'auto', cursor: 'pointer' }} 
            />
            <img 
              src="/playstore.webp" 
              alt="Get it on Google Play" 
              style={{ height: '54px', width: 'auto', cursor: 'pointer' }} 
            />
          </div>
          </div>
        </div>

        {/* Image Column */}
        <div style={{ 
          flex: 1, 
          position: 'relative',
          display: 'flex',
          justifyContent: 'center'
        }}>
          <div style={{
            position: 'absolute',
            width: '120%',
            height: '120%',
            background: 'radial-gradient(circle, var(--accent-light) 0%, transparent 70%)',
            opacity: 0.1,
            zIndex: 0,
            top: '-10%',
            left: '-10%'
          }} />
          <img 
            src="/descarga_app.webp" 
            alt="MUYMUY App" 
            style={{
              width: isMobile ? '100%' : '110%',
              maxWidth: '500px',
              height: 'auto',
              position: 'relative',
              zIndex: 1,
              filter: 'drop-shadow(0 30px 60px rgba(0,0,0,0.15))'
            }}
          />
        </div>

      </div>

      <style>{`
        #download-app h2 {
          font-family: 'Bodoni Moda', serif !important;
        }
      `}</style>
    </section>
  )
}
