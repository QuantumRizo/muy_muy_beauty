import { useState, useEffect, useRef } from 'react'
import { LogIn, Coffee, LogOut, CheckCircle2, Activity, ArrowLeft } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useToast } from '../Common/Toast'
import { hoyMX, ahoraMX } from '../../lib/dateUtils'

type TipoAsistencia = 'Entrada' | 'Salida Comida' | 'Salida'

interface RegistroAsistencia {
  id: string
  tipo: TipoAsistencia
  created_at: string
}

interface EmployeePortalProps {
  empleadaId: string
  empleadaNombre: string
  sucursalId: string
  onClose: () => void
}

export default function EmployeePortal({ empleadaId, empleadaNombre, sucursalId, onClose }: EmployeePortalProps) {
  const [history, setHistory] = useState<RegistroAsistencia[]>([])
  const [loading, setLoading] = useState(true)
  const [registering, setRegistering] = useState(false)
  const toast = useToast()
  const cancelledRef = useRef(false)

  // Auto-close after 30 seconds of inactivity
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 30000)
    return () => clearTimeout(timer)
  }, [onClose, history, registering])

  const fetchHistory = async () => {
    setLoading(true)
    const today = hoyMX()
    
    cancelledRef.current = false
    const { data, error } = await supabase
      .from('asistencia')
      .select('*')
      .eq('sucursal_id', sucursalId)
      .eq('empleada_id', empleadaId)
      .gte('created_at', today)
      .order('created_at', { ascending: false })

    if (cancelledRef.current) return

    if (error) {
      console.error(error)
      toast('Error al cargar tu historial de hoy', 'error')
    } else {
      setHistory(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchHistory()
    return () => { cancelledRef.current = true }
  }, [empleadaId])

  const handleRegister = async (tipo: TipoAsistencia) => {
    setRegistering(true)
    try {
      const { error } = await supabase
        .from('asistencia')
        .insert({
          sucursal_id: sucursalId,
          empleada_id: empleadaId,
          tipo
        })

      if (error) throw error

      if (tipo === 'Salida Comida') {
        const ahora = ahoraMX()
        const horaInicio = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}:00`
        const unaHoraDespues = new Date(ahora.getTime() + 60 * 60 * 1000)
        const horaFin = `${String(unaHoraDespues.getHours()).padStart(2, '0')}:${String(unaHoraDespues.getMinutes()).padStart(2, '0')}:00`
        const hoy = hoyMX()

        await supabase.from('bloqueos_agenda').insert({
          empleada_id: empleadaId,
          fecha: hoy,
          hora_inicio: horaInicio,
          hora_fin: horaFin,
          motivo: 'Comida (automático)',
          origen: 'comida',
        })
      }

      if (tipo === 'Salida') {
        const hoy = hoyMX()
        await supabase
          .from('bloqueos_agenda')
          .delete()
          .eq('empleada_id', empleadaId)
          .eq('fecha', hoy)
          .eq('origen', 'comida')
      }

      toast(`Registro exitoso: ${tipo}`, 'success')
      
      // Auto-close after successful registration
      setTimeout(() => {
        onClose()
      }, 1500)
      
    } catch (err) {
      console.error(err)
      toast('Error al registrar.', 'error')
      setRegistering(false)
    }
  }

  const lastLog = history.length > 0 ? history[0] : null

  let availableActions: TipoAsistencia[] = ['Entrada']
  if (lastLog) {
    if (lastLog.tipo === 'Entrada') availableActions = ['Salida Comida', 'Salida']
    else if (lastLog.tipo === 'Salida Comida') availableActions = ['Salida']
    else if (lastLog.tipo === 'Salida') availableActions = []
  }

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'Entrada': return 'var(--success)'
      case 'Salida Comida': return '#f59e0b'
      case 'Salida': return 'var(--danger)'
      default: return 'var(--accent)'
    }
  }

  const getCurrentStatusLabel = (tipo?: string) => {
    switch (tipo) {
      case 'Entrada': return 'Trabajando'
      case 'Salida Comida': return 'En Comida (1 hr)'
      case 'Salida': return 'Jornada Terminada'
      default: return 'Fuera de Turno'
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-[var(--text-3)] flex flex-col items-center gap-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent)]"></div>
      Cargando tu información...
    </div>
  }

  return (
    <div className="flex flex-col items-center bg-[var(--surface-1)] rounded-2xl w-full max-w-md mx-auto p-6 relative">
      <button 
        onClick={onClose}
        className="absolute top-6 left-6 p-2 text-[var(--text-3)] hover:text-[var(--text-1)] rounded-full hover:bg-[var(--surface-2)] transition-colors"
      >
        <ArrowLeft size={20} />
      </button>

      <div className="w-16 h-16 bg-[var(--surface-2)] text-[var(--text-1)] rounded-full flex items-center justify-center text-2xl font-bold mb-4 mt-2 border border-[var(--border)]">
        {empleadaNombre.charAt(0)}
      </div>
      <h2 className="text-2xl font-bold mb-1 text-[var(--text-1)]">Hola, {empleadaNombre}</h2>
      <p className="text-sm text-[var(--text-3)] mb-6 text-center">
        ¿Qué deseas hacer?
      </p>

      {/* Current Status Indicator */}
      <div className="w-full bg-[var(--bg)] rounded-xl p-4 text-center border border-[var(--border)] mb-6 relative overflow-hidden">
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: getTipoColor(lastLog?.tipo || '') }} />
        <div className="text-[10px] font-bold text-[var(--text-3)] uppercase tracking-wider mb-2 mt-1">
          Estado Actual
        </div>
        <div className="flex items-center justify-center gap-2" style={{ color: getTipoColor(lastLog?.tipo || '') }}>
          <Activity size={18} />
          <span className="text-lg font-extrabold">
            {getCurrentStatusLabel(lastLog?.tipo || '')}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3 w-full mb-6">
        {availableActions.length === 0 && (
          <div className="p-4 bg-[rgba(16,185,129,0.1)] rounded-xl text-center border border-[rgba(16,185,129,0.2)]">
            <CheckCircle2 size={28} className="text-[var(--success)] mx-auto mb-2" />
            <p className="m-0 text-sm font-bold text-[var(--success)]">Jornada Completada</p>
          </div>
        )}
        
        {availableActions.includes('Entrada') && (
          <button 
            className="flex items-center justify-center gap-2 w-full p-4 rounded-xl text-white font-bold transition-all hover:brightness-110 active:scale-[0.98]" 
            onClick={() => handleRegister('Entrada')} 
            disabled={registering}
            style={{ background: 'var(--success)' }}
          >
            <LogIn size={20} /> {registering ? 'Registrando...' : 'Iniciar Turno (Entrada)'}
          </button>
        )}
        
        {availableActions.includes('Salida Comida') && (
          <button 
            className="flex items-center justify-center gap-2 w-full p-4 rounded-xl text-white font-bold transition-all hover:brightness-110 active:scale-[0.98]" 
            onClick={() => handleRegister('Salida Comida')} 
            disabled={registering}
            style={{ background: '#f59e0b' }}
          >
            <Coffee size={20} /> {registering ? 'Registrando...' : 'Salir a Comer'}
          </button>
        )}
        
        {availableActions.includes('Salida') && (
          <button 
            className="flex items-center justify-center gap-2 w-full p-4 rounded-xl text-white font-bold transition-all hover:brightness-110 active:scale-[0.98]" 
            onClick={() => handleRegister('Salida')} 
            disabled={registering}
            style={{ background: 'var(--danger)' }}
          >
            <LogOut size={20} /> {registering ? 'Registrando...' : 'Terminar Turno (Salida)'}
          </button>
        )}
      </div>
      
      <p className="text-xs text-[var(--text-3)] text-center w-full pb-2">
        La sesión se cerrará automáticamente en 30s.
      </p>
    </div>
  )
}
