import { useState } from 'react'
import { Lock, Save } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useToast } from '../components/Common/Toast'
import { useTodasEmpleadas } from '../hooks/useEmpleadas'

export default function MiCuentaPage() {
  const toast = useToast()
  const { data: empleadas = [] } = useTodasEmpleadas()
  
  const [selectedEmpleadaId, setSelectedEmpleadaId] = useState<string>('')
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [loading, setLoading] = useState(false)

  // Autoseleccionar la empleada actual si coincide el ID, de lo contrario vacío
  // (O simplemente iniciar vacío)

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
    
    if (!selectedEmpleadaId) {
      toast('Selecciona a una empleada.', 'error')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.rpc('asignar_pin_empleada', {
        p_empleada_id: selectedEmpleadaId,
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
        {/* Información General */}
        <div className="card" style={{ flex: '1 1 300px', padding: '24px', background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 16px', color: 'var(--text-1)' }}>Gestión de Acceso</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.6, marginBottom: '20px' }}>
            En esta sección puedes asignar o restablecer el PIN de acceso al Quiosco para ti o para cualquier otra empleada del sistema.
          </p>
          <div style={{ padding: '12px', background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
            <p style={{ fontSize: '12px', color: 'var(--text-2)', margin: 0 }}>
              <strong>Nota de seguridad:</strong> Asegúrate de comunicar el nuevo PIN de forma segura. El código debe contener exactamente 4 dígitos numéricos.
            </p>
          </div>
        </div>

        {/* Cambiar PIN */}
        <div className="card" style={{ flex: '2 1 400px', padding: '24px', background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-[var(--text-1)]" style={{ fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--text-1)' }}>
            <Lock size={20} style={{ color: 'var(--accent)' }} />
            Cambiar PIN de Acceso
          </h2>
          
          <p className="text-sm text-[var(--text-3)] mb-6" style={{ fontSize: '13px', color: 'var(--text-2)', marginBottom: '24px' }}>
            Selecciona a la empleada, ingresa el nuevo PIN y confírmalo para guardar los cambios.
          </p>
          
          <form onSubmit={handleSavePin} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '300px' }}>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-2)' }}>
                Seleccionar Empleada
              </label>
              <select 
                value={selectedEmpleadaId}
                onChange={(e) => setSelectedEmpleadaId(e.target.value)}
                className="form-input"
                style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-2)', fontSize: '14px', cursor: 'pointer' }}
                required
              >
                <option value="">-- Elige una empleada --</option>
                {empleadas.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.nombre}</option>
                ))}
              </select>
            </div>

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
              disabled={loading || pin.length !== 4 || confirmPin.length !== 4 || !selectedEmpleadaId}
              className="btn-primary"
              style={{ padding: '12px', marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'var(--accent)', color: '#fff', borderRadius: 'var(--radius-sm)', border: 'none', fontWeight: 600, cursor: (loading || pin.length !== 4 || confirmPin.length !== 4 || !selectedEmpleadaId) ? 'not-allowed' : 'pointer', opacity: (loading || pin.length !== 4 || confirmPin.length !== 4 || !selectedEmpleadaId) ? 0.6 : 1 }}
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
