import { useRef, useCallback, useState, useEffect } from 'react'
import { format, isToday, startOfDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { CheckCircle2, User, Phone, ClipboardList, CalendarX } from 'lucide-react'

import type { Cita, BloqueoAgenda, Empleada } from '../../types/database'

// ─── Constants (Base) ──────────────────────────────────────────
const HORA_INICIO  = 8        // 08:00
const HORA_FIN     = 21       // 21:00
const SLOTS_TOTAL  = (HORA_FIN - HORA_INICIO) * 4  // 52 slots
// These will be dynamic now
// const slotHeight  = 16       
// const colWidth    = 30       
const HEADER_DAY_H = 44       
const HEADER_EMP_H = 26       
const HEADER_H     = HEADER_DAY_H + HEADER_EMP_H
const CORNER_W     = 55       


function timeToSlot(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return (h - HORA_INICIO) * 4 + Math.floor(m / 15)
}

function generateSlots() {
  const slots: { label: string; isHour: boolean }[] = []
  for (let s = 0; s < SLOTS_TOTAL; s++) {
    const totalMin = HORA_INICIO * 60 + s * 15
    const hh = Math.floor(totalMin / 60).toString().padStart(2, '0')
    const mm = (totalMin % 60).toString().padStart(2, '0')
    slots.push({ label: `${hh}:${mm}`, isHour: mm === '00' })
  }
  return slots
}

const SLOTS = generateSlots()

// Single color for all citas
// (Removing unused constants)

interface Props {
  weekDates: Date[]          // 7 Date objects, Mon–Sun
  empleadas: Empleada[]
  citas: Cita[]
  bloqueos: BloqueoAgenda[]
  onSlotClick: (empleadaId: string, hora: string, fecha: string) => void
  onCitaClick: (cita: Cita) => void
  onBloqueoClick?: (bloqueo: BloqueoAgenda) => void
}

export default function AgendaGrid({
  weekDates, empleadas, citas, bloqueos,
  onSlotClick, onCitaClick, onBloqueoClick,
}: Props) {
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
        const scrollPos = todayIndex * (colWidth * empleadas.length)
        mainGridRef.current.scrollLeft = scrollPos
        if (daysHeaderRef.current) daysHeaderRef.current.scrollLeft = scrollPos
      }
    }, 100)
    return () => clearTimeout(timer)
  }, [weekDates, colWidth, empleadas.length])

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

  if (empleadas.length === 0) {
    return (
      <div className="empty-state">
        <p>No hay profesionales activas.</p>
        <p style={{ fontSize: 11, opacity: 0.6 }}>Agrega empleadas en Configuración.</p>
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
                    style={{ width: colWidth * empleadas.length, flex: '0 0 auto' }}
                  >
                  <div
                    className="day-header-label"
                    style={{
                      height: HEADER_DAY_H,
                      backgroundColor: isHoy ? 'var(--accent-light)' : undefined,
                    }}
                  >
                    <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{dayLabel}</span>
                    <span className="day-header-date">{dateLabel}</span>
                  </div>
                  <div className="day-emp-labels" style={{ height: HEADER_EMP_H }}>
                    {empleadas.map((emp) => (
                      <div
                        key={emp.id}
                        className="emp-header-cell"
                        style={{ width: colWidth }}
                        title={emp.nombre}
                      >
                        {emp.nombre.substring(0, 3).toUpperCase()}


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
                    style={{ width: colWidth * empleadas.length, flex: '0 0 auto' }}
                  >
                    {empleadas.map((emp) => {
                      const empCitas    = getCitas(emp.id, date)
                      const empBloqueos = getBloqueos(emp.id, date)
                      return (
                        <div
                          key={emp.id}
                          className="emp-col"
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
                                onSlotClick(emp.id, label, format(date, 'yyyy-MM-dd'))
                              }}
                            />
                          ))}

                        {/* Bloqueos */}
                        {empBloqueos.map((b) => {
                          const start = timeToSlot(b.hora_inicio)
                          const end   = timeToSlot(b.hora_fin)
                          return (
                            <div
                              key={b.id}
                              className="bloqueo-block"
                              onClick={() => onBloqueoClick?.(b)}
                              style={{
                                top: start * slotHeight,
                                height: (end - start) * slotHeight,
                              }}
                            >
                              {/* Solo se ven las líneas de cancelación */}
                            </div>
                          )
                        })}

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
            </div>
          )}
        </div>
      )}
    </div>
  )
}

