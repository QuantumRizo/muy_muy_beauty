import { useState, useEffect } from 'react'
import { RefreshCw, CheckCircle2, Shield, Users } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { UserProfile } from '../../context/AuthContext'

export default function SeguridadTab() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [profiles, setProfiles] = useState<UserProfile[]>([])
  const [loadingProfiles, setLoadingProfiles] = useState(true)

  useEffect(() => {
    fetchProfiles()
  }, [])

  const fetchProfiles = async () => {
    setLoadingProfiles(true)
    const { data, error } = await supabase
      .from('perfiles_usuario')
      .select('*')
      .order('nombre', { ascending: true })
    
    if (!error && data) {
      setProfiles(data)
    }
    setLoadingProfiles(false)
  }

  const handleRoleUpdate = async (userId: string, newRol: UserProfile['rol']) => {
    const { error } = await supabase
      .from('perfiles_usuario')
      .update({ rol: newRol })
      .eq('id', userId)

    if (error) {
      alert('Error al actualizar el rol')
    } else {
      setProfiles(prev => prev.map(p => p.id === userId ? { ...p, rol: newRol } : p))
    }
  }

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
    <div className="animate-in">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24 }}>
        
        {/* Cambio de Contraseña */}
        <div className="stats-card">
          <div style={{ padding: '10px 0 20px', textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', margin: '0 auto 12px' }}>
              <Shield size={24} />
            </div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)' }}>Acceso Personal</h2>
            <p style={{ fontSize: 12, color: 'var(--text-3)' }}>Actualiza tu clave de acceso.</p>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
            {success && <div style={{ background: 'var(--success-bg)', color: 'var(--success)', padding: '12px', borderRadius: 8, marginBottom: 16, fontSize: 12, display: 'flex', gap: 8 }}><CheckCircle2 size={16} /> ¡Actualizada!</div>}
            {error && <div style={{ background: 'var(--danger-bg)', color: 'var(--danger)', padding: '12px', borderRadius: 8, marginBottom: 16, fontSize: 12 }}>{error}</div>}

            <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="stats-section-label">Nueva contraseña</label>
                <input type="password" className="form-input" style={{ borderRadius: 10 }} value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="stats-section-label">Confirmar contraseña</label>
                <input type="password" className="form-input" style={{ borderRadius: 10 }} value={confirm} onChange={e => setConfirm(e.target.value)} required />
              </div>
              <button className="btn-primary" type="submit" disabled={loading} style={{ justifyContent: 'center', height: 40 }}>
                {loading ? <RefreshCw className="animate-spin" size={16} /> : 'Guardar nueva clave'}
              </button>
            </form>
          </div>
        </div>

        {/* Gestión de Roles */}
        <div className="stats-card">
          <div style={{ padding: '10px 0 20px', textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', margin: '0 auto 12px' }}>
              <Users size={24} />
            </div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)' }}>Roles y Permisos</h2>
            <p style={{ fontSize: 12, color: 'var(--text-3)' }}>Niveles de acceso del personal.</p>
          </div>

          {loadingProfiles ? <RefreshCw className="animate-spin" style={{ margin: '20px auto', display: 'block' }} /> : (
            <div style={{ maxHeight: 400, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={{ textAlign: 'left', padding: '8px', color: 'var(--text-3)' }}>Usuario</th>
                    <th style={{ textAlign: 'center', padding: '8px', color: 'var(--text-3)' }}>Rol</th>
                  </tr>
                </thead>
                <tbody>
                  {profiles.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 8px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-1)' }}>{p.nombre}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-3)' }}>{p.email}</div>
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <select value={p.rol} onChange={(e) => handleRoleUpdate(p.id, e.target.value as UserProfile['rol'])} style={{ padding: '4px 8px', borderRadius: 6, fontSize: 11, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                          <option value="empleado">Empleado</option>
                          <option value="admin">Admin</option>
                          <option value="superadmin">Superadmin</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
