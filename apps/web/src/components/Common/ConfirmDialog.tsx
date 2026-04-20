
interface Props {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  isDanger?: boolean
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  isDanger = false
}: Props) {
  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onCancel} style={{ zIndex: 9999 }}>
      <div 
        className="modal-box" 
        style={{ maxWidth: 400, padding: 0, overflow: 'hidden' }} 
        onClick={e => e.stopPropagation()}
      >
        <div style={{ padding: '24px 24px 16px', textAlign: 'center' }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: 'var(--text-1)' }}>
            {title}
          </h3>
          <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.5 }}>
            {message}
          </p>
        </div>
        
        <div style={{ 
          display: 'flex', 
          borderTop: '1px solid var(--border)',
          backgroundColor: 'var(--surface-2)' 
        }}>
          <button 
            style={{ 
              flex: 1, 
              padding: '16px', 
              background: 'transparent',
              border: 'none',
              borderRight: '1px solid var(--border)',
              fontSize: 15,
              fontWeight: 500,
              color: 'var(--text-2)',
              cursor: 'pointer'
            }} 
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button 
            style={{ 
              flex: 1, 
              padding: '16px', 
              background: 'transparent',
              border: 'none',
              fontSize: 15,
              fontWeight: 600,
              color: isDanger ? 'var(--danger)' : 'var(--accent)',
              cursor: 'pointer'
            }} 
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
