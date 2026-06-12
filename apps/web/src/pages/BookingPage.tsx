import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, ChevronRight, CheckCircle, ArrowLeft, RefreshCw, User, Sparkles, Clock } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Sucursal, Servicio, Empleada } from '../types/database'
import { useToast } from '../components/Common/Toast'
import { BookingCalendar } from '../components/Landing/BookingCalendar'
import { TimeSlotPicker } from '../components/Landing/TimeSlotPicker'
import { timeToSlots, slotsToTime } from '../utils/agenda'

// ─── HELPERS ──────────────────────────────────────────────────
// Lee las horas de apertura/cierre de la sucursal para un día concreto.
// Prioriza horarios_por_dia (por día de semana), con fallback a los campos generales.
function getSucursalHours(sucursal: Sucursal, date: Date): { start: number; end: number } {
  const dow = date.getDay() // 0=Dom, 6=Sáb
  const hpd = sucursal.horarios_por_dia
  if (hpd && hpd[dow] && !hpd[dow].cerrado) {
    return {
      start: parseInt(hpd[dow].apertura.split(':')[0], 10),
      end:   parseInt(hpd[dow].cierre.split(':')[0], 10),
    }
  }
  // Fallback: algunos valores legacy pueden llegar como nanosegundos enteros (PostgreSQL interval)
  const toHour = (val: string | number | null | undefined): number => {
    if (typeof val === 'string') return parseInt(val.split(':')[0], 10)
    if (typeof val === 'number') return Math.floor(val / 3_600_000_000_000) // nanoseconds → hours
    return 10 // safe default
  }
  const esFinde = dow === 0 || dow === 6
  const apertura = esFinde ? (sucursal.hora_apertura_finde ?? sucursal.hora_apertura) : sucursal.hora_apertura
  const cierre   = esFinde ? (sucursal.hora_cierre_finde   ?? sucursal.hora_cierre)   : sucursal.hora_cierre
  return { start: toHour(apertura) || 10, end: toHour(cierre) || 20 }
}

const sanitizePhone = (val: string) => val.replace(/\D/g, '').slice(0, 10)

type Step = 'sucursal' | 'servicio' | 'profesional' | 'fecha' | 'cliente' | 'confirmado'

export default function BookingPage() {
  const [step, setStep] = useState<Step>('sucursal')
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [perfiles, setPerfiles] = useState<Empleada[]>([])

  const [selectedSucursal, setSelectedSucursal] = useState<Sucursal | null>(null)
  const [selectedServicios, setSelectedServicios] = useState<Servicio[]>([])
  const [selectedProfesional, setSelectedProfesional] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedTime, setSelectedTime] = useState<string | null>(null)

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [clientInfo, setClientInfo] = useState({ nombre: '', telefono: '', email: '', notas_cliente: '' })
  const [isExistingClient, setIsExistingClient] = useState(false)

  // Real availability state
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [fetchingSlots, setFetchingSlots] = useState(false)

  // Responsive state
  const [isMobile, setIsMobile] = useState(window.innerWidth < 850)

  const toast = useToast()

  // ─── RESPONSIVE EFFECT ────────────────────────────────────────
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 850)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // ─── INIT ─────────────────────────────────────────────────────
  useEffect(() => {
    async function fetchData() {
      const [resSuc, resSer] = await Promise.all([
        supabase.from('sucursales').select('*').order('nombre'),
        supabase.from('servicios').select('*, categoria:categorias_servicio(nombre)').eq('activo', true).order('nombre')
      ])
      if (resSuc.data) setSucursales(resSuc.data)
      if (resSer.data) setServicios(resSer.data)
      setLoading(false)
    }
    fetchData()
  }, [])

  // ─── FETCH EMPLEADAS ──────────────────────────────────────────
  useEffect(() => {
    if (selectedSucursal) {
      supabase.from('perfiles_empleadas')
        .select('*')
        .eq('activo', true)
        .eq('sucursal_id', selectedSucursal.id)
        .then(({ data }) => {
          if (data) setPerfiles(data)
        })
    }
  }, [selectedSucursal])

  // ─── FETCH AVAILABILITY ───────────────────────────────────────
  useEffect(() => {
    if (selectedDate && selectedSucursal && selectedServicios.length > 0 && perfiles.length > 0) {
      async function checkAvailability() {
        setFetchingSlots(true)
        const dateStr = format(selectedDate!, 'yyyy-MM-dd')
        const totalDuration = selectedServicios.reduce((acc, s) => acc + s.duracion_slots, 0)

        // Horario real de la sucursal para el día seleccionado
        const { start: START_HOUR, end: END_HOUR } = getSucursalHours(selectedSucursal, selectedDate!)

        try {
          // We query all appointments for that day regardless of branch to check true availability of the pro
          const [resCitas, resBloqueos] = await Promise.all([
            supabase.from('citas')
              .select('bloque_inicio, duracion_manual_slots, empleada_id')
              .eq('fecha', dateStr)
              .neq('estado', 'Cancelada'),
            supabase.from('bloqueos_agenda')
              .select('hora_inicio, hora_fin, empleada_id')
              .eq('fecha', dateStr)
          ])

          const citas = resCitas.data || []
          const bloqueos = resBloqueos.data || []

          const slotsFound = new Set<string>()

          const perfilesToCheck = selectedProfesional
            ? perfiles.filter(p => p.id === selectedProfesional)
            : perfiles

          perfilesToCheck.forEach(emp => {
            const occupied = new Array(96).fill(false)
            citas.filter(c => c.empleada_id === emp.id).forEach(c => {
              const start    = timeToSlots(c.bloque_inicio)
              const duration = c.duracion_manual_slots || 4
              for (let i = 0; i < duration; i++) if (start + i < 96) occupied[start + i] = true
            })
            bloqueos.filter(b => b.empleada_id === emp.id).forEach(b => {
              const start = timeToSlots(b.hora_inicio)
              const end   = timeToSlots(b.hora_fin)
              for (let i = start; i < end; i++) if (i < 96) occupied[i] = true
            })
            for (let h = START_HOUR; h < END_HOUR; h++) {
              for (let m = 0; m < 60; m += 15) {
                const sIndex = h * 4 + m / 15
                let canFit = true
                for (let i = 0; i < totalDuration; i++) {
                  if (sIndex + i >= 96 || occupied[sIndex + i]) {
                    canFit = false
                    break
                  }
                }
                if (canFit) {
                  slotsFound.add(slotsToTime(sIndex))
                }
              }
            }
          })
          setAvailableSlots(Array.from(slotsFound).sort())
        } catch (err) {
          console.error(err)
        } finally {
          setFetchingSlots(false)
        }
      }
      checkAvailability()
    }
  }, [selectedDate, selectedSucursal, selectedServicios, perfiles, selectedProfesional])

  // ─── CHECK EXISTING CLIENT (via RPC — no expone datos directamente) ────────
  useEffect(() => {
    if (clientInfo.telefono.length === 10) {
      supabase.rpc('verificar_cliente_por_telefono', { p_telefono: clientInfo.telefono })
        .then(({ data }) => {
          if (data?.existe) {
            setClientInfo(prev => ({ ...prev, nombre: data.nombre_completo, email: data.email || prev.email }))
            setIsExistingClient(true)
          } else {
            setIsExistingClient(false)
          }
        })
    } else {
      setIsExistingClient(false)
    }
  }, [clientInfo.telefono])

  // ─── HANDLERS ─────────────────────────────────────────────────
  const toggleServicio = (s: Servicio) => {
    setSelectedServicios(prev => {
      const exists = prev.find(item => item.id === s.id)
      if (exists) return prev.filter(item => item.id !== s.id)
      return [...prev, s]
    })
  }

  const handleConfirm = async () => {
    if (!selectedDate || !selectedTime || !selectedSucursal || selectedServicios.length === 0) return
    if (!clientInfo.nombre || clientInfo.telefono.length !== 10) {
      toast('Por favor completa tu nombre y un teléfono válido (10 dígitos)', 'error')
      return
    }

    setSubmitting(true)
    try {
      // ── Todo el flujo de reserva corre server-side via RPC SECURITY DEFINER.
      // ── El rol anon nunca toca directamente las tablas clientes/citas/cita_servicios.
      const { data, error } = await supabase.rpc('crear_reserva_publica', {
        p_telefono:      clientInfo.telefono,
        p_nombre:        clientInfo.nombre,
        p_email:         clientInfo.email || '',
        p_sucursal_id:   selectedSucursal.id,
        p_fecha:         format(selectedDate, 'yyyy-MM-dd'),
        p_bloque_inicio: selectedTime,
        p_servicio_ids:  selectedServicios.map(s => s.id),
        p_notas:         clientInfo.notas_cliente || null,
        p_empleada_id:   selectedProfesional || null
      })

      if (error) throw error
      if (data?.error) throw new Error(data.error)

      setStep('confirmado')
    } catch (err: any) {
      console.error(err)
      toast('Error al agendar: ' + err.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const totalPrice = selectedServicios.reduce((acc, s) => acc + (parseFloat(s.precio as any) || 0), 0)
  const totalTime = selectedServicios.reduce((acc, s) => acc + s.duracion_slots * 15, 0)

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
      <RefreshCw size={32} className="animate-spin" color="var(--primary)" />
    </div>
  )

  // ─── RENDER ───────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#fbfbfb', color: '#1d1d1f', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
      <header style={{
        position: 'sticky', top: 0, background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)',
        zIndex: 100, borderBottom: '1px solid #f2f2f2', padding: isMobile ? '12px 16px' : '16px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {step !== 'sucursal' && step !== 'confirmado' && (
            <button
              onClick={() => { if (step === 'servicio') setStep('sucursal'); if (step === 'profesional') setStep('servicio'); if (step === 'fecha') setStep('profesional'); if (step === 'cliente') setStep('fecha'); }}
              style={{ background: '#f5f5f7', border: 'none', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: 'inherit' }}>
            <img src="/logoVertical.png" style={{ height: 28 }} alt="Logo" />
            {!isMobile && <span style={{ fontWeight: 700, fontSize: 16 }}>MUYMUY</span>}
          </Link>
        </div>
        {step !== 'confirmado' && (
          <Link to="/" style={{ fontSize: 13, fontWeight: 600, color: '#ff3b30', textDecoration: 'none', padding: '6px 14px', borderRadius: '14px', background: '#fff1f0' }}>Cancelar</Link>
        )}
        {step === 'confirmado' && <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>MUYMUY Beauty</div>}
      </header>

      <main style={{ maxWidth: isMobile ? 600 : 1000, margin: '0 auto', padding: isMobile ? '32px 20px 48px' : '48px 20px' }}>
        {step !== 'confirmado' && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 40, justifyContent: 'center' }}>
            {(['sucursal', 'servicio', 'fecha', 'cliente'] as Step[]).map((s) => (
              <div key={s} style={{ width: 8, height: 8, borderRadius: '50%', background: step === s ? 'var(--primary)' : '#e5e5e5', transition: 'all 0.3s' }} />
            ))}
          </div>
        )}

        {/* STEP: SUCURSAL */}
        {step === 'sucursal' && (
          <div className="animate-in" style={{ maxWidth: 600, margin: '0 auto' }}>
            <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.5px' }}>¿A qué sucursal deseas ir?</h1>
            <p style={{ color: '#6e6e73', marginBottom: 32 }}>Elige tu estudio favorito en Polanco.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {sucursales.map(s => (
                <button key={s.id} onClick={() => { setSelectedSucursal(s); setStep('servicio'); }} style={{ padding: 20, borderRadius: 16, background: '#fff', border: '1px solid #efefef', display: 'flex', alignItems: 'center', gap: 16, textAlign: 'left', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', cursor: 'pointer' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><MapPin size={20} color="var(--primary)" /></div>
                  <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 17 }}>{s.nombre}</div><div style={{ fontSize: 13, color: '#86868b' }}>{s.direccion?.split(',')[0]}</div></div><ChevronRight size={18} color="#c7c7cc" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP: SERVICIO */}
        {step === 'servicio' && (
          <div className="animate-in" style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 40, alignItems: 'flex-start' }}>
            <div style={{ flex: 1, width: '100%' }}>
              {isMobile && selectedServicios.length > 0 && (
                <div style={{
                  position: 'sticky', top: 60, zIndex: 50, background: 'rgba(255,255,255,0.95)',
                  backdropFilter: 'blur(12px)', padding: '12px 0', borderBottom: '1px solid #f2f2f2',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20
                }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary)' }}>
                    {selectedServicios.length} servicios
                    <span style={{ fontSize: 11, color: '#86868b', fontWeight: 500, marginLeft: 8 }}>{totalTime} min</span>
                  </div>
                  <button onClick={() => setStep('profesional')} style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '14px', fontSize: 15, fontWeight: 700, boxShadow: '0 4px 12px rgba(22, 163, 74, 0.2)' }}>Siguiente</button>
                </div>
              )}
              <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.5px' }}>Selecciona tus servicios</h1>
              <p style={{ color: '#6e6e73', marginBottom: 32 }}>Puedes elegir más de uno para tu sesión.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                {[...new Set(servicios.map(s => s.categoria?.nombre || 'Otros'))].map(family => (
                  <div key={family}>
                    <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', color: '#86868b', marginBottom: 12, letterSpacing: '1px' }}>{family}</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {servicios.filter(s => (s.categoria?.nombre || 'Otros') === family).map(s => {
                        const isSelected = selectedServicios.some(item => item.id === s.id)
                        return (
                          <button key={s.id} onClick={() => toggleServicio(s)} style={{ padding: 16, borderRadius: 14, background: isSelected ? 'var(--primary-light)' : '#fff', border: isSelected ? '1px solid var(--primary)' : '1px solid #efefef', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s' }}>
                            <div style={{ flex: 1 }}><div style={{ fontSize: 16, fontWeight: 600, color: isSelected ? 'var(--primary)' : '#1d1d1f' }}>{s.nombre}</div><div style={{ fontSize: 12, color: isSelected ? 'var(--primary)' : '#86868b' }}>{s.duracion_slots * 15} min • ${s.precio}</div></div>
                            {isSelected ? <CheckCircle size={20} color="var(--primary)" /> : <div style={{ width: 22, height: 22, borderRadius: '50%', border: '2px solid #efefef' }} />}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {!isMobile && selectedServicios.length > 0 && (
              <div style={{ width: 320, position: 'sticky', top: 120, background: '#fff', borderRadius: 24, padding: 24, border: '1px solid #efefef', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Tu reservación</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                  {selectedServicios.map(s => (<div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontSize: 14, color: '#424245' }}>{s.nombre}</span><span style={{ fontSize: 14, fontWeight: 600 }}>${s.precio}</span></div>))}
                </div>
                <div style={{ borderTop: '1px solid #f2f2f2', paddingTop: 20, marginBottom: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span style={{ fontSize: 13, color: '#86868b' }}>Tiempo estimado</span><span style={{ fontSize: 13, fontWeight: 600 }}>{totalTime} min</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: 20, fontWeight: 800 }}>Total</span><span style={{ fontSize: 20, fontWeight: 800, color: 'var(--primary)' }}>${totalPrice}</span></div>
                </div>
                <button onClick={() => setStep('profesional')} style={{ width: '100%', background: '#1d1d1f', color: '#fff', border: 'none', padding: '16px', borderRadius: '16px', fontSize: 16, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>Continuar</button>
              </div>
            )}
          </div>
        )}

        {/* STEP: PROFESIONAL */}
        {step === 'profesional' && (
          <div className="animate-in" style={{ maxWidth: 600, margin: '0 auto' }}>
            <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.5px' }}>¿Con quién prefieres atenderte?</h1>
            <p style={{ color: '#6e6e73', marginBottom: 32 }}>Puedes elegir a alguien en específico o dejar que te mostremos la mayor disponibilidad.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
              <button 
                onClick={() => setSelectedProfesional(null)}
                style={{ padding: 16, borderRadius: 14, background: selectedProfesional === null ? 'var(--primary-light)' : '#fff', border: selectedProfesional === null ? '1px solid var(--primary)' : '1px solid #efefef', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: selectedProfesional === null ? 'var(--primary)' : '#1d1d1f' }}>Cualquiera (Recomendado)</div>
                  <div style={{ fontSize: 13, color: selectedProfesional === null ? 'var(--primary)' : '#86868b' }}>Te mostraremos la mayor cantidad de horarios disponibles.</div>
                </div>
                {selectedProfesional === null ? <CheckCircle size={20} color="var(--primary)" /> : <div style={{ width: 22, height: 22, borderRadius: '50%', border: '2px solid #efefef' }} />}
              </button>

              {perfiles.map(p => {
                const isSelected = selectedProfesional === p.id
                return (
                  <button 
                    key={p.id}
                    onClick={() => setSelectedProfesional(p.id)}
                    style={{ padding: 16, borderRadius: 14, background: isSelected ? 'var(--primary-light)' : '#fff', border: isSelected ? '1px solid var(--primary)' : '1px solid #efefef', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s' }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 16, fontWeight: 600, color: isSelected ? 'var(--primary)' : '#1d1d1f' }}>{p.nombre}</div>
                      <div style={{ fontSize: 13, color: isSelected ? 'var(--primary)' : '#86868b' }}>Ver solo sus horarios libres.</div>
                    </div>
                    {isSelected ? <CheckCircle size={20} color="var(--primary)" /> : <div style={{ width: 22, height: 22, borderRadius: '50%', border: '2px solid #efefef' }} />}
                  </button>
                )
              })}
            </div>

            <button onClick={() => { setStep('fecha'); setSelectedTime(null); }} style={{ width: '100%', padding: '18px', borderRadius: 16, background: '#1d1d1f', color: '#fff', border: 'none', fontSize: 17, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>Continuar <ChevronRight size={18} /></button>
          </div>
        )}

        {/* STEP: FECHA Y HORA */}
        {step === 'fecha' && (
          <div className="animate-in" style={{ maxWidth: 600, margin: '0 auto' }}>
            <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.5px' }}>¿Cuándo vienes?</h1>
            <p style={{ color: '#6e6e73', marginBottom: 24 }}>Total: {totalTime} min en MUYMUY {selectedSucursal?.nombre}</p>

            <BookingCalendar
              currentMonth={currentMonth}
              selectedDate={selectedDate}
              onSelectDate={(day) => { setSelectedDate(day); setSelectedTime(null) }}
              onChangeMonth={setCurrentMonth}
            />

            {selectedDate && (
              <div className="animate-in">
                <TimeSlotPicker
                  totalTime={totalTime}
                  availableSlots={availableSlots}
                  selectedTime={selectedTime}
                  fetchingSlots={fetchingSlots}
                  onSelectTime={setSelectedTime}
                />
                {selectedTime && (
                  <button onClick={() => setStep('cliente')} style={{ marginTop: 40, width: '100%', padding: '18px', borderRadius: 16, background: '#1d1d1f', color: '#fff', border: 'none', fontSize: 17, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>Datos de contacto <ChevronRight size={18} /></button>
                )}
              </div>
            )}
          </div>
        )}

        {/* STEP: CLIENT INFO */}
        {step === 'cliente' && (
          <div className="animate-in" style={{ maxWidth: 600, margin: '0 auto' }}>
            <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.5px' }}>Tus datos</h1>
            <p style={{ color: '#6e6e73', marginBottom: 32 }}>Agenda lista, solo nos faltan tus detalles.</p>
            {isExistingClient && (
              <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '12px 16px', borderRadius: 12, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
                <Sparkles size={18} /> ¡Hola de nuevo! Encontramos tu cuenta.
              </div>
            )}
            <div style={{ background: '#fff', borderRadius: 20, padding: 24, border: '1px solid #efefef', marginBottom: 32 }}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 14, fontWeight: 800, color: '#1d1d1f', marginBottom: 8, display: 'block' }}>WhatsApp / Teléfono *</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid #efefef', paddingBottom: 12 }}><Clock size={18} color="#c7c7cc" /><input type="tel" placeholder="Ej: 5512345678" value={clientInfo.telefono} onChange={e => setClientInfo(prev => ({ ...prev, telefono: sanitizePhone(e.target.value) }))} style={{ border: 'none', width: '100%', fontSize: 16, outline: 'none', fontFamily: 'inherit' }} /></div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 14, fontWeight: 800, color: '#1d1d1f', marginBottom: 8, display: 'block' }}>Nombre completo *</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid #efefef', paddingBottom: 12 }}><User size={18} color="#c7c7cc" /><input type="text" placeholder="Escribe tu nombre" value={clientInfo.nombre} onChange={e => setClientInfo(prev => ({ ...prev, nombre: e.target.value }))} style={{ border: 'none', width: '100%', fontSize: 16, outline: 'none', fontFamily: 'inherit' }} disabled={isExistingClient} /></div>
              </div>
              <div>
                <label style={{ fontSize: 14, fontWeight: 800, color: '#1d1d1f', marginBottom: 8, display: 'block' }}>Correo electrónico (Opcional)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid #efefef', paddingBottom: 12 }}><User size={18} color="#c7c7cc" /><input type="email" placeholder="Tu email" value={clientInfo.email} onChange={e => setClientInfo(prev => ({ ...prev, email: e.target.value }))} style={{ border: 'none', width: '100%', fontSize: 16, outline: 'none', fontFamily: 'inherit' }} disabled={isExistingClient} /></div>
              </div>
              <div style={{ marginTop: 20 }}>
                <label style={{ fontSize: 14, fontWeight: 800, color: '#1d1d1f', marginBottom: 8, display: 'block' }}>¿Deseas agregar una nota? (Opcional)</label>
                <textarea 
                  placeholder="Ej: Alergias, detalles del servicio, etc." 
                  value={clientInfo.notas_cliente} 
                  onChange={e => setClientInfo(prev => ({ ...prev, notas_cliente: e.target.value }))} 
                  style={{ 
                    width: '100%', height: 100, border: '1px solid #efefef', borderRadius: 12, 
                    padding: 12, fontSize: 15, outline: 'none', resize: 'none', background: '#f9f9f9', fontFamily: 'inherit' 
                  }} 
                />
              </div>
            </div>
            <div style={{ background: 'var(--primary-light)', borderRadius: 20, padding: 24, marginBottom: 32 }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary)', marginBottom: 16 }}>Resumen de reservación</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', opacity: 0.7, textTransform: 'uppercase', marginBottom: 4 }}>Servicios</div>
                  {selectedServicios.map(s => (<div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span style={{ fontSize: 15, color: '#424245' }}>{s.nombre}</span><span style={{ fontSize: 15, fontWeight: 600 }}>${s.precio}</span></div>))}
                </div>
                <div style={{ height: 1, background: 'var(--primary)', opacity: 0.1, margin: '8px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: 15, color: '#424245' }}>Ubicación</span><span style={{ fontSize: 15, fontWeight: 600 }}>MUYMUY {selectedSucursal?.nombre}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: 15, color: '#424245' }}>Fecha y hora</span><span style={{ fontSize: 15, fontWeight: 600 }}>{selectedDate && format(selectedDate, 'd MMM', { locale: es })} • {selectedTime} hs</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}><span style={{ fontSize: 16, fontWeight: 800 }}>TOTAL</span><span style={{ fontSize: 20, fontWeight: 800, color: 'var(--primary)' }}>${totalPrice}</span></div>
              </div>
            </div>
            <button onClick={handleConfirm} disabled={submitting} style={{ width: '100%', padding: '18px', borderRadius: 16, background: '#1d1d1f', color: '#fff', border: 'none', fontSize: 17, fontWeight: 700, cursor: 'pointer', opacity: submitting ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>{submitting ? 'Confirmando...' : 'Confirmar Reservación'}</button>
          </div>
        )}

        {/* STEP: CONFIRMADO */}
        {step === 'confirmado' && (
          <div className="animate-in" style={{ textAlign: 'center', paddingTop: 40, maxWidth: 600, margin: '0 auto' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: '#fff', boxShadow: '0 10px 20px var(--primary-light)' }}><CheckCircle size={40} /></div>
            <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 12, letterSpacing: '-1px' }}>¡Cita agendada!</h1>
            <p style={{ color: '#6e6e73', fontSize: 17, lineHeight: 1.5, marginBottom: 40 }}>Gracias {clientInfo.nombre}. Hemos reservado tu lugar para el <strong>{selectedDate && format(selectedDate, 'd MMMM', { locale: es })}</strong> a las <strong>{selectedTime}</strong>.</p>
            <div style={{ background: '#fff', borderRadius: 24, padding: 32, border: '1px solid #efefef', marginBottom: 40, textAlign: 'left' }}><div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}><Sparkles size={20} color="var(--accent)" /><span style={{ fontSize: 15, fontWeight: 700 }}>Recordatorio Importante</span></div><p style={{ fontSize: 14, color: '#6e6e73', lineHeight: 1.6 }}>Por favor llegar 10 minutos antes de tu cita. Si necesitas cancelar, avísanos con 24 horas de antelación.</p></div>
            <button onClick={() => window.location.href = '/'} style={{ padding: '16px 32px', borderRadius: '40px', background: '#f5f5f7', color: '#1d1d1f', border: 'none', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Volver al inicio</button>
          </div>
        )}
      </main>

      <style>{`
        .animate-in { animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  )
}
