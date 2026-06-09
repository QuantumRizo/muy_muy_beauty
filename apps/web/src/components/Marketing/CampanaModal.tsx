import { useState } from 'react'
import { X, CheckCircle, RefreshCw } from 'lucide-react'
import type { MarketingCampana } from '../../types/database'

interface CampanaModalProps {
  initial?: Partial<MarketingCampana>
  onSave: (data: Partial<MarketingCampana>) => Promise<boolean>
  saving: boolean
  onClose: () => void
}

export function CampanaModal({ initial, onSave, saving, onClose }: CampanaModalProps) {
  const [form, setForm] = useState<Partial<MarketingCampana>>({
    nombre: '', platform: 'meta', estado: 'activa',
    presupuesto: 0, gasto: 0, impresiones: 0, clics: 0, leads: 0,
    ...initial
  })

  const set = (k: keyof MarketingCampana, v: any) => setForm(f => ({ ...f, [k]: v }))

  async function handleSave() {
    if (!form.nombre?.trim()) return
    const ok = await onSave(form)
    if (ok) onClose()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 200, padding: 16
    }}>
      <div style={{
        background: 'var(--surface)', borderRadius: 'var(--radius-lg)',
        width: '100%', maxWidth: 500,
        boxShadow: 'var(--shadow-lg)', overflow: 'hidden',
        animation: 'modalIn 0.18s ease'
      }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)' }}>
            {initial ? 'Editar campaña' : 'Nueva campaña'}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)' }}><X size={18} /></button>
        </div>

        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '65vh', overflowY: 'auto' }}>
          <div className="form-group">
            <label className="form-label">Nombre de la campaña *</label>
            <input className="form-input" value={form.nombre ?? ''} onChange={e => set('nombre', e.target.value)} placeholder="Ej: Verano 2026 - Descuentos" />
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Plataforma</label>
              <select className="form-input" value={form.platform ?? 'meta'} onChange={e => set('platform', e.target.value)}>
                <option value="meta">Meta Ads</option>
                <option value="google">Google Ads</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Estado</label>
              <select className="form-input" value={form.estado ?? 'activa'} onChange={e => set('estado', e.target.value)}>
                <option value="activa">Activa</option>
                <option value="pausada">Pausada</option>
                <option value="finalizada">Finalizada</option>
              </select>
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Fecha inicio</label>
              <input type="date" className="form-input" value={form.fecha_inicio ?? ''} onChange={e => set('fecha_inicio', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Fecha fin</label>
              <input type="date" className="form-input" value={form.fecha_fin ?? ''} onChange={e => set('fecha_fin', e.target.value)} />
            </div>
          </div>

          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 4 }}>
            Métricas
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Presupuesto ($)</label>
              <input type="number" className="form-input" value={form.presupuesto ?? 0} onChange={e => set('presupuesto', parseFloat(e.target.value) || 0)} />
            </div>
            <div className="form-group">
              <label className="form-label">Gasto real ($)</label>
              <input type="number" className="form-input" value={form.gasto ?? 0} onChange={e => set('gasto', parseFloat(e.target.value) || 0)} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <div className="form-group">
              <label className="form-label">Impresiones</label>
              <input type="number" className="form-input" value={form.impresiones ?? 0} onChange={e => set('impresiones', parseInt(e.target.value) || 0)} />
            </div>
            <div className="form-group">
              <label className="form-label">Clics</label>
              <input type="number" className="form-input" value={form.clics ?? 0} onChange={e => set('clics', parseInt(e.target.value) || 0)} />
            </div>
            <div className="form-group">
              <label className="form-label">Leads</label>
              <input type="number" className="form-input" value={form.leads ?? 0} onChange={e => set('leads', parseInt(e.target.value) || 0)} />
            </div>
          </div>
        </div>

        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving || !form.nombre?.trim()}>
            {saving ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle size={14} />}
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}
