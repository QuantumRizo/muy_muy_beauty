import { useState } from 'react'
import { Lock, Save } from 'lucide-react'
import { useAuthContext } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { useToast } from '../components/Common/Toast'

export default function MiCuentaPage() {
  const { profile } = useAuthContext()
  const toast = useToast()
  
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (pin.length !== 4 || confirmPin.length !== 4) {
      toast('El PIN debe tener 4 dígitos.', 'error')
      return
    }
    
    if (pin !== confirmPin) {
      toast('Los PINs no coinciden.', 'error')
      return
    }
    
    if (!profile?.id) return

    setLoading(true)
    try {
      const { error } = await supabase.rpc('asignar_pin_empleada', {
        p_empleada_id: profile.id,
        p_pin: pin
      })

      if (error) throw error
      
      toast('PIN actualizado correctamente.', 'success')
      setPin('')
      setConfirmPin('')
    } catch (err) {
      console.error(err)
      toast('Error al actualizar el PIN.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-container fade-in" style={{ padding: '24px' }}>
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">Mi Cuenta</h1>
          <p className="page-subtitle">Ajustes y configuración de tu perfil</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* Info del Perfil */}
        <div className="card" style={{ flex: '1 1 300px', padding: '24px', background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold' }}>
              {profile?.nombre?.charAt(0) || '?'}
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-1)', margin: 0 }}>{profile?.nombre}</h2>
              <p style={{ fontSize: '13px', color: 'var(--text-3)', margin: 0 }}>{profile?.email}</p>
            </div>
          </div>
          
          <div style={{ fontSize: '12px', color: 'var(--text-2)', padding: '12px', background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)' }}>
            <p style={{ margin: '0 0 4px' }}><strong>Rol:</strong> {profile?.rol ? profile.rol.charAt(0).toUpperCase() + profile.rol.slice(1) : ''}</p>
            <p style={{ margin: 0 }}><strong>ID:</strong> {profile?.id ? profile.id.split('-')[0] + '...' : ''}</p>
          </div>
        </div>

        {/* Cambiar PIN */}
        <div className="card" style={{ flex: '2 1 400px', padding: '24px', background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-[var(--text-1)]" style={{ fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--text-1)' }}>
            <Lock size={20} style={{ color: 'var(--accent)' }} />
            Cambiar PIN de Acceso
          </h2>
          
          <p className="text-sm text-[var(--text-3)] mb-6" style={{ fontSize: '13px', color: 'var(--text-2)', marginBottom: '24px' }}>
            Este PIN de 4 dígitos te permite registrar entrada de forma rápida en el Quiosco. Ingresa tu nuevo PIN y confírmalo para guardar los cambios.
          </p>
          
          <form onSubmit={handleSavePin} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '300px' }}>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-2)' }}>
                Nuevo PIN (4 dígitos)
              </label>
              <input 
                type="password" 
                maxLength={4}
                pattern="\d{4}"
                required
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                className="form-input"
                style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-2)', fontSize: '20px', letterSpacing: '0.3em', textAlign: 'center', fontWeight: 'bold' }}
                placeholder="••••"
              />
            </div>
            
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-2)' }}>
                Confirmar Nuevo PIN
              </label>
              <input 
                type="password" 
                maxLength={4}
                pattern="\d{4}"
                required
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                className="form-input"
                style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-2)', fontSize: '20px', letterSpacing: '0.3em', textAlign: 'center', fontWeight: 'bold' }}
                placeholder="••••"
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading || pin.length !== 4 || confirmPin.length !== 4}
              className="btn-primary"
              style={{ padding: '12px', marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'var(--accent)', color: '#fff', borderRadius: 'var(--radius-sm)', border: 'none', fontWeight: 600, cursor: (loading || pin.length !== 4 || confirmPin.length !== 4) ? 'not-allowed' : 'pointer', opacity: (loading || pin.length !== 4 || confirmPin.length !== 4) ? 0.6 : 1 }}
            >
              {loading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : (
                <>
                  <Save size={18} />
                  Guardar Nuevo PIN
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
