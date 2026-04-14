import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastItem {
  id: number
  message: string
  type: ToastType
}

type ToastFn = (message: string, type?: ToastType) => void

const ToastContext = createContext<ToastFn | null>(null)

const CONFIG: Record<ToastType, { icon: typeof CheckCircle; bg: string; border: string; iconColor: string }> = {
  success: { icon: CheckCircle,    bg: 'var(--surface)',   border: 'var(--success)',  iconColor: 'var(--success)' },
  error:   { icon: XCircle,        bg: 'var(--surface)',   border: 'var(--danger)',   iconColor: 'var(--danger)'  },
  warning: { icon: AlertTriangle,  bg: 'var(--surface)',   border: '#cda434',         iconColor: '#cda434'        },
  info:    { icon: Info,           bg: 'var(--surface)',   border: 'var(--accent)',   iconColor: 'var(--accent)'  },
}

function ToastItem({ item, onRemove }: { item: ToastItem; onRemove: () => void }) {
  const cfg = CONFIG[item.type]
  const Icon = cfg.icon

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        borderLeft: `4px solid ${cfg.border}`,
        borderRadius: 10,
        padding: '12px 14px',
        minWidth: 280,
        maxWidth: 380,
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        animation: 'toast-in 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        position: 'relative',
      }}
    >
      <Icon size={18} color={cfg.iconColor} style={{ flexShrink: 0, marginTop: 1 }} />
      <span style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--text-1)', flex: 1, paddingRight: 6 }}>
        {item.message}
      </span>
      <button
        onClick={onRemove}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 2,
          color: 'var(--text-3)',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <X size={14} />
      </button>
    </div>
  )
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const counterRef = useRef(0)

  const toast = useCallback<ToastFn>((message, type = 'info') => {
    const id = ++counterRef.current
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 4500)
  }, [])

  const remove = (id: number) => setToasts(prev => prev.filter(t => t.id !== id))

  return (
    <ToastContext.Provider value={toast}>
      <style>{`
        @keyframes toast-in {
          from { transform: translateX(110%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
      {children}
      <div
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          pointerEvents: 'none',
        }}
      >
        {toasts.map(t => (
          <div key={t.id} style={{ pointerEvents: 'auto' }}>
            <ToastItem item={t} onRemove={() => remove(t.id)} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastFn {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>')
  return ctx
}
