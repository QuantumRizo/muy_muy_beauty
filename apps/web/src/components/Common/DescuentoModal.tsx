import { useState, useEffect } from 'react'

interface Props {
  subtotal: number
  currentDescuento: number
  onConfirm: (montoDescuento: number) => void
  onClose: () => void
}

const PORCENTAJES_RAPIDOS = [5, 10, 12, 15, 20]

export default function DescuentoModal({ subtotal, currentDescuento, onConfirm, onClose }: Props) {
  // Input states
  const [pctInput, setPctInput] = useState('')
  const [mxnInput, setMxnInput] = useState('')
  const [lastEdited, setLastEdited] = useState<'pct' | 'mxn'>('pct')

  // Initialize
  useEffect(() => {
    if (currentDescuento > 0 && subtotal > 0) {
      setMxnInput(String(currentDescuento))
      const pct = (currentDescuento / subtotal) * 100
      setPctInput(String(Number(pct.toFixed(2))))
      setLastEdited('mxn')
    }
  }, [currentDescuento, subtotal])

  // Calculate values
  const rawPct = parseFloat(pctInput) || 0
  const rawMxn = parseFloat(mxnInput) || 0

  const montoDescuento = lastEdited === 'pct'
    ? Math.min((rawPct / 100) * subtotal, subtotal)
    : Math.min(rawMxn, subtotal)

  const pctEquivalente = subtotal > 0 ? (montoDescuento / subtotal) * 100 : 0
  const totalConDescuento = Math.max(0, subtotal - montoDescuento)

  // Handlers for 2-way synchronization
  const handlePctChange = (val: string) => {
    setLastEdited('pct')
    setPctInput(val)
    const p = parseFloat(val)
    if (!isNaN(p) && subtotal > 0) {
      const calcMxn = (p / 100) * subtotal
      setMxnInput(calcMxn > 0 ? String(Number(calcMxn.toFixed(2))) : '')
    } else {
      setMxnInput('')
    }
  }

  const handleMxnChange = (val: string) => {
    setLastEdited('mxn')
    setMxnInput(val)
    const m = parseFloat(val)
    if (!isNaN(m) && subtotal > 0) {
      const calcPct = (m / subtotal) * 100
      setPctInput(calcPct > 0 ? String(Number(calcPct.toFixed(2))) : '')
    } else {
      setPctInput('')
    }
  }

  const handleQuickPct = (p: number) => {
    handlePctChange(String(p))
  }

  const handleConfirm = () => {
    if (montoDescuento < 0 || montoDescuento > subtotal) return
    onConfirm(montoDescuento)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleConfirm()
    if (e.key === 'Escape') onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Aplicar Descuento</h3>
        </div>

        <div className="modal-body p-5">
          {/* Botones rápidos % */}
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 6, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Atajos rápidos (%)
            </p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {PORCENTAJES_RAPIDOS.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handleQuickPct(p)}
                  style={{
                    flex: 1,
                    minWidth: 44,
                    padding: '8px 4px',
                    borderRadius: 8,
                    border: '1px solid',
                    borderColor: pctInput === String(p) ? 'var(--danger)' : 'var(--border)',
                    background: pctInput === String(p) ? 'var(--danger-bg)' : 'var(--surface-2)',
                    color: pctInput === String(p) ? 'var(--danger)' : 'var(--text-2)',
                    fontWeight: 800,
                    fontSize: 13,
                    cursor: 'pointer',
                    transition: 'all 0.12s ease'
                  }}
                >
                  {p}%
                </button>
              ))}
            </div>
          </div>

          {/* Dos campos sincronizados en paralelo */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            {/* Campo % */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-2)', marginBottom: 6 }}>
                Porcentaje (%)
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  className="form-input"
                  style={{
                    paddingRight: 32,
                    fontSize: 20,
                    fontWeight: 800,
                    textAlign: 'right',
                    color: lastEdited === 'pct' ? 'var(--danger)' : 'var(--text-1)'
                  }}
                  placeholder="0"
                  value={pctInput}
                  onChange={e => handlePctChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoFocus
                  min={0}
                  max={100}
                  step="any"
                />
                <span style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--text-3)', fontSize: 16, fontWeight: 700, pointerEvents: 'none'
                }}>%</span>
              </div>
            </div>

            {/* Campo $ MXN */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-2)', marginBottom: 6 }}>
                Monto ($ MXN)
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--text-3)', fontSize: 16, fontWeight: 700, pointerEvents: 'none'
                }}>$</span>
                <input
                  type="number"
                  className="form-input"
                  style={{
                    paddingLeft: 24,
                    fontSize: 20,
                    fontWeight: 800,
                    textAlign: 'right',
                    color: lastEdited === 'mxn' ? 'var(--danger)' : 'var(--text-1)'
                  }}
                  placeholder="0.00"
                  value={mxnInput}
                  onChange={e => handleMxnChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  min={0}
                  max={subtotal}
                  step="any"
                />
              </div>
            </div>
          </div>

          {/* Resumen dinámico del resultado */}
          <div style={{
            padding: '14px 16px',
            background: 'var(--surface-2)',
            borderRadius: 12,
            border: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            gap: 6
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-3)' }}>
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            {montoDescuento > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--danger)', fontWeight: 700 }}>
                <span>Descuento ({pctEquivalente.toFixed(1)}%):</span>
                <span>-${montoDescuento.toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 900, color: 'var(--text-1)', borderTop: '1px solid var(--border)', paddingTop: 6, marginTop: 2 }}>
              <span>Total final:</span>
              <span>${totalConDescuento.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button
            className="btn-danger"
            onClick={handleConfirm}
            disabled={montoDescuento <= 0 || montoDescuento > subtotal}
          >
            Aplicar -{montoDescuento > 0 ? `$${montoDescuento.toFixed(2)}` : ''}
          </button>
        </div>
      </div>
    </div>
  )
}
