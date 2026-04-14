import { useState } from 'react'
import { Lock, RefreshCw, CheckCircle2, AlertCircle, Shield } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function SeguridadPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError('Error al actualizar la contraseña.')
    } else {
      setSuccess(true)
      setPassword('')
      setConfirm('')
    }
    setLoading(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div className="page-header" style={{ padding: '24px 24px 0', marginBottom: 24 }}>
        <div className="page-header-content">
          <h1 className="page-title">Seguridad</h1>
          <p className="page-subtitle">Gestiona tu acceso y mantén tu cuenta segura.</p>
        </div>
      </div>

      <div className="page-content" style={{ padding: '0 24px 24px', display: 'flex', justifyContent: 'center' }}>
        <div className="stats-card" style={{ maxWidth: 460, width: '100%', margin: '0' }}>
          <div style={{ padding: '10px 0 20px', textAlign: 'center' }}>
            <div style={{ 
              width: 56, height: 56, borderRadius: 16, background: 'var(--accent-light)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              color: 'var(--accent)', margin: '0 auto 16px' 
            }}>
              <Shield size={28} />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-1)', marginBottom: 4 }}>Cambiar Contraseña</h2>
            <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Actualiza tu clave periódicamente para mayor protección.</p>
          </div>

          <div className="filter-divider" style={{ margin: '0 0 24px' }}></div>

          {success && (
            <div style={{ 
              background: 'var(--success-bg)', color: 'var(--success)', 
              padding: '16px', borderRadius: 12, marginBottom: 24, fontSize: 13,
              display: 'flex', alignItems: 'center', gap: 12
            }}>
              <CheckCircle2 size={20} />
              <div>
                <strong>¡Contraseña actualizada!</strong><br/>
                Tu nueva clave se ha guardado correctamente.
              </div>
            </div>
          )}

          {error && (
            <div style={{ 
              background: 'var(--danger-bg)', color: 'var(--danger)', 
              padding: '16px', borderRadius: 12, marginBottom: 24, fontSize: 13,
              display: 'flex', alignItems: 'center', gap: 12
            }}>
              <AlertCircle size={20} />
              {error}
            </div>
          )}

          <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="form-group">
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 8, display: 'block' }}>Nueva contraseña</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Lock size={18} style={{ position: 'absolute', left: 14, color: 'var(--text-3)' }} />
                <input 
                  type="password" 
                  className="form-input" 
                  style={{ padding: '12px 14px 12px 42px', fontSize: 14, borderRadius: 12 }}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 8, display: 'block' }}>Confirmar nueva contraseña</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Lock size={18} style={{ position: 'absolute', left: 14, color: 'var(--text-3)' }} />
                <input 
                  type="password" 
                  className="form-input" 
                  style={{ padding: '12px 14px 12px 42px', fontSize: 14, borderRadius: 12 }}
                  placeholder="••••••••"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required
                />
              </div>
            </div>

            <button 
              className="btn-primary" 
              type="submit" 
              disabled={loading} 
              style={{ 
                justifyContent: 'center', padding: '14px', borderRadius: 12, 
                fontSize: 15, fontWeight: 600, marginTop: 10,
                boxShadow: '0 4px 12px var(--accent-mid)'
              }}
            >
              {loading ? <RefreshCw size={20} className="animate-spin" /> : 'Actualizar contraseña'}
            </button>
          </form>

          <div style={{ marginTop: 32, padding: '16px', background: 'var(--surface-2)', borderRadius: 12, fontSize: 12, color: 'var(--text-3)', textAlign: 'center' }}>
            <AlertCircle size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4, marginBottom: 2 }} />
            Una vez actualizada, deberás usar la nueva clave la próxima vez que inicies sesión.
          </div>
        </div>
      </div>
    </div>
  )
}
