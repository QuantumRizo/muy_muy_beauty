import { Target, BarChart2, Pause, Play, Edit3, Trash2 } from 'lucide-react'
import type { MarketingCampana } from '../../types/database'

const fmt = (n: number, decimals = 2) =>
  new Intl.NumberFormat('es-MX', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(n)

const fmtMoney = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 }).format(n)

const fmtBig = (n: number) => {
  if (n >= 1_000_000) return `${fmt(n / 1_000_000, 1)}M`
  if (n >= 1_000)     return `${fmt(n / 1_000, 1)}K`
  return fmt(n, 0)
}

export const PLATFORM_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  meta:   { bg: '#1877F2', color: '#fff', label: 'Meta Ads'   },
  google: { bg: '#EA4335', color: '#fff', label: 'Google Ads' },
  otro:   { bg: '#6b7280', color: '#fff', label: 'Otro'       },
}

export const ESTADO_STYLES: Record<string, { bg: string; color: string }> = {
  activa:     { bg: 'rgba(22,163,74,0.1)',    color: 'var(--kpi)'    },
  pausada:    { bg: 'var(--accent-light)',    color: 'var(--accent)' },
  finalizada: { bg: 'rgba(107,114,128,0.1)', color: '#6b7280'       },
}

interface CampanaRowProps {
  c: MarketingCampana
  onEdit: () => void
  onDelete: () => void
  onToggle: () => void
}

export function CampanaRow({ c, onEdit, onDelete, onToggle }: CampanaRowProps) {
  const pStyle = PLATFORM_COLORS[c.platform] ?? PLATFORM_COLORS['otro']
  const eStyle = ESTADO_STYLES[c.estado]     ?? ESTADO_STYLES['finalizada']
  const cpl = c.leads > 0 ? c.gasto / c.leads : null
  const ctr = c.impresiones > 0 ? (c.clics / c.impresiones) * 100 : null

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)',
      padding: '14px 18px',
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      transition: 'border-color 0.15s, box-shadow 0.15s',
    }}
    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-2)'; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-sm)' }}
    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
    >
      {/* Platform Icon */}
      <div style={{ width: 38, height: 38, borderRadius: 10, background: pStyle.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {c.platform === 'meta' ? <Target size={18} color={pStyle.color} /> : <BarChart2 size={18} color={pStyle.color} />}
      </div>

      {/* Name & badges */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {c.nombre}
          </span>
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: eStyle.bg, color: eStyle.color, flexShrink: 0 }}>
            {c.estado.charAt(0).toUpperCase() + c.estado.slice(1)}
          </span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
          {pStyle.label}
          {c.fecha_inicio && ` · ${c.fecha_inicio}`}
          {c.fecha_fin    && ` → ${c.fecha_fin}`}
        </div>
      </div>

      {/* Metrics */}
      <div style={{ display: 'flex', gap: 24, flexShrink: 0 }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 2 }}>Inversión</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>{fmtMoney(c.gasto)}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 2 }}>Leads</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>{fmtBig(c.leads)}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 2 }}>CPL</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: cpl !== null ? 'var(--success)' : 'var(--text-3)' }}>
            {cpl !== null ? fmtMoney(cpl) : '—'}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 2 }}>CTR</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>
            {ctr !== null ? `${fmt(ctr, 2)}%` : '—'}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
        <button onClick={onToggle} title={c.estado === 'activa' ? 'Pausar' : 'Activar'}
          style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)' }}>
          {c.estado === 'activa' ? <Pause size={13} /> : <Play size={13} />}
        </button>
        <button onClick={onEdit}
          style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)' }}>
          <Edit3 size={13} />
        </button>
        <button onClick={onDelete}
          style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger)' }}>
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}
