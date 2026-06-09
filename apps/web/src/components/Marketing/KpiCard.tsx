import { TrendingUp, TrendingDown } from 'lucide-react'

export interface KpiCardProps {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
  gradient?: string
  positive?: boolean
  loading?: boolean
}

export function KpiCard({ icon, label, value, sub, gradient, positive, loading }: KpiCardProps) {
  return (
    <div style={{
      background: gradient ?? 'var(--surface)',
      borderRadius: 'var(--radius-lg)',
      border: gradient ? 'none' : '1px solid var(--border)',
      padding: '18px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      boxShadow: gradient ? '0 4px 20px rgba(0,0,0,0.1)' : 'var(--shadow-sm)',
      position: 'relative',
      overflow: 'hidden',
      transition: 'transform 0.2s, box-shadow 0.2s',
    }}
    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = gradient ? '0 8px 28px rgba(162, 181, 92, 0.25)' : 'var(--shadow-md)' }}
    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = gradient ? '0 4px 20px rgba(162, 181, 92, 0.2)' : 'var(--shadow-sm)' }}
    >
      {/* Decorative circle */}
      {gradient && (
        <div style={{
          position: 'absolute', right: -20, top: -20,
          width: 100, height: 100, borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)'
        }} />
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: gradient ? 'rgba(255,255,255,0.2)' : 'var(--surface-2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: gradient ? '#fff' : 'var(--text-2)'
        }}>
          {icon}
        </div>
        {sub && positive !== undefined && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 600,
            color: positive ? 'var(--kpi)' : '#dc2626'
          }}>
            {positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {sub}
          </div>
        )}
      </div>
      <div>
        <div style={{
          fontSize: 22, fontWeight: 700,
          color: gradient ? '#fff' : 'var(--text-1)',
          letterSpacing: '-0.5px'
        }}>
          {loading ? (
            <div style={{ height: 28, width: 80, borderRadius: 4, background: gradient ? 'rgba(255,255,255,0.2)' : 'var(--border)', animation: 'pulse 1.5s infinite' }} />
          ) : value}
        </div>
        <div style={{
          fontSize: 12, marginTop: 2,
          color: gradient ? 'rgba(255,255,255,0.75)' : 'var(--text-2)'
        }}>
          {label}
        </div>
      </div>
      {sub && positive === undefined && (
        <div style={{ fontSize: 11, color: gradient ? 'rgba(255,255,255,0.65)' : 'var(--text-3)' }}>
          {sub}
        </div>
      )}
    </div>
  )
}
