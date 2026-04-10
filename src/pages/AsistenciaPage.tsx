import { useState, useEffect } from 'react'
import { Clock, UserCheck, Search, Users, MapPin, CheckCircle2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useSucursalContext } from '../context/SucursalContext'
import { useTodasEmpleadas } from '../hooks/useEmpleadas'
import { useSucursales } from '../hooks/useSucursales'
import { useToast } from '../components/Common/Toast'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function AsistenciaPage() {
  const { selectedSucursalId } = useSucursalContext()
  const { data: sucursales = [] } = useSucursales()
  const { data: empleadas = [] } = useTodasEmpleadas()
  const toast = useToast()

  const [selectedEmpleadaId, setSelectedEmpleadaId] = useState('')
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [registering, setRegistering] = useState(false)

  const activeSucursal = sucursales.find(s => s.id === selectedSucursalId)

  const fetchTodayHistory = async () => {
    if (!selectedSucursalId) return
    setLoading(true)
    const today = new Date().toISOString().split('T')[0]
    
    // Fetch logs for today in this sucursal
    const { data, error } = await supabase
      .from('asistencia')
      .select('*, empleada:perfiles_empleadas(nombre)')
      .eq('sucursal_id', selectedSucursalId)
      .gte('created_at', today)
      .order('created_at', { ascending: false })

    if (error) console.error(error)
    else setHistory(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchTodayHistory()
  }, [selectedSucursalId])

  const handleRegister = async () => {
    if (!selectedEmpleadaId) {
      toast('Por favor selecciona tu nombre del personal', 'warning')
      return
    }
    if (!selectedSucursalId) {
      toast('No hay una sucursal seleccionada', 'error')
      return
    }

    setRegistering(true)
    try {
      const { error } = await supabase
        .from('asistencia')
        .insert({
          sucursal_id: selectedSucursalId,
          empleada_id: selectedEmpleadaId
        })

      if (error) throw error

      toast('Llegada registrada con éxito', 'success')
      setSelectedEmpleadaId('')
      fetchTodayHistory()
    } catch (err) {
      console.error(err)
      toast('Error al registrar llegada', 'error')
    } finally {
      setRegistering(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div className="page-header" style={{ padding: '24px 24px 0', marginBottom: 24 }}>
        <div className="page-header-content">
          <h1 className="page-title">Registro de Asistencia</h1>
          <p className="page-subtitle">Reporta tu llegada a la sucursal activa</p>
        </div>
      </div>

      <div className="page-content" style={{ padding: '0 24px 24px', overflowY: 'auto', display: 'grid', gridTemplateColumns: 'minmax(300px, 400px) 1fr', gap: '24px' }}>
        
        {/* Registration Card */}
        <div className="card" style={{ padding: '28px', height: 'fit-content', borderTop: '4px solid var(--accent)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', color: 'var(--accent)' }}>
            <MapPin size={24} />
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>
              {activeSucursal?.nombre || 'Sin sucursal'}
            </h2>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-2)', marginBottom: '8px' }}>
              Selecciona tu nombre
            </label>
            <div style={{ position: 'relative' }}>
              <Users size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
              <select 
                className="form-input" 
                value={selectedEmpleadaId}
                onChange={(e) => setSelectedEmpleadaId(e.target.value)}
                style={{ paddingLeft: '38px', height: '44px' }}
              >
                <option value="">— Buscar miembro del personal —</option>
                {empleadas.map(e => (
                  <option key={e.id} value={e.id}>{e.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          <button 
            className="btn-primary" 
            onClick={handleRegister} 
            disabled={registering}
            style={{ width: '100%', padding: '14px', fontSize: '16px', fontWeight: 700, gap: '10px' }}
          >
            {registering ? 'Registrando...' : (
              <>
                <UserCheck size={18} />
                Registrar mi llegada
              </>
            )}
          </button>
          
          <p style={{ marginTop: '16px', fontSize: '12px', color: 'var(--text-3)', textAlign: 'center' }}>
            Tu ubicación actual se detecta automáticamente por el selector global de la barra lateral.
          </p>
        </div>

        {/* History Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-1)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={16} /> Personal que ya llegó hoy
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--text-3)', background: 'var(--surface-2)', padding: '4px 10px', borderRadius: '12px' }}>
              {activeSucursal?.nombre || ''}
            </span>
          </div>

          <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-3)' }}>Actualizando lista...</div>
            ) : history.length === 0 ? (
              <div style={{ padding: '60px 40px', textAlign: 'center' }}>
                <Search size={40} style={{ opacity: 0.1, marginBottom: '12px' }} />
                <p style={{ color: 'var(--text-3)', fontSize: '14px' }}>Nadie ha registrado su llegada hoy en esta sucursal.</p>
              </div>
            ) : (
              <div style={{ maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' }}>
                {history.map((log) => (
                  <div 
                    key={log.id} 
                    style={{ 
                      padding: '16px 20px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      borderBottom: '1px solid var(--border)',
                      background: 'var(--surface)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--accent-light)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700 }}>
                        {log.empleada?.nombre?.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-1)' }}>{log.empleada?.nombre}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>REGISTRO EXITOSO</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-2)' }}>
                        {format(new Date(log.created_at), 'hh:mm aa')}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-3)' }}>
                        {format(new Date(log.created_at), "d 'de' MMMM", { locale: es })}
                      </div>
                    </div>
                    <div style={{ marginLeft: '12px', color: '#10b981' }}>
                      <CheckCircle2 size={18} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
