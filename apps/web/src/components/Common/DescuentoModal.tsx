import { useState } from 'react'
import { Percent, DollarSign } from 'lucide-react'

interface Props {
  subtotal: number
  currentDescuento: number
  onConfirm: (montoDescuento: number) => void
  onClose: () => void
}

const PORCENTAJES_RAPIDOS = [5, 10, 12, 15, 20]

export default function DescuentoModal({ subtotal, currentDescuento, onConfirm, onClose }: Props) {
  const [tab, setTab] = useState<'pct' | 'mxn'>('pct')

  // Porcentaje tab
  const initialPct = currentDescuento > 0 ? Math.round((currentDescuento / subtotal) * 100) : 0
  const [pctInput, setPctInput] = useState(initialPct > 0 ? String(initialPct) : '')

  // Monto tab
  const [mxnInput, setMxnInput] = useState(currentDescuento > 0 ? String(currentDescuento) : '')

  const pctValue = Math.min(100, Math.max(0, parseFloat(pctInput) || 0))
  const mxnValue = parseFloat(mxnInput) || 0

  const montoDesdePorc = Math.min((pctValue / 100) * subtotal, subtotal)
  const montoDesdeFixed = Math.min(mxnValue, subtotal)

  const montoFinal = tab === 'pct' ? montoDesdePorc : montoDesdeFixed

  const handleConfirm = () => {
    if (montoFinal < 0 || montoFinal > subtotal) return
    onConfirm(montoFinal)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleConfirm()
    if (e.key === 'Escape') onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 360 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Aplicar Descuento</h3>
        </div>

        <div className="modal-body p-5">
          {/* Tabs */}
          <div style={{
            display: 'flex',
            background: 'var(--surface-2)',
            borderRadius: 10,
            padding: 4,
            marginBottom: 20,
            gap: 4
          }}>
            <button
              onClick={() => setTab('pct')}
              style={{
                flex: 1,
                padding: '8px 0',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                background: tab === 'pct' ? 'var(--danger)' : 'transparent',
                color: tab === 'pct' ? '#fff' : 'var(--text-3)',
                transition: 'all 0.15s ease'
              }}
            >
              <Percent size={14} /> Porcentaje
            </button>
            <button
              onClick={() => setTab('mxn')}
              style={{
                flex: 1,
                padding: '8px 0',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                background: tab === 'mxn' ? 'var(--danger)' : 'transparent',
                color: tab === 'mxn' ? '#fff' : 'var(--text-3)',
                transition: 'all 0.15s ease'
              }}
            >
              <DollarSign size={14} /> Monto fijo
            </button>
          </div>

          {/* ─── TAB PORCENTAJE ─── */}
          {tab === 'pct' && (
            <div>
              {/* Input manual libre */}
              <div style={{ position: 'relative', marginBottom: 12 }}>
                <input
                  type="number"
                  className="form-input"
                  style={{
                    paddingRight: 42,
                    fontSize: 28,
                    fontWeight: 800,
                    textAlign: 'right',
                    color: 'var(--danger)'
                  }}
                  placeholder="0"
                  value={pctInput}
                  onChange={e => setPctInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoFocus
                  min={0}
                  max={100}
                  step="any"
                />
                <span style={{
                  position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--danger)', fontSize: 22, fontWeight: 800, pointerEvents: 'none'
                }}>%</span>
              </div>

              {/* Botones rápidos / atajos sugeridos */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                {PORCENTAJES_RAPIDOS.map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPctInput(String(p))}
                    style={{
                      flex: 1,
                      minWidth: 44,
                      padding: '6px 4px',
                      borderRadius: 8,
                      border: '1px solid',
                      borderColor: pctInput === String(p) ? 'var(--danger)' : 'var(--border)',
                      background: pctInput === String(p) ? 'var(--danger-bg)' : 'var(--surface-2)',
                      color: pctInput === String(p) ? 'var(--danger)' : 'var(--text-2)',
                      fontWeight: 700,
                      fontSize: 12,
                      cursor: 'pointer',
                      transition: 'all 0.12s ease'
                    }}
                  >
                    {p}%
                  </button>
                ))}
              </div>

              {/* Preview */}
              {pctValue > 0 && (
                <div style={{
                  marginTop: 14,
                  padding: '12px 16px',
                  background: 'var(--danger-bg)',
                  borderRadius: 10,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 600 }}>
                    {pctValue}% de ${subtotal.toFixed(2)}
                  </span>
                  <span style={{ fontSize: 20, fontWeight: 900, color: 'var(--danger)' }}>
                    -${montoDesdePorc.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ─── TAB MONTO FIJO ─── */}
          {tab === 'mxn' && (
            <div>
              <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 12 }}>
                Monto a descontar (MXN) — Máximo: ${subtotal.toFixed(2)}
              </p>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--danger)', fontSize: 20, fontWeight: 800, pointerEvents: 'none'
                }}>-$</span>
                <input
                  type="number"
                  className="form-input"
                  style={{
                    paddingLeft: 40,
                    fontSize: 28,
                    fontWeight: 800,
                    textAlign: 'right',
                    color: 'var(--danger)'
                  }}
                  placeholder="0"
                  value={mxnInput}
                  onChange={e => setMxnInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoFocus
                  min={0}
                  max={subtotal}
                  step={10}
                />
              </div>

              {mxnValue > 0 && (
                <div style={{
                  marginTop: 14,
                  padding: '12px 16px',
                  background: 'var(--danger-bg)',
                  borderRadius: 10,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 600 }}>Total después:</span>
                  <span style={{ fontSize: 20, fontWeight: 900, color: 'var(--danger)' }}>
                    ${(subtotal - montoDesdeFixed).toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button
            className="btn-danger"
            onClick={handleConfirm}
            disabled={montoFinal <= 0 || montoFinal > subtotal}
          >
            Aplicar -{montoFinal > 0 ? `$${montoFinal.toFixed(2)}` : ''}
          </button>
        </div>
      </div>
    </div>
  )
}
