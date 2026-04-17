import { useState, useEffect } from 'react'
import { Lock, RefreshCw, CheckCircle2, AlertCircle, Shield, Users } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { UserProfile } from '../context/AuthContext'

export default function SeguridadPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Gestión de usuarios
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div className="page-header" style={{ padding: '24px 24px 0', marginBottom: 24 }}>
        <div className="page-header-content">
          <h1 className="page-title">Seguridad</h1>
          <p className="page-subtitle">Gestiona accesos y roles de usuario.</p>
        </div>
      </div>

      <div className="page-content" style={{ padding: '0 24px 24px', overflowY: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24, paddingBottom: 24 }}>
          
          {/* Columna Izquierda: Cambio de Contraseña */}
          <div className="stats-card" style={{ height: 'fit-content' }}>
            <div style={{ padding: '10px 0 20px', textAlign: 'center' }}>
              <div style={{ 
                width: 56, height: 56, borderRadius: 16, background: 'var(--accent-light)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                color: 'var(--accent)', margin: '0 auto 16px' 
              }}>
                <Shield size={28} />
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-1)', marginBottom: 4 }}>Mi Contraseña</h2>
              <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Actualiza tu clave de acceso personal.</p>
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
          </div>

          {/* Columna Derecha: Gestión de Usuarios */}
          <div className="stats-card" style={{ height: 'fit-content' }}>
            <div style={{ padding: '10px 0 20px', textAlign: 'center' }}>
              <div style={{ 
                width: 56, height: 56, borderRadius: 16, background: 'var(--accent-light)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                color: 'var(--accent)', margin: '0 auto 16px' 
              }}>
                <Users size={28} />
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-1)', marginBottom: 4 }}>Perfiles de Usuario</h2>
              <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Gestiona los roles y permisos del personal.</p>
            </div>

            <div className="filter-divider" style={{ margin: '0 0 12px' }}></div>

            {loadingProfiles ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <RefreshCw size={24} className="animate-spin" style={{ color: 'var(--accent)', margin: '0 auto' }} />
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      <th style={{ textAlign: 'left', padding: '12px 8px', color: 'var(--text-3)', fontWeight: 600 }}>Nombre / Email</th>
                      <th style={{ textAlign: 'center', padding: '12px 8px', color: 'var(--text-3)', fontWeight: 600 }}>Rol</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profiles.map(p => (
                      <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '12px 8px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-1)' }}>{p.nombre}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{p.email}</div>
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                          <select 
                            value={p.rol}
                            onChange={(e) => handleRoleUpdate(p.id, e.target.value as UserProfile['rol'])}
                            style={{
                              padding: '4px 8px',
                              borderRadius: 6,
                              fontSize: 12,
                              background: p.rol === 'admin' ? 'var(--accent-light)' : 'var(--surface-2)',
                              color: p.rol === 'admin' ? 'var(--accent)' : 'var(--text-2)',
                              border: '1px solid var(--border)',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            <option value="admin">Admin</option>
                            <option value="empleado">Empleado</option>
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
    </div>
  )
}
