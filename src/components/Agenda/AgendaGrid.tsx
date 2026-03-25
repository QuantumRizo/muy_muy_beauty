import { useRef, useCallback, useState, useEffect } from 'react'
import { format, isToday } from 'date-fns'
import { es } from 'date-fns/locale'
import { CheckCircle2 } from 'lucide-react'
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
      c.fecha === fechaStr && 
      c.estado !== 'Cancelada' && 
      c.estado !== 'No asistió'
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
                      >
                        {emp.nombre_corto || emp.nombre.substring(0, 3)}
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
                              style={{ height: slotHeight }}
                              onClick={() => onSlotClick(emp.id, label, format(date, 'yyyy-MM-dd'))}
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
                          const totalSlots = (cita.duracion_manual_slots ?? (cita.servicios ?? []).reduce(
                            (sum, s) => sum + s.duracion_slots, 0
                          )) || 4
                          const startSlot  = timeToSlot(cita.bloque_inicio)
                          const isFinalizada = cita.estado === 'Finalizada'
                          const isCancelada  = cita.estado === 'Cancelada' || cita.estado === 'No asistió'
                          const bgColor     = isCancelada ? '#fef2f2' : 'var(--accent)'
                          const borderColor = isCancelada ? '#dc2626' : 'var(--accent)'

                          return (
                            <div
                              key={cita.id}
                              className="cita-block"
                              onClick={() => onCitaClick(cita)}
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
    </div>
  )
}
