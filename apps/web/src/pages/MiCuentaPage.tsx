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
    <div className="page-container fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Mi Cuenta</h1>
          <p className="page-subtitle">Ajustes y configuración de tu perfil</p>
        </div>
      </div>

      <div className="card max-w-md">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-[var(--text-1)]">
          <Lock size={20} className="text-[var(--accent)]" />
          Cambiar PIN de Acceso
        </h2>
        
        <p className="text-sm text-[var(--text-3)] mb-6">
          Este PIN de 4 dígitos te permite registrar entrada de forma rápida en el Quiosco.
        </p>
        
        <form onSubmit={handleSavePin} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[var(--text-2)] mb-1">
              Nuevo PIN (4 dígitos)
            </label>
            <input 
              type="password" 
              maxLength={4}
              pattern="\d{4}"
              required
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              className="input-field w-full text-center tracking-[0.5em] text-lg font-bold"
              placeholder="••••"
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-[var(--text-2)] mb-1">
              Confirmar Nuevo PIN
            </label>
            <input 
              type="password" 
              maxLength={4}
              pattern="\d{4}"
              required
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
              className="input-field w-full text-center tracking-[0.5em] text-lg font-bold"
              placeholder="••••"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading || pin.length !== 4 || confirmPin.length !== 4}
            className="btn-primary w-full mt-4 justify-center"
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
  )
}
