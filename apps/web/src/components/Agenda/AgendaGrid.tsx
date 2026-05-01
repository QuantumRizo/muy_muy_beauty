import { useRef, useCallback, useState, useEffect } from 'react'
import { format, isToday, startOfDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { CheckCircle2, User, Phone, ClipboardList, CalendarX, Move } from 'lucide-react'

import type { Cita, BloqueoAgenda, Empleada, Sucursal } from '../../types/database'

// ─── Header Constants ──────────────────────────────────────────
const HEADER_DAY_H = 44       
const HEADER_EMP_H = 26       
const HEADER_H     = HEADER_DAY_H + HEADER_EMP_H
const CORNER_W     = 55       

// Virtual "Disponible" column type — acts like an Empleada in the grid
interface DisponibleCol {
  id: string       // 'disponible-1', 'disponible-2', etc.
  nombre: string   // 'Disponible 1'
  isVirtual: true
}

type Column = Empleada | DisponibleCol

function isVirtual(col: Column): col is DisponibleCol {
  return (col as DisponibleCol).isVirtual === true
}

interface Props {
  weekDates: Date[]          // 7 Date objects, Mon–Sun
  empleadas: Empleada[]
  sucursal?: Sucursal | null // Needed to read num_cabinas
  isLoading?: boolean
  citas: Cita[]
  bloqueos: BloqueoAgenda[]
  empleadasConEntrada?: Set<string>  // IDs de empleadas que llegaron hoy
  onSlotClick: (empleadaId: string, hora: string, fecha: string) => void
  onCitaClick: (cita: Cita) => void
  onBloqueoClick?: (bloqueo: BloqueoAgenda) => void
}

export default function AgendaGrid({
  weekDates, empleadas, sucursal, isLoading, citas, bloqueos, empleadasConEntrada,
  onSlotClick, onCitaClick, onBloqueoClick,
}: Props) {

  // ─── Dynamic Hours Logic ──────────────────────────────────────
  // Returns the start/end hour for a given Date, respecting weekday vs weekend
  const getHorasForDate = useCallback((date: Date) => {
    const dow = date.getDay() // 0=Dom, 6=Sáb
    const esFinde = dow === 0 || dow === 6
    const apertura = esFinde
      ? (sucursal?.hora_apertura_finde ?? sucursal?.hora_apertura ?? '08:00:00')
      : (sucursal?.hora_apertura ?? '08:00:00')
    const cierre = esFinde
      ? (sucursal?.hora_cierre_finde ?? sucursal?.hora_cierre ?? '21:00:00')
      : (sucursal?.hora_cierre ?? '21:00:00')
    return {
      inicio: parseInt(apertura.split(':')[0]),
      fin:    parseInt(cierre.split(':')[0]),
    }
  }, [sucursal])

  // Global grid uses the widest range across all days so all columns fit
  const HORA_INICIO = Math.min(...weekDates.map(d => getHorasForDate(d).inicio))
  const HORA_FIN    = Math.max(...weekDates.map(d => getHorasForDate(d).fin))
  const SLOTS_TOTAL = (HORA_FIN - HORA_INICIO) * 4

  const timeToSlot = useCallback((time: string): number => {
    const [h, m] = time.split(':').map(Number)
    return (h - HORA_INICIO) * 4 + Math.floor(m / 15)
  }, [HORA_INICIO])

  const [slots] = useState(() => {
    const res: { label: string; isHour: boolean }[] = []
    for (let s = 0; s < SLOTS_TOTAL; s++) {
      const totalMin = HORA_INICIO * 60 + s * 15
      const hh = Math.floor(totalMin / 60).toString().padStart(2, '0')
      const mm = (totalMin % 60).toString().padStart(2, '0')
      res.push({ label: `${hh}:${mm}`, isHour: mm === '00' })
    }
    return res
  })

  // We need to regenerate slots if hours change
  const [SLOTS, setSLOTS] = useState(slots)
  useEffect(() => {
    const res: { label: string; isHour: boolean }[] = []
    for (let s = 0; s < SLOTS_TOTAL; s++) {
      const totalMin = HORA_INICIO * 60 + s * 15
      const hh = Math.floor(totalMin / 60).toString().padStart(2, '0')
      const mm = (totalMin % 60).toString().padStart(2, '0')
      res.push({ label: `${hh}:${mm}`, isHour: mm === '00' })
    }
    setSLOTS(res)
  }, [HORA_INICIO, HORA_FIN, SLOTS_TOTAL])
  // ─────────────────────────────────────────────────────────────

  // Build full column list: real employees + virtual "Disponible" columns
  // If loading, show a few placeholders to maintain width
  const placeholderCols: Column[] = Array.from({ length: 5 }, (_, i) => ({
    id: `placeholder-${i}`,
    nombre: '...',
    isVirtual: true as const,
  }))

  const numIndicator = sucursal?.num_cabinas ?? 1
  const disponibleCols: DisponibleCol[] = Array.from({ length: numIndicator }, (_, i) => ({
    id: `disponible-${i + 1}`,
    nombre: `Disponible ${i + 1}`,
    isVirtual: true as const,
  }))

  const columns: Column[] = isLoading ? placeholderCols : [...empleadas, ...disponibleCols]
  const mainGridRef  = useRef<HTMLDivElement>(null)
  const timeColRef   = useRef<HTMLDivElement>(null)
  const daysHeaderRef = useRef<HTMLDivElement>(null)

  // ─── Responsive Scaling ─────────────────────────────────────
  const [slotHeight, setSlotHeight] = useState(16)
  const [colWidth, setColWidth] = useState(30)

  // ─── Tooltip State ──────────────────────────────────────────
  const [hoveredCita, setHoveredCita] = useState<Cita | null>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })


  useEffect(() => {
    const updateDimensions = () => {
      const w = window.innerWidth
      if (w >= 1600) {
        setSlotHeight(24) // Vertical focus
        setColWidth(36)   // Less wide
      } else if (w >= 1366) {
        setSlotHeight(20)
        setColWidth(32)
      } else {
        setSlotHeight(16)
        setColWidth(30)
      }
    }
    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  // Auto-scroll to "Today" if it exists in weekDates
  useEffect(() => {
    // Small timeout to ensure layout is ready
    const timer = setTimeout(() => {
      if (!mainGridRef.current) return
      const todayIndex = weekDates.findIndex(d => isToday(d))
      if (todayIndex > -1) {
        const scrollPos = todayIndex * (colWidth * columns.length)
        mainGridRef.current.scrollLeft = scrollPos
        if (daysHeaderRef.current) daysHeaderRef.current.scrollLeft = scrollPos
      }
    }, 100)
    return () => clearTimeout(timer)
  }, [weekDates, colWidth, columns.length])

  // Scroll sync: vertical → time col; horizontal → days header
  const handleScroll = useCallback(() => {
    if (!mainGridRef.current) return
    const { scrollTop, scrollLeft } = mainGridRef.current
    if (timeColRef.current)    timeColRef.current.scrollTop    = scrollTop
    if (daysHeaderRef.current) daysHeaderRef.current.scrollLeft = scrollLeft
  }, [])

  // Helper: get citas for a specific employee + date
  const getCitas = (empId: string, date: Date) => {
    const fechaStr = format(date, 'yyyy-MM-dd')
    return citas.filter((c) => 
      c.empleada_id === empId && 
      c.fecha === fechaStr
      // We don't filter by status here anymore, the UI will decide how to render based on status
    )
  }


  // Helper: get bloqueos for a specific employee + date
  const getBloqueos = (empId: string, date: Date) => {
    const fechaStr = format(date, 'yyyy-MM-dd')
    return bloqueos.filter((b) => b.empleada_id === empId && b.fecha === fechaStr)
  }

  // Si no está cargando y no hay columnas, mostrar estado vacío
  if (!isLoading && columns.length === 0) {
    return (
      <div className="empty-state">
        <p>No hay profesionales activas en esta sucursal.</p>
        <p style={{ fontSize: 11, opacity: 0.6 }}>Agrega empleadas en Profesionales y asígnales esta sucursal.</p>
      </div>
    )
  }

  return (
    <div className="agenda-grid-shell">
      {/* ── Sticky Header ──────────────────────────────────── */}
      <div className="agenda-grid-header">
        {/* Corner */}
        <div className="agenda-grid-header-corner" style={{ height: HEADER_H, width: CORNER_W }}>
          <div style={{ height: HEADER_DAY_H, display: 'flex', alignItems: 'center', padding: '0 8px', fontSize: 10, color: 'var(--text-3)', fontWeight: 600 }}>Hora</div>
        </div>

        {/* Day + employee header — synced horizontal scroll */}
        <div className="agenda-days-header" ref={daysHeaderRef}>
          {weekDates.map((date) => {
            const dayLabel = format(date, 'EEEE', { locale: es })
            const dateLabel = format(date, 'dd/MM/yyyy')
            const isHoy = isToday(date)
            return (
                  <div
                    key={dateLabel}
                    className="day-header-group"
                    style={{ width: colWidth * columns.length, flex: '0 0 auto' }}
                  >
                  <div className="day-header-label"
                    style={{
                      height: HEADER_DAY_H,
                      backgroundColor: isHoy ? 'var(--accent-light)' : undefined,
                    }}
                  >
                    <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{dayLabel}</span>
                    <span className="day-header-date">{dateLabel}</span>
                  </div>
                  <div className="day-emp-labels" style={{ height: HEADER_EMP_H }}>
                    {columns.map((col) => (
                      <div
                        key={col.id}
                        className={`emp-header-cell${isVirtual(col) ? ' emp-header-disponible' : ''}${col.id.startsWith('placeholder') ? ' is-placeholder' : ''}`}
                        style={{ width: colWidth }}
                        title={col.nombre}
                      >
                        {isVirtual(col)
                          ? col.nombre.replace('Disponible ', 'Disp ')
                          : col.nombre.substring(0, 3).toUpperCase()
                        }
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
  
        {/* ── Scrollable body ─────────────────────────────────── */}
        <div className="agenda-grid-body">
          <div className="agenda-time-col" ref={timeColRef}>
            {SLOTS.map(({ label, isHour }) => (
              <div key={label} className={`agenda-time-slot ${isHour ? 'hour-mark' : ''}`} style={{ height: slotHeight }}>
                {label}
              </div>
            ))}
          </div>
  
          {/* Main grid — scrolls both axes */}
          <div className="agenda-main-grid" ref={mainGridRef} onScroll={handleScroll}>
            <div className="agenda-days-body">
              {weekDates.map((date) => {
                const isHoy = isToday(date)
                const isPastDate = startOfDay(date).getTime() < startOfDay(new Date()).getTime()
                return (
                  <div
                    key={format(date, 'yyyy-MM-dd')}
                    className={`day-body-group ${isHoy ? 'today-col' : ''}`}
                    style={{ width: colWidth * columns.length, flex: '0 0 auto' }}
                  >
                    {columns.map((col) => {
                      const virtual = isVirtual(col)
                      // Virtual columns: no citas/bloqueos of their own
                      const empCitas    = virtual ? [] : getCitas(col.id, date)
                      const empBloqueos = virtual ? [] : getBloqueos(col.id, date)
                      return (
                        <div
                          key={col.id}
                          className={`emp-col${virtual ? ' emp-col-disponible' : ''}`}
                          style={{ width: colWidth, flex: '0 0 auto' }}
                        >
                          {/* Clickable slots */}
                          {SLOTS.map(({ label, isHour }) => (
                            <div
                              key={label}
                              className={`slot-cell ${isHour ? 'hour-mark' : ''}`}
                              style={{ 
                                height: slotHeight,
                                cursor: isPastDate ? 'default' : 'pointer',
                                backgroundColor: isPastDate ? 'var(--bg-1)' : undefined
                              }}
                              onClick={() => {
                                if (isPastDate) return
                                // For virtual cols, pass empty string so modal opens without preselected employee
                                onSlotClick(virtual ? '' : col.id, label, format(date, 'yyyy-MM-dd'))
                              }}
                            />
                          ))}

                        {/* Bloqueos */}
                        {empBloqueos.map((b) => {
                          const start = timeToSlot(b.hora_inicio)
                          const end   = timeToSlot(b.hora_fin)
                          const isComida = b.origen === 'comida'
                          return (
                            <div
                              key={b.id}
                              className={`bloqueo-block${isComida ? ' bloqueo-comida' : ''}`}
                              onClick={() => {
                                // Los bloqueos de comida no abren el modal de info
                                if (!isComida) onBloqueoClick?.(b)
                              }}
                              style={{
                                top: start * slotHeight,
                                height: (end - start) * slotHeight,
                                cursor: isComida ? 'default' : 'pointer',
                              }}
                              title={isComida ? '🍽 Empleada en comida (1h)' : b.motivo}
                            >
                              {/* Solo se ven las líneas de cancelación */}
                            </div>
                          )
                        })}

                        {/* Overlay: sin entrada hoy (solo aplica al día de hoy) */}
                        {isToday(date) && !isVirtual(col) && empleadasConEntrada && !empleadasConEntrada.has(col.id) && (
                          <div
                            style={{
                              position: 'absolute',
                              inset: 0,
                              background: 'repeating-linear-gradient(-45deg, transparent, transparent 4px, rgba(0,0,0,0.04) 4px, rgba(0,0,0,0.04) 8px)',
                              backgroundColor: 'rgba(var(--surface-rgb, 255,255,255), 0.6)',
                              pointerEvents: 'all',
                              cursor: 'not-allowed',
                              zIndex: 2,
                              display: 'flex',
                              alignItems: 'flex-start',
                              justifyContent: 'center',
                              paddingTop: 8,
                            }}
                            title="Sin registro de entrada hoy"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span style={{ fontSize: 9, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', background: 'var(--surface)', padding: '2px 4px', borderRadius: 3 }}>Sin entrada</span>
                          </div>
                        )}

                        {/* Citas */}
                        {empCitas.map((cita) => {
                          const startSlot  = timeToSlot(cita.bloque_inicio)
                          const isCancelada  = cita.estado === 'Cancelada' || cita.estado === 'No asistió'
                          
                          if (isCancelada) {
                            return (
                              <div
                                key={cita.id}
                                className="cita-dot"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onCitaClick(cita);
                                }}
                                onMouseEnter={(e) => {
                                  setHoveredCita(cita)
                                  setMousePos({ x: e.clientX, y: e.clientY })
                                }}
                                onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
                                onMouseLeave={() => setHoveredCita(null)}
                                style={{
                                  top: startSlot * slotHeight + (slotHeight / 2) - 4,
                                  left: 2,
                                }}
                              />

                            )
                          }

                          const totalSlots = (cita.duracion_manual_slots ?? (cita.servicios ?? []).reduce(
                            (sum: number, s: any) => sum + s.duracion_slots, 0
                          )) || 4
                          const isFinalizada = cita.estado === 'Finalizada'
                          const bgColor     = 'var(--accent)'
                          const borderColor = 'var(--accent)'

                          return (
                            <div
                              key={cita.id}
                              className="cita-block"
                              onClick={() => onCitaClick(cita)}
                              onMouseEnter={(e) => {
                                setHoveredCita(cita)
                                setMousePos({ x: e.clientX, y: e.clientY })
                              }}
                              onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
                              onMouseLeave={() => setHoveredCita(null)}
                              style={{
                                top: startSlot * slotHeight,
                                height: Math.max(totalSlots * slotHeight, 24),
                                backgroundColor: bgColor,
                                border: `1px solid ${borderColor}`,
                                borderRadius: '4px',
                                opacity: 1,
                              }}
                            >

                                <div className="cita-block-inner">
                                  {isFinalizada && (
                                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 2 }}>
                                      <CheckCircle2 size={12} className="cita-check" color="#ffffff" />
                                    </div>
                                  )}
                                  {cita.reagendada_por && (
                                    <div style={{ 
                                      position: 'absolute', 
                                      bottom: 4, 
                                      right: 4, 
                                      background: 'rgba(255,255,255,0.2)', 
                                      borderRadius: '50%', 
                                      width: 14, 
                                      height: 14, 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      justifyContent: 'center' 
                                    }}>
                                      <Move size={8} color="#ffffff" />
                                    </div>
                                  )}
                                </div>
                              </div>
                          )
                        })}

                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Custom Tooltip ──────────────────────────────────── */}
      {hoveredCita && (
        <div 
          className="agenda-tooltip"
          style={{ 
            left: mousePos.x + 15, 
            top: mousePos.y + 15,
            visibility: mousePos.x === 0 ? 'hidden' : 'visible'
          }}
        >
          {hoveredCita.estado === 'Cancelada' || hoveredCita.estado === 'No asistió' ? (
            <div className="tooltip-cancel">
              <div className="tooltip-header cancel">
                <CalendarX size={16} />
                <span>Visita no asistida</span>
              </div>
              <div className="tooltip-body">
                <p>Cancelada por <b>Recepción</b> el {format(new Date(hoveredCita.fecha), 'dd/MM/yyyy')} a las {hoveredCita.bloque_inicio}</p>
              </div>
            </div>
          ) : (
            <div className="tooltip-active">
              <div className="tooltip-row">
                <User size={16} />
                <div className="tooltip-text">
                  <span className="tooltip-main">{hoveredCita.cliente?.nombre_completo} ({hoveredCita.cliente?.num_cliente})</span>
                  <span className="tooltip-sub"><Phone size={10} /> {hoveredCita.cliente?.telefono_cel || 'Sin teléfono'}</span>
                </div>
              </div>
              <div className="tooltip-divider" />
              <div className="tooltip-row">
                <ClipboardList size={16} />
                <div className="tooltip-text">
                  <span className="tooltip-main color-accent">{(hoveredCita.servicios ?? []).map(s => s.nombre).join(', ')}</span>
                  {hoveredCita.comentarios && <span className="tooltip-sub italic">{hoveredCita.comentarios}</span>}
                </div>
              </div>
              <div className="tooltip-divider" />
              <div className="tooltip-row">
                <User size={16} className="color-prof" />
                <div className="tooltip-text">
                  <span className="tooltip-sub">Profesional: <b>{hoveredCita.empleada?.nombre}</b></span>
                </div>
              </div>

              {hoveredCita.reagendada_por && (
                <>
                  <div className="tooltip-divider" style={{ borderTop: '1px dashed var(--accent)', opacity: 0.3 }} />
                  <div className="tooltip-move">
                    <div className="tooltip-header move" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#7c3aed', fontSize: 13, marginBottom: 4 }}>
                      <Move size={14} />
                      <span style={{ fontWeight: 600 }}>Visita desplazada</span>
                    </div>
                    <div className="tooltip-body" style={{ fontSize: 12, color: 'var(--text-2)' }}>
                      <p style={{ margin: 0 }}>Movida por <b>{hoveredCita.reagendada_por}</b> el {new Date(hoveredCita.reagendada_fecha!).toLocaleDateString('es-ES')} a las {new Date(hoveredCita.reagendada_fecha!).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

