import { useState, useMemo, useEffect } from 'react'
import { X, Check, Search, User, ArrowLeft, Plus, Trash2 } from 'lucide-react'

import { useEmpleadas } from '../hooks/useEmpleadas'
import { useServicios } from '../hooks/useServicios'
import { useCitasCliente } from '../hooks/useCitas'
import type { Cita, Servicio, Empleada } from '../types/database'

// Extend Servicio locally to carry the assigned professional
interface ServicioConProfesional extends Servicio {
  profesional_id?: string
}

interface Props {
  cita: Cita
  onBack: () => void
  onNext: (updatedCita: Cita) => void
}

export default function ValidacionPage({ cita, onBack, onNext }: Props) {
  const { data: empleadas = [] } = useEmpleadas()
  const { data: servicios = [] } = useServicios()
  const { data: historial = [] } = useCitasCliente(cita.cliente_id)

  const [activeTab, setActiveTab] = useState<'actual' | 'historial'>('actual')

  // Init services with default professional = cita's professional
  const [selectedServicios, setSelectedServicios] = useState<ServicioConProfesional[]>(() =>
    (cita.servicios || []).map(s => ({
      ...s,
      profesional_id: cita.empleada_id || (empleadas[0]?.id ?? '')
    }))
  )
  const [comentarios, setComentarios] = useState(cita.comentarios || '')
  const [showAddService, setShowAddService] = useState(false)
  const [search, setSearch] = useState('')

  // Horas inicio/fin
  const [horaInicio, setHoraInicio] = useState(cita.bloque_inicio?.substring(0, 5) || '09:00')
  const [horaFin, setHoraFin] = useState(() => {
    if (cita.bloque_inicio) {
      const totalSlots = (cita.duracion_manual_slots ?? (cita.servicios ?? []).reduce(
        (sum, s) => sum + (s.duracion_slots || 0), 0
      )) || 4
      const [h, m] = cita.bloque_inicio.split(':').map(Number)
      const totalMin = h * 60 + m + totalSlots * 15
      const hh = Math.floor(totalMin / 60).toString().padStart(2, '0')
      const mm = (totalMin % 60).toString().padStart(2, '0')
      return `${hh}:${mm}`
    }
    return '10:00'
  })

  // Auto-recalculate horaFin when services or horaInicio change
  useEffect(() => {
    const totalSlots = selectedServicios.reduce((sum, s) => sum + (s.duracion_slots || 0), 0) || 4
    const [h, m] = horaInicio.split(':').map(Number)
    const totalMin = h * 60 + m + totalSlots * 15
    const hh = Math.floor(totalMin / 60).toString().padStart(2, '0')
    const mm = (totalMin % 60).toString().padStart(2, '0')
    setHoraFin(`${hh}:${mm}`)
  }, [selectedServicios, horaInicio])

  // When empleadas load, fill empty profesional_id
  useEffect(() => {
    if (empleadas.length > 0) {
      setSelectedServicios(prev => prev.map(s => ({
        ...s,
        profesional_id: s.profesional_id || cita.empleada_id || empleadas[0]?.id || ''
      })))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empleadas])

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

  const filteredServices = useMemo(() => {
    const s = search.toLowerCase().trim()
    if (!s) return servicios
    return servicios.filter(item =>
      item.nombre.toLowerCase().includes(s) ||
      item.familia?.toLowerCase().includes(s)
    )
  }, [servicios, search])

  const handleAddService = (s: Servicio) => {
    const defaultProf = cita.empleada_id || empleadas[0]?.id || ''
    setSelectedServicios([...selectedServicios, { ...s, profesional_id: defaultProf }])
    setShowAddService(false)
    setSearch('')
  }

  const removeService = (_id: string, index: number) => {
    setSelectedServicios(prev => prev.filter((_, i) => i !== index))
  }

  const setProfesional = (index: number, profesionalId: string) => {
    setSelectedServicios(prev => prev.map((s, i) =>
      i === index ? { ...s, profesional_id: profesionalId } : s
    ))
  }

  const handleSave = () => {
    // Determine the "main" professional: use whichever was assigned to first service
    const mainEmpleadaId = selectedServicios[0]?.profesional_id || cita.empleada_id || ''

    const updatedCita: Cita = {
      ...cita,
      empleada_id: mainEmpleadaId,
      comentarios,
      // Attach profesional_id info to servicios for later use in TicketPage
      servicios: selectedServicios.map(s => ({ ...s })) as Servicio[],
      bloque_inicio: horaInicio + ':00',
      duracion_manual_slots: calculateSlots(horaInicio, horaFin)
    }
    onNext(updatedCita)
  }

  function calculateSlots(start: string, end: string): number {
    const [h1, m1] = start.split(':').map(Number)
    const [h2, m2] = end.split(':').map(Number)
    const diff = (h2 * 60 + m2) - (h1 * 60 + m1)
    return Math.max(1, Math.floor(diff / 15))
  }

  return (
    <div className="validacion-container">
      {/* Header con info del cliente */}
      <div className="validacion-header">
        <div className="client-info-card">
          <div className="client-avatar">
            <User size={32} />
          </div>
          <div className="client-details">
            <h2>{cita.cliente?.nombre_completo}</h2>
            <div className="client-meta">
              <span>Teléfono: {cita.cliente?.telefono_cel || '—'}</span>
              <span>Nº Cliente: {cita.cliente?.num_cliente}</span>
            </div>
          </div>
        </div>
        <div className="header-title">
          <h1>Validación de Sesión</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="validacion-tabs">
        <button
          className={activeTab === 'actual' ? 'active' : ''}
          onClick={() => setActiveTab('actual')}
        >
          SESIÓN ACTUAL
        </button>
        <button
          className={activeTab === 'historial' ? 'active' : ''}
          onClick={() => setActiveTab('historial')}
        >
          SESIONES ANTERIORES
        </button>
      </div>

      <div className="validacion-body">
        {activeTab === 'actual' ? (
          <div className="sesion-actual">
            {/* Hora inicio/fin row — sin selector de profesional global */}
            <div className="form-row-compact" style={{ maxWidth: 340 }}>
              <div className="form-group time-group">
                <label>Inicio</label>
                <select
                  className="form-input"
                  value={horaInicio}
                  onChange={e => setHoraInicio(e.target.value)}
                >
                  {timeOptions.map((t: string) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div className="form-group time-group">
                <label>Fin</label>
                <select
                  className="form-input"
                  value={horaFin}
                  onChange={e => setHoraFin(e.target.value)}
                >
                  {timeOptions.map((t: string) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div className="services-table-wrap">
              <table className="services-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Servicio</th>
                    <th>Atendió</th>
                    <th style={{ width: 40 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {selectedServicios.map((s, idx) => (
                    <tr key={`${s.id}-${idx}`}>
                      <td>{cita.fecha}</td>
                      <td>{s.nombre}</td>
                      <td>
                        <select
                          className="table-select"
                          value={s.profesional_id || ''}
                          onChange={e => setProfesional(idx, e.target.value)}
                        >
                          <option value="">Sin asignar</option>
                          {empleadas.map((e: Empleada) => (
                            <option key={e.id} value={e.id}>{e.nombre}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <button onClick={() => removeService(s.id, idx)} className="btn-icon-danger">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <button className="btn-add-service-inline" onClick={() => setShowAddService(true)}>
                <Plus size={14} /> Añadir servicio
              </button>
            </div>

            <div className="observations-wrap">
              <label>Observaciones</label>
              <textarea
                value={comentarios}
                onChange={e => setComentarios(e.target.value)}
                placeholder="Añadir notas..."
              />
            </div>
          </div>
        ) : (
          <div className="sesion-historial">
            {historial.length === 0 ? (
              <div className="empty-state">No hay sesiones anteriores</div>
            ) : (
              <table className="services-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Servicios</th>
                    <th>Profesional</th>
                  </tr>
                </thead>
                <tbody>
                  {historial.filter(c => c.id !== cita.id).map(h => (
                    <tr key={h.id}>
                      <td>{h.fecha}</td>
                      <td>{h.servicios?.map(s => s.nombre).join(', ')}</td>
                      <td>{h.empleada?.nombre || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Selector de servicios modal */}
      {showAddService && (
        <div className="inline-modal-overlay">
          <div className="inline-modal">
            <div className="inline-modal-header">
              <h3>Añadir Servicio</h3>
              <button onClick={() => setShowAddService(false)}><X size={18} /></button>
            </div>
            <div className="inline-modal-search">
              <Search size={16} />
              <input
                type="text"
                placeholder="Buscar servicio..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                autoFocus
              />
            </div>
            <div className="inline-modal-list">
              {filteredServices.map(s => (
                <button key={s.id} onClick={() => handleAddService(s)}>
                  <span>{s.nombre}</span>
                  <span className="price">${s.precio}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Footer Actions */}
      <div className="validacion-footer">
        <button className="btn-secondary" onClick={onBack}>
          <ArrowLeft size={16} /> Volver
        </button>
        <button className="btn-primary" onClick={handleSave}>
          <Check size={16} /> Guardar y Cobrar
        </button>
      </div>
    </div>
  )
}
