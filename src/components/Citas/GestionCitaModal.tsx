import { useState, useMemo } from 'react'
import { X, Check, Trash2, Search, Calendar, Clock, MapPin, Phone, MessageCircle, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react'
import { startOfDay, parseISO } from 'date-fns'
import { useActualizarCita, useCheckDisponibilidad } from '../../hooks/useCitas'
import { useServicios } from '../../hooks/useServicios'
import { useTodasEmpleadas } from '../../hooks/useEmpleadas'
import type { Cita, CitaStatus, Servicio } from '../../types/database'
import { timeToSlots, haySolapamiento } from '../../utils/agenda'

import DatePicker from '../Common/DatePicker'

interface Props {
  cita: Cita
  onClose: () => void
  onValidar?: () => void
}


export default function GestionCitaModal({ cita, onClose, onValidar }: Props) {

  const actualizar = useActualizarCita()
  const { data: servicios = [] } = useServicios()
  const { data: empleadas = [] } = useTodasEmpleadas()
  
  const [selected, setSelected] = useState<string[]>((cita.servicios ?? []).map(s => s.id))
  const [search, setSearch] = useState('')
  const [comentarios, setComentarios] = useState(cita.comentarios || '')
  const [empleadaId, setEmpleadaId] = useState(cita.empleada_id || '')
  const [saving, setSaving] = useState(false)
  
  // Reagendar state
  const [isReagendar, setIsReagendar] = useState(false)
  const [newFecha, setNewFecha] = useState(cita.fecha)
  const [newHora, setNewHora] = useState(cita.bloque_inicio.substring(0, 5))
  
  // Modules management
  const [manualSlots, setManualSlots] = useState<number | null>(cita.duracion_manual_slots)

  const isPastDate = startOfDay(parseISO(cita.fecha)).getTime() < startOfDay(new Date()).getTime()

  const toggleServicio = (id: string) =>
    setSelected((prev: string[]) => (prev.includes(id) ? prev.filter((x: string) => x !== id) : [...prev, id]))

  const serviciosSeleccionados = useMemo(() => 
    servicios.filter((s: Servicio) => selected.includes(s.id)),
  [servicios, selected])

  const autoSlots = serviciosSeleccionados.reduce((sum: number, s: Servicio) => sum + s.duracion_slots, 0)
  const effectiveSlots = manualSlots ?? autoSlots
  const totalMin = effectiveSlots * 15

  // Check availability
  const checkFecha = isReagendar ? newFecha : cita.fecha
  const { data: ocupacion = [] } = useCheckDisponibilidad(checkFecha, empleadaId, cita.id)
  
  const hasOverlap = useMemo(() => {
    if (!empleadaId) return false
    const start = timeToSlots(isReagendar ? newHora : cita.bloque_inicio)
    const end = start + effectiveSlots
    return ocupacion.some(slot => haySolapamiento({ start, end }, slot))
  }, [ocupacion, isReagendar, newHora, cita.bloque_inicio, effectiveSlots, empleadaId])

  const filteredServices = useMemo(() => {
    const s = search.toLowerCase().trim()
    if (!s) return servicios
    return servicios.filter(item => 
      item.nombre.toLowerCase().includes(s) || 
      item.familia?.toLowerCase().includes(s)
    )
  }, [servicios, search])

  const groups = useMemo(() => {
    return filteredServices.reduce<Record<string, Servicio[]>>((acc, s: Servicio) => {
      const fam = s.familia ?? 'Otros'
      acc[fam] = acc[fam] ? [...acc[fam], s] : [s]
      return acc
    }, {})
  }, [filteredServices])

  const timeOptions = useMemo(() => {
    const times = []
    for (let h = 8; h <= 21; h++) {
      for (let m = 0; m < 60; m += 15) {
        const hh = h.toString().padStart(2, '0')
        const mm = m.toString().padStart(2, '0')
        times.push(`${hh}:${mm}`)
      }
    }
    return times
  }, [])

  const handleUpdate = async (extraUpdates: any = {}) => {
    if (!empleadaId) return
    setSaving(true)
      const isDateChanged = newFecha !== cita.fecha
      const isTimeChanged = (newHora + ':00') !== cita.bloque_inicio
      const isRescheduled = isReagendar && (isDateChanged || isTimeChanged)

    try {
      await actualizar.mutateAsync({
        id: cita.id,
        updates: {
          empleada_id: empleadaId,
          comentarios: comentarios || null,
          duracion_manual_slots: effectiveSlots,
          fecha: isReagendar ? newFecha : cita.fecha,
          bloque_inicio: isReagendar ? newHora + ':00' : cita.bloque_inicio,
          ...(isRescheduled ? {
            reagendada_por: 'Recepción', // Placeholder for future account system
            reagendada_fecha: new Date().toISOString()
          } : {}),
          ...extraUpdates
        },
        servicioIds: selected
      })
      onClose()
    } catch (e: any) {
      alert(e.message || 'Error al actualizar la cita. Es posible que el horario ya esté ocupado.')
    } finally {
      setSaving(false)
    }
  }

  const handleStatus = (estado: CitaStatus) => {
    if (confirm(`¿Cambiar estado a ${estado}?`)) {
      handleUpdate({ estado })
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box modal-lg-split" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Gestión de Cita</h2>
          <button onClick={onClose} className="btn-ghost" style={{ padding: 4 }}><X size={20} /></button>
        </div>

        <div className="modal-split-body" style={{ height: 600 }}>
          {/* LEFT: CART & ACTIONS */}
          <div className="modal-side-cart" style={{ width: 340 }}>
            <div className="cart-header">
              <div className="cart-client-name">{cita.cliente?.nombre_completo || '—'}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="cart-client-phone">
                  <Phone size={13} /> {cita.cliente?.telefono_cel || 'Sin tel'}
                </div>
                {cita.cliente?.telefono_cel && (
                  <a 
                    href={`https://wa.me/52${cita.cliente.telefono_cel}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn-whatsapp"
                  >
                    <MessageCircle size={12} /> WhatsApp
                  </a>
                )}
              </div>
            </div>

            <div style={{ padding: '12px 20px', fontSize: 11, color: 'var(--text-2)', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Calendar size={13} color="var(--text-3)" /> <span>{cita.fecha}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={13} color="var(--text-3)" /> <span>{cita.bloque_inicio}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <MapPin size={13} color="var(--text-3)" /> <span>{cita.sucursal?.nombre || 'Sucursal'}</span>
              </div>
            </div>

            <div className="cart-items-list">
              {serviciosSeleccionados.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-3)', fontSize: 11, marginTop: 40 }}>
                  No hay servicios seleccionados
                </div>
              ) : (
                serviciosSeleccionados.map((s: Servicio) => (
                  <div key={s.id} className="cart-item">
                    <div className="cart-item-info">
                      <div className="cart-item-name">{s.nombre}</div>
                      <div className="cart-item-meta">{s.duracion_slots * 15} min · ${s.precio}</div>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => toggleServicio(s.id)} 
                      className="cart-item-remove"
                      disabled={isPastDate}
                      style={{ cursor: isPastDate ? 'default' : 'pointer' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Quick Actions Grid */}
            <div className="action-grid">
              <button 
                className={`btn-action-gray ${isReagendar ? 'active' : ''}`}
                title="Reagendar cita" 
                disabled={isPastDate} 
                style={{ 
                  cursor: isPastDate ? 'default' : 'pointer',
                  color: isReagendar ? 'var(--accent)' : 'inherit',
                  borderColor: isReagendar ? 'var(--accent)' : 'transparent'
                }}
                onClick={() => setIsReagendar(!isReagendar)}
              >
                <Calendar size={15} /> Reagendar
              </button>
              <button 
                className="btn-action-gray" 
                onClick={() => handleStatus('Cancelada')}
                style={{ color: isPastDate ? 'var(--text-3)' : 'var(--danger)', cursor: isPastDate ? 'default' : 'pointer' }}
                disabled={isPastDate}
              >
                <Trash2 size={15} /> Cancelar
              </button>
              <button className="btn-action-gray" onClick={() => handleStatus('No asistió')} disabled={isPastDate} style={{ cursor: isPastDate ? 'default' : 'pointer' }}>No asistió</button>
              <button className="btn-action-gray" onClick={() => {
                const note = prompt('Añadir/Editar comentario:', comentarios)
                if (note !== null) setComentarios(note)
              }} disabled={isPastDate} style={{ cursor: isPastDate ? 'default' : 'pointer' }}>
                <MessageSquare size={15} /> Notas
              </button>
              
              <button 
                className={`btn-action-validate ${cita.estado === 'Finalizada' ? 'validated' : ''}`}
                onClick={() => onValidar ? onValidar() : handleStatus('Finalizada')}
                disabled={saving || isPastDate}
                style={{ cursor: isPastDate ? 'default' : (saving ? 'wait' : 'pointer') }}
              >
                <Check size={18} /> {cita.estado === 'Finalizada' ? 'Cita Validada' : 'Validar Cita'}
              </button>

            </div>
          </div>

          {/* RIGHT: EDITING */}
          <div className="modal-side-selection">
            <div className="selection-search-wrap">
              {isReagendar ? (
                <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <DatePicker 
                      label="Nueva Fecha"
                      value={newFecha}
                      onChange={setNewFecha}
                    />
                    <div className="outlined-group">
                      <label>Nueva Hora</label>
                      <select 
                        className="outlined-select"
                        value={newHora}
                        onChange={e => setNewHora(e.target.value)}
                      >
                        {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600 }}>
                      * El cambio se aplicará al guardar todos los cambios.
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setIsReagendar(false)}
                      style={{ fontSize: 11, background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Cancelar Reagendada / Volver
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ position: 'relative', width: '100%' }}>
                  <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
                  <input 
                    type="text"
                    placeholder="Buscar servicio..."
                    className="selection-search-input"
                    style={{ paddingLeft: 38, cursor: isPastDate ? 'default' : 'text' }}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    disabled={isPastDate}
                  />
                </div>
              )}
            </div>

            <div style={{ padding: '0 20px 15px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', minWidth: 80 }}>Profesional:</span>
              <select 
                className="form-input" 
                style={{ fontSize: 13, flex: 1, height: 36, padding: '0 12px', cursor: isPastDate ? 'default' : 'pointer' }}
                value={empleadaId || ''} 
                onChange={e => setEmpleadaId(e.target.value)}
                disabled={isPastDate}
              >
                <option value="">Elegir profesional...</option>
                {empleadas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
              </select>
            </div>

            <div className="selection-services-list">
              {Object.entries(groups).map(([familia, items]: [string, Servicio[]]) => (
                <div key={familia} style={{ marginBottom: 20 }}>
                  <div className="servicio-familia" style={{ marginBottom: 8 }}>{familia}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {items.map((s: Servicio) => {
                      const isAdded = selected.includes(s.id)
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => toggleServicio(s.id)}
                          className={`servicio-btn ${isAdded ? 'active' : ''}`}
                          style={{ padding: '10px 14px', cursor: isPastDate ? 'default' : 'pointer' }}
                          disabled={isPastDate}
                        >
                          <div className="servicio-btn-inner">
                            <span style={{ fontSize: 13 }}>{s.nombre}</span>
                            <span className="servicio-precio" style={{ fontWeight: 600 }}>${s.precio}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span className="servicio-dur">{s.duracion_slots * 15} min</span>
                            {isAdded && <Check size={14} className="servicio-check" style={{ position: 'static', transform: 'none' }} />}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-summary-footer" style={{ borderTop: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-3)' }}>Módulos:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <button 
                        type="button" 
                        className="btn-ghost" 
                        style={{ padding: 2, cursor: isPastDate ? 'default' : 'pointer' }}
                        onClick={() => setManualSlots(Math.max(1, (manualSlots ?? autoSlots) - 1))}
                        disabled={isPastDate}
                      >
                        <ChevronLeft size={16} color={isPastDate ? 'var(--text-3)' : 'var(--accent)'} />
                      </button>
                      <span style={{ fontSize: 15, fontWeight: 700, minWidth: 20, textAlign: 'center', color: isPastDate ? 'var(--text-3)' : 'inherit' }}>
                        {manualSlots ?? autoSlots}
                      </span>
                      <button 
                        type="button" 
                        className="btn-ghost" 
                        style={{ padding: 2, cursor: isPastDate ? 'default' : 'pointer' }}
                        onClick={() => setManualSlots((manualSlots ?? autoSlots) + 1)}
                        disabled={isPastDate}
                      >
                        <ChevronRight size={16} color={isPastDate ? 'var(--text-3)' : 'var(--accent)'} />
                      </button>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: isPastDate ? 'var(--text-3)' : 'inherit' }}>
                    <span style={{ color: 'var(--text-3)' }}>Duración:</span> <b>{totalMin} min</b>
                  </div>
                  {manualSlots !== null && (
                     <button 
                       onClick={() => setManualSlots(null)} 
                       style={{ fontSize: 10, color: isPastDate ? 'var(--text-3)' : 'var(--accent)', background: 'none', border: 'none', padding: 0, cursor: isPastDate ? 'default' : 'pointer' }}
                       disabled={isPastDate}
                     >
                       Restablecer
                     </button>
                   )}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {hasOverlap && (
                    <div style={{ color: 'var(--danger)', fontSize: 11, fontWeight: 700, marginRight: 10 }}> Profesional ocupada</div>
                  )}
                  <button type="button" onClick={onClose} className="btn-ghost" style={{ cursor: 'pointer' }}>Salir</button>
                  <button 
                    type="button" 
                    onClick={() => handleUpdate()} 
                    disabled={saving || !selected.length || !empleadaId || isPastDate || hasOverlap} 
                    className="btn-primary"
                    style={{ cursor: isPastDate ? 'default' : (saving ? 'wait' : 'pointer') }}
                  >
                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
