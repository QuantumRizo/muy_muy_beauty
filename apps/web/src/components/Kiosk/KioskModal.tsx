import { useState, useEffect } from 'react'
import { X, Users } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useEmpleadas } from '../../hooks/useEmpleadas'
import { useSucursalContext } from '../../context/SucursalContext'
import PinPad from './PinPad'
import EmployeePortal from './EmployeePortal'

interface KioskModalProps {
  isOpen: boolean
  onClose: () => void
}

type KioskStep = 'SELECT_EMPLOYEE' | 'ENTER_PIN' | 'PORTAL'

export default function KioskModal({ isOpen, onClose }: KioskModalProps) {
  const { selectedSucursalId } = useSucursalContext()
  const { data: empleadas = [], isLoading: loadingEmpleadas } = useEmpleadas(selectedSucursalId || undefined)
  
  const [step, setStep] = useState<KioskStep>('SELECT_EMPLOYEE')
  const [selectedEmpleada, setSelectedEmpleada] = useState<{id: string, nombre: string} | null>(null)
  
  const [verifying, setVerifying] = useState(false)
  const [pinError, setPinError] = useState<string | null>(null)

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep('SELECT_EMPLOYEE')
      setSelectedEmpleada(null)
      setPinError(null)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSelectEmpleada = (empleada: {id: string, nombre: string}) => {
    setSelectedEmpleada(empleada)
    setStep('ENTER_PIN')
    setPinError(null)
  }

  const handlePinComplete = async (pin: string) => {
    if (!selectedEmpleada) return

    setVerifying(true)
    setPinError(null)

    try {
      const { data, error } = await supabase.rpc('verificar_pin_empleada', {
        p_empleada_id: selectedEmpleada.id,
        p_pin: pin
      })

      if (error) throw error

      if (data === true) {
        setStep('PORTAL')
      } else {
        setPinError('PIN incorrecto. Intenta de nuevo.')
      }
    } catch (err) {
      console.error(err)
      setPinError('Error de conexión. Intenta de nuevo.')
    } finally {
      setVerifying(false)
    }
  }

  const handleBackToSelect = () => {
    setStep('SELECT_EMPLOYEE')
    setSelectedEmpleada(null)
    setPinError(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[var(--bg)]/95 backdrop-blur-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-[var(--border)] bg-[var(--surface-1)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center">
            <Users size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--text-1)] m-0">Portal de Personal</h1>
            <p className="text-xs text-[var(--text-3)] m-0">Modo Quiosco</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-3 text-[var(--text-2)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 rounded-xl transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-y-auto">
        
        {step === 'SELECT_EMPLOYEE' && (
          <div className="w-full max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-[var(--text-1)] mb-8">¿Quién eres?</h2>
            
            {loadingEmpleadas ? (
              <div className="flex justify-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)]"></div>
              </div>
            ) : empleadas.length === 0 ? (
              <div className="text-center text-[var(--text-3)] p-12 bg-[var(--surface-1)] rounded-2xl border border-[var(--border)]">
                No hay personal activo registrado en esta sucursal.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {empleadas.map(empleada => (
                  <button
                    key={empleada.id}
                    onClick={() => handleSelectEmpleada({id: empleada.id, nombre: empleada.nombre})}
                    className="flex flex-col items-center p-6 bg-[var(--surface-1)] hover:bg-[var(--surface-2)] active:scale-95 border border-[var(--border)] hover:border-[var(--accent)] rounded-2xl transition-all shadow-sm hover:shadow-md group"
                  >
                    <div className="w-20 h-20 rounded-full bg-[var(--surface-3)] text-[var(--text-2)] group-hover:bg-[var(--accent)] group-hover:text-white flex items-center justify-center text-3xl font-bold mb-4 transition-colors">
                      {empleada.nombre.charAt(0)}
                    </div>
                    <span className="text-sm font-bold text-[var(--text-1)] text-center line-clamp-2">
                      {empleada.nombre}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 'ENTER_PIN' && selectedEmpleada && (
          <div className="w-full animate-in slide-in-from-bottom-8 fade-in duration-300">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-[var(--accent)] text-white flex items-center justify-center text-2xl font-bold mx-auto mb-3 shadow-lg shadow-[var(--accent)]/20">
                {selectedEmpleada.nombre.charAt(0)}
              </div>
              <h2 className="text-xl font-bold text-[var(--text-1)]">{selectedEmpleada.nombre}</h2>
            </div>
            
            <PinPad 
              onPinComplete={handlePinComplete}
              onCancel={handleBackToSelect}
              error={pinError}
              isLoading={verifying}
            />
          </div>
        )}

        {step === 'PORTAL' && selectedEmpleada && selectedSucursalId && (
          <div className="w-full animate-in zoom-in-95 fade-in duration-300">
            <EmployeePortal 
              empleadaId={selectedEmpleada.id}
              empleadaNombre={selectedEmpleada.nombre}
              sucursalId={selectedSucursalId}
              onClose={() => {
                // Return to select employee screen when portal is done/closed
                handleBackToSelect()
              }}
            />
          </div>
        )}

      </div>
    </div>
  )
}
