interface Props {
  label: string
  subtitle?: string
  value: string | number
  onValueChange: (v: string) => void
  /** If set, value input will be styled as a negative/danger number */
  isDanger?: boolean
  max?: number
  onConfirm: () => void
  onClose: () => void
}

export default function AjusteImporte({ label, subtitle, value, onValueChange, isDanger, max, onConfirm, onClose }: Props) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 340 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{label}</h3>
        </div>
        <div className="modal-body p-5">
          {subtitle && (
            <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 12 }}>{subtitle}</p>
          )}
          <div style={{ position: 'relative' }}>
            <span style={{
              position: 'absolute', left: 13, top: 12,
              color: isDanger ? 'var(--danger)' : 'var(--text-3)',
              fontSize: 18, fontWeight: 700
            }}>
              {isDanger ? '-$' : '$'}
            </span>
            <input
              type="number"
              className="form-input"
              style={{
                paddingLeft: isDanger ? 36 : 28,
                fontSize: 24, fontWeight: 800, textAlign: 'right',
                color: isDanger ? 'var(--danger)' : 'var(--text-1)'
              }}
              value={value}
              onChange={e => onValueChange(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && onConfirm()}
              autoFocus
              min={0}
              max={max}
              step={10}
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button
            className={isDanger ? 'btn-danger' : 'btn-primary'}
            onClick={onConfirm}
          >
            Aplicar
          </button>
        </div>
      </div>
    </div>
  )
}
