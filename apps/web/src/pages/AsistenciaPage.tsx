import { useState, useEffect } from 'react'
import { Clock, Search, Users, MapPin, CheckCircle2, LogIn, Coffee, LogOut, Activity } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useSucursalContext } from '../context/SucursalContext'
import { useEmpleadas } from '../hooks/useEmpleadas'
import { useSucursales } from '../hooks/useSucursales'
import { useToast } from '../components/Common/Toast'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

type TipoAsistencia = 'Entrada' | 'Salida Comida' | 'Regreso Comida' | 'Salida'

export default function AsistenciaPage() {
  const { selectedSucursalId } = useSucursalContext()
  const { data: sucursales = [] } = useSucursales()
  const { data: empleadas = [] } = useEmpleadas(selectedSucursalId || undefined)
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

  const handleRegister = async (tipo: TipoAsistencia) => {
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
          empleada_id: selectedEmpleadaId,
          tipo
        })

      if (error) throw error

      toast(`Registro exitoso: ${tipo}`, 'success')
      fetchTodayHistory()
    } catch (err) {
      console.error(err)
      toast('Error al registrar. Asegúrate de haber actualizado la base de datos.', 'error')
    } finally {
      setRegistering(false)
    }
  }

  // Calculate state for selected employee
  const employeeLogs = history.filter(h => h.empleada_id === selectedEmpleadaId)
  const lastLog = employeeLogs.length > 0 ? employeeLogs[0] : null

  let availableActions: TipoAsistencia[] = ['Entrada']
  if (lastLog) {
    if (lastLog.tipo === 'Entrada') availableActions = ['Salida Comida', 'Salida']
    else if (lastLog.tipo === 'Salida Comida') availableActions = ['Regreso Comida']
    else if (lastLog.tipo === 'Regreso Comida') availableActions = ['Salida']
    else if (lastLog.tipo === 'Salida') availableActions = []
  }

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'Entrada': return <LogIn size={14} />
      case 'Salida Comida': return <Coffee size={14} />
      case 'Regreso Comida': return <LogIn size={14} />
      case 'Salida': return <LogOut size={14} />
      default: return <CheckCircle2 size={14} />
    }
  }

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'Entrada': return 'var(--success)'
      case 'Salida Comida': return '#f59e0b'
      case 'Regreso Comida': return 'var(--success)'
      case 'Salida': return 'var(--danger)'
      default: return 'var(--accent)'
    }
  }

  const getCurrentStatusLabel = (tipo?: string) => {
    switch (tipo) {
      case 'Entrada': return 'Trabajando'
      case 'Salida Comida': return 'En Comida'
      case 'Regreso Comida': return 'Trabajando (Regresó)'
      case 'Salida': return 'Jornada Terminada'
      default: return 'Fuera de Turno'
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div className="page-header" style={{ padding: '24px 24px 0', marginBottom: 24 }}>
        <div className="page-header-content">
          <h1 className="page-title">Jornada Laboral</h1>
          <p className="page-subtitle">Control de turnos, descansos y tiempos de comida</p>
        </div>
      </div>

      <div className="page-content" style={{ padding: '0 24px 24px', overflowY: 'auto', display: 'grid', gridTemplateColumns: 'minmax(300px, 420px) 1fr', gap: '24px' }}>
        
        {/* Registration Card */}
        <div className="card" style={{ padding: '0', height: 'fit-content', borderTop: '4px solid var(--accent)', overflow: 'hidden' }}>
          
          <div style={{ padding: '24px 28px', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent)', marginBottom: '4px' }}>
              <MapPin size={20} />
              <h2 style={{ fontSize: '15px', fontWeight: 700, margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {activeSucursal?.nombre || 'Sin sucursal'}
              </h2>
            </div>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-3)' }}>
              Selecciona tu nombre para gestionar tu turno actual.
            </p>
          </div>

          <div style={{ padding: '28px' }}>
            <div style={{ marginBottom: '24px' }}>
              <div style={{ position: 'relative' }}>
                <Users size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
                <select 
                  className="form-input" 
                  value={selectedEmpleadaId}
                  onChange={(e) => setSelectedEmpleadaId(e.target.value)}
                  style={{ paddingLeft: '44px', height: '52px', fontSize: '16px', fontWeight: 600, background: 'var(--bg)' }}
                >
                  <option value="">— Buscar miembro del personal —</option>
                  {empleadas.map(e => (
                    <option key={e.id} value={e.id}>{e.nombre}</option>
                  ))}
                </select>
              </div>
            </div>

            {selectedEmpleadaId ? (
              <div style={{ animation: 'fade-in 0.3s ease-out' }}>
                
                {/* Current Status Indicator */}
                <div style={{ 
                  background: 'var(--bg)', 
                  borderRadius: '16px', 
                  padding: '20px', 
                  textAlign: 'center', 
                  border: '1px solid var(--border)',
                  marginBottom: '24px',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: getTipoColor(lastLog?.tipo) }} />
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                    Estado Actual
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: getTipoColor(lastLog?.tipo) }}>
                    <Activity size={20} />
                    <span style={{ fontSize: '20px', fontWeight: 800 }}>
                      {getCurrentStatusLabel(lastLog?.tipo)}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {availableActions.length === 0 && (
                    <div style={{ padding: '16px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                      <CheckCircle2 size={32} style={{ color: 'var(--success)', margin: '0 auto 8px' }} />
                      <p style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--success)' }}>Jornada Completada</p>
                      <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-2)' }}>Has registrado tu salida exitosamente por hoy.</p>
                    </div>
                  )}
                  
                  {availableActions.includes('Entrada') && (
                    <button 
                      className="btn-primary" 
                      onClick={() => handleRegister('Entrada')} 
                      disabled={registering}
                      style={{ width: '100%', padding: '16px', fontSize: '15px', fontWeight: 700, gap: '10px', background: 'var(--success)', borderColor: 'var(--success)', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)' }}
                    >
                      <LogIn size={20} /> {registering ? 'Registrando...' : 'Iniciar Turno (Entrada)'}
                    </button>
                  )}
                  
                  {availableActions.includes('Salida Comida') && (
                    <button 
                      className="btn-primary" 
                      onClick={() => handleRegister('Salida Comida')} 
                      disabled={registering}
                      style={{ width: '100%', padding: '16px', fontSize: '15px', fontWeight: 700, gap: '10px', background: '#f59e0b', borderColor: '#f59e0b', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.2)' }}
                    >
                      <Coffee size={20} /> {registering ? 'Registrando...' : 'Salir a Comer'}
                    </button>
                  )}
                  
                  {availableActions.includes('Regreso Comida') && (
                    <button 
                      className="btn-primary" 
                      onClick={() => handleRegister('Regreso Comida')} 
                      disabled={registering}
                      style={{ width: '100%', padding: '16px', fontSize: '15px', fontWeight: 700, gap: '10px', background: 'var(--success)', borderColor: 'var(--success)', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)' }}
                    >
                      <LogIn size={20} /> {registering ? 'Registrando...' : 'Regresar de Comer'}
                    </button>
                  )}
                  
                  {availableActions.includes('Salida') && (
                    <button 
                      className="btn-primary" 
                      onClick={() => handleRegister('Salida')} 
                      disabled={registering}
                      style={{ width: '100%', padding: '16px', fontSize: '15px', fontWeight: 700, gap: '10px', background: 'var(--danger)', borderColor: 'var(--danger)', marginTop: '8px', boxShadow: '0 4px 12px rgba(220, 38, 38, 0.2)' }}
                    >
                      <LogOut size={20} /> {registering ? 'Registrando...' : 'Terminar Turno (Salida)'}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ padding: '32px 20px', background: 'var(--surface-2)', borderRadius: '16px', textAlign: 'center', border: '1px dashed var(--border)' }}>
                <Clock size={32} style={{ color: 'var(--text-3)', margin: '0 auto 12px', opacity: 0.5 }} />
                <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-2)', fontWeight: 500 }}>Selecciona tu nombre para ver tus opciones de turno</p>
              </div>
            )}
            
          </div>
        </div>

        {/* History Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-1)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={16} /> Bitácora del Día
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--text-3)', background: 'var(--surface-2)', padding: '4px 10px', borderRadius: '12px' }}>
              {activeSucursal?.nombre || ''}
            </span>
          </div>

          <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
            {loading ? (
              <div style={{ padding: '0' }}>
                {[...Array(4)].map((_, i) => (
                  <div key={i} style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--border)', animation: 'skeleton-pulse 1.5s infinite ease-in-out' }}></div>
                      <div>
                        <div style={{ width: 100, height: 12, background: 'var(--border)', borderRadius: 4, marginBottom: 6, animation: 'skeleton-pulse 1.5s infinite ease-in-out' }}></div>
                        <div style={{ width: 60, height: 8, background: 'var(--border)', borderRadius: 2, animation: 'skeleton-pulse 1.5s infinite ease-in-out' }}></div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ width: 50, height: 12, background: 'var(--border)', borderRadius: 4, marginBottom: 6, marginLeft: 'auto', animation: 'skeleton-pulse 1.5s infinite ease-in-out' }}></div>
                      <div style={{ width: 70, height: 8, background: 'var(--border)', borderRadius: 2, marginLeft: 'auto', animation: 'skeleton-pulse 1.5s infinite ease-in-out' }}></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : history.length === 0 ? (
              <div style={{ padding: '60px 40px', textAlign: 'center' }}>
                <Search size={40} style={{ opacity: 0.1, marginBottom: '12px' }} />
                <p style={{ color: 'var(--text-3)', fontSize: '14px' }}>No hay movimientos registrados hoy en esta sucursal.</p>
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
                    className="table-hover-row"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ 
                        width: '40px', height: '40px', borderRadius: '12px', 
                        background: 'var(--surface-2)', color: 'var(--text-1)', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        fontSize: '15px', fontWeight: 800 
                      }}>
                        {log.empleada?.nombre?.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-1)' }}>{log.empleada?.nombre}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: getTipoColor(log.tipo), textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 800, marginTop: '2px' }}>
                          {getTipoIcon(log.tipo || 'Entrada')}
                          {log.tipo || 'ENTRADA'}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-2)' }}>
                        {format(new Date(log.created_at), 'hh:mm aa')}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 500 }}>
                        {format(new Date(log.created_at), "d 'de' MMMM", { locale: es })}
                      </div>
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
