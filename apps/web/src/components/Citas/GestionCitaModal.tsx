import { useState, useMemo } from 'react'
import { X, Check, Trash2, Search, Calendar, Clock, MapPin, Phone, MessageCircle, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react'
import { startOfDay, parseISO } from 'date-fns'
import { useActualizarCita, useCheckDisponibilidad } from '../../hooks/useCitas'
import { useServicios } from '../../hooks/useServicios'
import { useTodasEmpleadas } from '../../hooks/useEmpleadas'
import type { Cita, CitaStatus, Servicio } from '../../types/database'
import { timeToSlots, haySolapamiento } from '../../utils/agenda'
import { useToast } from '../Common/Toast'

import DatePicker from '../Common/DatePicker'

interface Props {
  cita: Cita
  onClose: () => void
  onValidar?: () => void
}


export default function GestionCitaModal({ cita, onClose, onValidar }: Props) {

  const actualizar = useActualizarCita()
  const toast = useToast()
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
  const [showNotesModal, setShowNotesModal] = useState(false)
  const [statusConfirm, setStatusConfirm] = useState<CitaStatus | null>(null)

  const isValidated = cita.estado === 'Finalizada' || !!cita.ticket_id
  const isCancelled = cita.estado === 'Cancelada' || cita.estado === 'No asistió'
  const isPastDate = startOfDay(parseISO(cita.fecha)).getTime() < startOfDay(new Date()).getTime()
  const isLocked = isPastDate || isValidated || isCancelled

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
      toast(e.message || 'Error al actualizar la cita. Es posible que el horario ya esté ocupado.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleStatus = (estado: CitaStatus) => {
    setStatusConfirm(estado)
  }

  const confirmStatusChange = () => {
    if (statusConfirm) {
      handleUpdate({ estado: statusConfirm })
      setStatusConfirm(null)
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
                      disabled={isLocked}
                      style={{ cursor: isLocked ? 'default' : 'pointer' }}
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
                disabled={isLocked} 
                style={{ 
                  cursor: isLocked ? 'default' : 'pointer',
                  color: isReagendar ? 'var(--accent)' : 'inherit',
                  borderColor: isReagendar ? 'var(--accent)' : 'transparent',
                  opacity: isLocked ? 0.6 : 1
                }}
                onClick={() => setIsReagendar(!isReagendar)}
              >
                <Calendar size={15} /> Reagendar
              </button>
              <button 
                className="btn-action-gray" 
                onClick={() => handleStatus('Cancelada')}
                style={{ color: isLocked ? 'var(--text-3)' : 'var(--danger)', cursor: isLocked ? 'default' : 'pointer', opacity: isLocked ? 0.6 : 1 }}
                disabled={isLocked}
              >
                <Trash2 size={15} /> Cancelar
              </button>
              <button 
                className="btn-action-gray" 
                onClick={() => handleStatus('No asistió')} 
                disabled={isLocked} 
                style={{ cursor: isLocked ? 'default' : 'pointer', opacity: isLocked ? 0.6 : 1 }}
              >
                No asistió
              </button>
              <button 
                className="btn-action-gray" 
                onClick={() => !isLocked && setShowNotesModal(true)} 
                disabled={isLocked} 
                style={{ cursor: isLocked ? 'default' : 'pointer', opacity: isLocked ? 0.6 : 1 }}
              >
                <MessageSquare size={15} /> Notas
              </button>
              
              {(() => {
                const yaValidada = cita.estado === 'Finalizada' || !!cita.ticket_id
                return (
                  <button
                    className={`btn-action-validate ${yaValidada ? 'validated' : ''}`}
                    onClick={() => {
                      if (yaValidada) return
                      onValidar ? onValidar() : handleStatus('Finalizada')
                    }}
                    disabled={saving || isLocked || yaValidada}
                    style={{
                      cursor: yaValidada ? 'default' : (isLocked ? 'default' : (saving ? 'wait' : 'pointer')),
                      opacity: yaValidada ? 0.75 : 1
                    }}
                    title={yaValidada ? 'Esta cita ya fue validada y tiene un ticket generado' : 'Validar cita y generar ticket'}
                  >
                    <Check size={18} /> {yaValidada ? 'Ya validada' : 'Validar Cita'}
                  </button>
                )
              })()}

            </div>
          </div>

          {/* RIGHT: EDITING */}
          <div className="modal-side-selection">
            <div className="selection-search-wrap">
              <div style={{ position: 'relative', width: '100%' }}>
                <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
                <input 
                  type="text"
                  placeholder="Buscar servicio..."
                  className="selection-search-input"
                  style={{ paddingLeft: 38, cursor: isLocked ? 'default' : 'text' }}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  disabled={isLocked}
                />
              </div>
            </div>

            <div className="selection-services-list">
              <div style={{ padding: '0 20px 15px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', minWidth: 80 }}>Profesional:</span>
                <div 
                  onClick={() => !isLocked && setIsReagendar(true)}
                  style={{ 
                    fontSize: 13, flex: 1, height: 36, padding: '0 12px', 
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: 'var(--surface-2)', border: '1px solid var(--border)',
                    borderRadius: 8, cursor: isLocked ? 'default' : 'pointer',
                    color: empleadaId ? 'var(--text-1)' : 'var(--text-3)',
                    opacity: isLocked ? 0.7 : 1
                  }}
                >
                  {empleadas.find(e => e.id === empleadaId)?.nombre || 'Elegir profesional...'}
                  {!isLocked && <ChevronRight size={14} />}
                </div>
              </div>

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
                          style={{ padding: '10px 14px', cursor: isLocked ? 'default' : 'pointer' }}
                          disabled={isLocked}
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
                        style={{ padding: 2, cursor: (isLocked || isValidated) ? 'default' : 'pointer' }}
                        onClick={() => setManualSlots(Math.max(1, (manualSlots ?? autoSlots) - 1))}
                        disabled={isLocked || isValidated}
                      >
                        <ChevronLeft size={16} color={(isLocked || isValidated) ? 'var(--text-3)' : 'var(--accent)'} />
                      </button>
                      <span style={{ fontSize: 15, fontWeight: 700, minWidth: 20, textAlign: 'center', color: (isLocked || isValidated) ? 'var(--text-3)' : 'inherit' }}>
                        {manualSlots ?? autoSlots}
                      </span>
                      <button 
                        type="button" 
                        className="btn-ghost" 
                        style={{ padding: 2, cursor: (isLocked || isValidated) ? 'pointer' : 'pointer' }}
                        onClick={() => setManualSlots((manualSlots ?? autoSlots) + 1)}
                        disabled={isLocked || isValidated}
                      >
                        <ChevronRight size={16} color={(isLocked || isValidated) ? 'var(--text-3)' : 'var(--accent)'} />
                      </button>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: isPastDate ? 'var(--text-3)' : 'inherit' }}>
                    <span style={{ color: 'var(--text-3)' }}>Duración:</span> <b>{totalMin} min</b>
                  </div>
                  {manualSlots !== null && (
                     <button 
                       onClick={() => setManualSlots(null)} 
                       style={{ fontSize: 10, color: isLocked ? 'var(--text-3)' : 'var(--accent)', background: 'none', border: 'none', padding: 0, cursor: isLocked ? 'default' : 'pointer' }}
                       disabled={isLocked}
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
                  {!isValidated && (
                    <button 
                      type="button" 
                      onClick={() => handleUpdate()} 
                      disabled={saving || !selected.length || !empleadaId || isLocked || hasOverlap} 
                      className="btn-primary"
                      style={{ cursor: isLocked ? 'default' : (saving ? 'wait' : 'pointer') }}
                    >
                      {saving ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* SUB-MODAL: NOTAS */}
      {showNotesModal && (
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.4)',
          borderRadius: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          backdropFilter: 'blur(2px)'
        }} onClick={() => setShowNotesModal(false)}>
          <div style={{
            background: 'var(--surface)',
            width: '90%',
            maxWidth: 400,
            borderRadius: 20,
            padding: 24,
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            border: '1px solid var(--border)'
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <MessageSquare size={18} color="var(--accent)" /> Notas de la cita
            </h3>
            <textarea
              autoFocus
              value={comentarios}
              onChange={e => setComentarios(e.target.value)}
              placeholder="Escribe aquí notas internas, alergias o detalles sobre el servicio..."
              style={{
                width: '100%',
                height: 150,
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: 12,
                fontSize: 13,
                resize: 'none',
                outline: 'none',
                color: 'var(--text-1)',
                marginBottom: 20
              }}
            />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setShowNotesModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={() => setShowNotesModal(false)}>Aceptar</button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-MODAL: REAGENDAR */}
      {isReagendar && (
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.4)',
          borderRadius: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 101,
          backdropFilter: 'blur(2px)'
        }} onClick={() => setIsReagendar(false)}>
          <div style={{
            background: 'var(--surface)',
            width: '90%',
            maxWidth: 450,
            borderRadius: 20,
            padding: 24,
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            border: '1px solid var(--border)'
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Calendar size={18} color="var(--accent)" /> Reagendar Cita
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <DatePicker 
                    label="Nueva Fecha"
                    value={newFecha}
                    onChange={setNewFecha}
                  />
                </div>
                <div className="outlined-group" style={{ flex: 1 }}>
                  <label>Nueva Hora</label>
                  <select 
                    className="outlined-select"
                    value={newHora}
                    onChange={e => setNewHora(e.target.value)}
                    style={{ height: 40 }}
                  >
                    {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>Profesional</label>
                <select 
                  className="form-input" 
                  style={{ height: 42, fontSize: 14 }}
                  value={empleadaId || ''} 
                  onChange={e => setEmpleadaId(e.target.value)}
                >
                  <option value="">Elegir profesional...</option>
                  {empleadas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                </select>
              </div>

              {hasOverlap && (
                <div style={{ 
                  background: 'var(--danger-bg)', 
                  color: 'var(--danger)', 
                  padding: '10px 12px', 
                  borderRadius: 8, 
                  fontSize: 12, 
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <X size={14} /> La profesional ya tiene una cita en ese horario.
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setIsReagendar(false)}>Cancelar</button>
              <button 
                className="btn-primary" 
                onClick={() => setIsReagendar(false)}
                disabled={hasOverlap || !empleadaId}
              >
                Actualizar Horario
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-MODAL: CONFIRMACIÓN DE ESTADO */}
      {statusConfirm && (
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.4)',
          borderRadius: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 102,
          backdropFilter: 'blur(2px)'
        }} onClick={() => setStatusConfirm(null)}>
          <div style={{
            background: 'var(--surface)',
            width: '90%',
            maxWidth: 360,
            borderRadius: 20,
            padding: 30,
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            border: '1px solid var(--border)',
            textAlign: 'center'
          }} onClick={e => e.stopPropagation()}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%', 
              background: statusConfirm === 'Cancelada' ? 'var(--danger-bg)' : 'var(--accent-light)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px'
            }}>
              {statusConfirm === 'Cancelada' ? <Trash2 size={28} color="var(--danger)" /> : <Clock size={28} color="var(--accent)" />}
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>¿Confirmar cambio?</h3>
            <p style={{ fontSize: 14, color: 'var(--text-3)', lineHeight: '1.5', marginBottom: 24 }}>
              Estás a punto de marcar esta cita como <strong style={{ color: 'var(--text-1)' }}>{statusConfirm}</strong>. <br/>¿Deseas continuar?
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button 
                className="btn-primary" 
                style={{ background: statusConfirm === 'Cancelada' ? 'var(--danger)' : 'var(--accent)', width: '100%', padding: '12px' }}
                onClick={confirmStatusChange}
              >
                Sí, cambiar estado
              </button>
              <button className="btn-secondary" style={{ width: '100%', padding: '12px' }} onClick={() => setStatusConfirm(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
