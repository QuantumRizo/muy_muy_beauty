import { type LucideIcon } from 'lucide-react'

interface Props {
  title: string
  value: string | number
  subtitle?: string
  Icon: LucideIcon
  variant?: 'white' | 'accent' | 'success' | 'danger'
}

export default function KPICard({ title, value, subtitle, Icon, variant = 'white' }: Props) {
  const isWhite = variant === 'white'
  
  // Style configurations
  const config = {
    accent: {
      bg: 'linear-gradient(135deg, var(--accent) 0%, #d97706 100%)',
      text: '#fff',
      subText: 'rgba(255, 255, 255, 0.75)',
      iconBg: 'rgba(255, 255, 255, 0.2)',
      iconColor: '#fff',
      shadow: '0 4px 20px rgba(245, 158, 11, 0.3)',
      decor: 'rgba(255, 255, 255, 0.08)'
    },
    success: {
      bg: 'linear-gradient(135deg, #16a34a 0%, #0f7a35 100%)',
      text: '#fff',
      subText: 'rgba(255, 255, 255, 0.75)',
      iconBg: 'rgba(255, 255, 255, 0.2)',
      iconColor: '#fff',
      shadow: '0 4px 20px rgba(22, 163, 74, 0.25)',
      decor: 'rgba(255, 255, 255, 0.08)'
    },
    danger: {
      bg: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
      text: '#fff',
      subText: 'rgba(255, 255, 255, 0.75)',
      iconBg: 'rgba(255, 255, 255, 0.2)',
      iconColor: '#fff',
      shadow: '0 4px 20px rgba(220, 38, 38, 0.25)',
      decor: 'rgba(255, 255, 255, 0.08)'
    },
    white: {
      bg: 'var(--surface)',
      text: 'var(--text-1)',
      subText: 'var(--text-3)',
      iconBg: 'var(--accent-light)',
      iconColor: 'var(--accent)',
      shadow: 'var(--shadow-sm)',
      decor: 'transparent'
    }
  }[variant]

  return (
    <div 
      className={`card ${!isWhite ? 'premium-card' : ''}`} 
      style={{ 
        padding: '20px 22px', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'space-between', 
        minHeight: '135px', 
        position: 'relative',
        background: config.bg,
        color: config.text,
        border: isWhite ? '1px solid var(--border)' : 'none',
        boxShadow: config.shadow,
        overflow: 'hidden',
        transition: 'all 0.2s ease'
      }}
    >
      {/* Decorative background shape */}
      {!isWhite && (
        <div style={{
          position: 'absolute', right: -25, top: -25,
          width: 100, height: 100, borderRadius: '50%',
          background: config.decor, pointerEvents: 'none'
        }} />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', position: 'relative', zIndex: 1 }}>
        <h3 style={{ 
          fontSize: '11px', 
          fontWeight: 700, 
          color: isWhite ? 'var(--text-3)' : 'rgba(255,255,255,0.85)', 
          textTransform: 'uppercase', 
          letterSpacing: '0.8px', 
          margin: 0 
        }}>
          {title}
        </h3>
        <div style={{ 
          padding: '9px', 
          borderRadius: '12px', 
          background: config.iconBg, 
          color: config.iconColor, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          <Icon size={18} strokeWidth={2.5} />
        </div>
      </div>

      <div style={{ marginTop: 'auto', position: 'relative', zIndex: 1 }}>
        <p style={{ 
          fontSize: '24px', 
          fontWeight: 800, 
          color: config.text, 
          margin: '0 0 4px 0', 
          letterSpacing: '-0.5px', 
          lineHeight: 1 
        }}>
          {value}
        </p>
        {subtitle && (
          <p style={{ 
            fontSize: '11px', 
            fontWeight: 500, 
            color: config.subText, 
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  )
}