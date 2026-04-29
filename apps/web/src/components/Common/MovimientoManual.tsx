import { useState } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import type { Empleada } from '../../types/database'

interface Props {
  tipo?: 'gasto' | 'ingreso'
  empleadas: Empleada[]
  isPending: boolean
  onClose: () => void
  onConfirm: (data: { tipo: 'Gasto / Salida' | 'Ingreso Extra'; monto: number; concepto: string; empleadaId: string }) => void
}

export default function MovimientoManual({ tipo: tipoProp, empleadas, isPending, onClose, onConfirm }: Props) {
  const [tipo, setTipo] = useState<'gasto' | 'ingreso'>(tipoProp ?? 'gasto')
  const [montoStr, setMontoStr] = useState('')
  const [concepto, setConcepto] = useState('Propina') // Default for gasto
  const [empleadaId, setEmpleadaId] = useState('')

  const isGasto = tipo === 'gasto'

  const handleConfirm = () => {
    const numericMonto = Number(montoStr)
    if (!concepto.trim() || numericMonto <= 0 || isNaN(numericMonto)) return
    onConfirm({
      tipo: isGasto ? 'Gasto / Salida' : 'Ingreso Extra',
      monto: numericMonto,
      concepto,
      empleadaId,
    })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          {/* Toggle Ingreso / Gasto */}
          <div style={{ display: 'flex', gap: 4, background: 'var(--surface-2)', borderRadius: 10, padding: 4 }}>
            <button
              onClick={() => setTipo('ingreso')}
              style={{
                flex: 1, padding: '6px 16px', borderRadius: 7, border: 'none', cursor: 'pointer',
                fontWeight: 600, fontSize: 12, transition: 'all 0.15s',
                background: tipo === 'ingreso' ? 'var(--success-bg)' : 'transparent',
                color: tipo === 'ingreso' ? 'var(--success)' : 'var(--text-3)',
              }}
            >
              <TrendingUp size={13} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
              Ingreso
            </button>
            <button
              onClick={() => setTipo('gasto')}
              style={{
                flex: 1, padding: '6px 16px', borderRadius: 7, border: 'none', cursor: 'pointer',
                fontWeight: 600, fontSize: 12, transition: 'all 0.15s',
                background: tipo === 'gasto' ? 'var(--danger-bg)' : 'transparent',
                color: tipo === 'gasto' ? 'var(--danger)' : 'var(--text-3)',
              }}
            >
              <TrendingDown size={13} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
              Gasto
            </button>
          </div>
        </div>

        <div className="modal-body p-5">
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label>Concepto / Descripción</label>
            {isGasto ? (
              <select className="form-input" value={concepto} onChange={e => setConcepto(e.target.value)}>
                <option value="Propina">Propina</option>
                <option value="Compra de material">Compra de material</option>
              </select>
            ) : (
              <input
                type="text"
                className="form-input"
                placeholder="Ej. Cambio de billete, depósito..."
                value={concepto}
                onChange={e => setConcepto(e.target.value)}
                autoFocus
              />
            )}
          </div>

          <div className="form-group" style={{ marginBottom: 16 }}>
            <label>Monto ($)</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: 10, color: isGasto ? 'var(--danger)' : 'var(--success)', fontSize: 16, fontWeight: 700 }}>
                {isGasto ? '-$' : '+$'}
              </span>
              <input
                type="number"
                className="form-input"
                style={{ paddingLeft: 36, fontSize: 20, fontWeight: 700, color: isGasto ? 'var(--danger)' : 'var(--success)' }}
                value={montoStr}
                onChange={e => setMontoStr(e.target.value)}
                onBlur={() => {
                  if (!montoStr) {
                    setMontoStr('0.00')
                  } else {
                    const val = Number(montoStr)
                    if (!isNaN(val)) setMontoStr(val.toFixed(2))
                  }
                }}
                onFocus={(e) => {
                  if (e.target.value === '0.00' || e.target.value === '0') {
                    setMontoStr('')
                  }
                }}
                min={0}
                step={0.01}
                onKeyDown={e => e.key === 'Enter' && handleConfirm()}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Empleada (Opcional)</label>
            <select className="form-input" value={empleadaId} onChange={e => setEmpleadaId(e.target.value)}>
              <option value="">— Seleccionar —</option>
              {empleadas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button
            className={isGasto ? 'btn-danger' : 'btn-primary'}
            onClick={handleConfirm}
            disabled={isPending || !concepto.trim() || Number(montoStr) <= 0 || isNaN(Number(montoStr))}
          >
            {isPending ? 'Guardando...' : isGasto ? 'Registrar Gasto' : 'Registrar Ingreso'}
          </button>
        </div>
      </div>
    </div>
  )
}
