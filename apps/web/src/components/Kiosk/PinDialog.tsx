import { useState, useEffect } from 'react'
import { X, Delete } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface PinDialogProps {
  empleadaId: string
  empleadaNombre: string
  accion: string // e.g. "Registrar Entrada", "Solicitar Vacaciones"
  onSuccess: () => void
  onCancel: () => void
}

export default function PinDialog({ empleadaId, empleadaNombre, accion, onSuccess, onCancel }: PinDialogProps) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)

  // Auto-verify when 4 digits entered
  useEffect(() => {
    if (pin.length === 4) {
      verify(pin)
    }
  }, [pin])

  // Reset pin on error
  useEffect(() => {
    if (error) setPin('')
  }, [error])

  const verify = async (enteredPin: string) => {
    setVerifying(true)
    setError(null)
    try {
      const { data, error: rpcError } = await supabase.rpc('verificar_pin_empleada', {
        p_empleada_id: empleadaId,
        p_pin: enteredPin,
      })
      if (rpcError) throw rpcError
      if (data === true) {
        onSuccess()
      } else {
        setError('PIN incorrecto. Intenta de nuevo.')
      }
    } catch (err) {
      console.error(err)
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setVerifying(false)
    }
  }

  const handleKey = (num: string) => {
    if (pin.length < 4 && !verifying) setPin(p => p + num)
  }

  const handleDelete = () => {
    if (!verifying) setPin(p => p.slice(0, -1))
  }

  const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9]

  return (
    /* Backdrop */
    <div
      onClick={onCancel}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'fade-in 0.15s ease-out',
      }}
    >
      {/* Card — stop propagation so clicking inside doesn't close */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#ffffff',
          border: '1px solid #E5E7EB',
          borderRadius: '24px',
          padding: '32px 28px',
          width: '100%',
          maxWidth: '340px',
          position: 'relative',
          boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
          animation: 'fade-in 0.2s ease-out',
        }}
      >
        {/* Close */}
        <button
          onClick={onCancel}
          style={{
            position: 'absolute', top: 16, right: 16,
            background: 'none', border: 'none',
            color: '#9CA3AF', cursor: 'pointer',
            padding: 8, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <X size={18} />
        </button>

        {/* Avatar */}
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: 'var(--accent)', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, fontWeight: 800,
          margin: '0 auto 12px',
          boxShadow: '0 4px 16px var(--accent)40',
        }}>
          {empleadaNombre.charAt(0)}
        </div>

        <h2 style={{ textAlign: 'center', margin: '0 0 4px', fontSize: 18, fontWeight: 700, color: '#111827' }}>
          {empleadaNombre}
        </h2>
        <p style={{ textAlign: 'center', margin: '0 0 24px', fontSize: 13, color: '#4B5563' }}>
          Ingresa tu PIN para <strong style={{ color: '#111827' }}>{accion}</strong>
        </p>

        {/* Dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 16 }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{
              width: 14, height: 14, borderRadius: '50%',
              background: i < pin.length ? 'var(--accent)' : '#E5E7EB',
              transition: 'all 0.15s',
              transform: i < pin.length ? 'scale(1.2)' : 'scale(1)',
            }} />
          ))}
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: '#FEE2E2', color: '#DC2626',
            borderRadius: 10, padding: '8px 14px',
            fontSize: 13, fontWeight: 600, textAlign: 'center',
            marginBottom: 16,
          }}>
            {error}
          </div>
        )}

        {/* Keypad */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {digits.map(num => (
            <button
              key={num}
              onClick={() => handleKey(num.toString())}
              disabled={verifying}
              style={{
                height: 56, borderRadius: 14,
                background: '#F9FAFB',
                border: '1px solid #E5E7EB',
                color: '#111827', fontSize: 20, fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.1s',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
              onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.93)')}
              onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
            >
              {num}
            </button>
          ))}
          {/* Empty */}
          <div />
          {/* 0 */}
          <button
            onClick={() => handleKey('0')}
            disabled={verifying}
            style={{
              height: 56, borderRadius: 14,
              background: '#F9FAFB',
              border: '1px solid #E5E7EB',
              color: '#111827', fontSize: 20, fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.1s',
            }}
            onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.93)')}
            onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            0
          </button>
          {/* Backspace */}
          <button
            onClick={handleDelete}
            disabled={verifying}
            style={{
              height: 56, borderRadius: 14,
              background: '#F9FAFB',
              border: '1px solid #E5E7EB',
              color: '#4B5563',
              cursor: 'pointer', transition: 'all 0.1s',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.93)')}
            onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <Delete size={20} />
          </button>
        </div>

        {/* Loading overlay */}
        {verifying && (
          <div style={{
            position: 'absolute', inset: 0, borderRadius: 24,
            background: 'rgba(255,255,255,0.8)',
            backdropFilter: 'blur(2px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              border: '3px solid #E5E7EB',
              borderTopColor: 'var(--accent)',
              animation: 'spin 0.7s linear infinite',
            }} />
          </div>
        )}
      </div>
    </div>
  )
}
