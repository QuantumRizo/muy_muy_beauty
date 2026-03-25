import React, { useState, useMemo } from 'react'
import { X, Check, Trash2, Search, Calendar, Clock, MapPin, Phone, ChevronLeft, ChevronRight } from 'lucide-react'
import { useServicios } from '../../hooks/useServicios'
import { useSucursales } from '../../hooks/useSucursales'
import { useCrearCita } from '../../hooks/useCitas'
import { useTodasEmpleadas } from '../../hooks/useEmpleadas'
import type { Cliente, Servicio } from '../../types/database'

interface Props {
  cliente: Cliente
  empleadaId: string
  horaInicio: string
  fecha: string
  sucursalId: string
  onClose: () => void
  onCreated: () => void
}

export default function NuevaCitaModal({
  cliente,
  empleadaId: initialEmpleadaId,
  horaInicio,
  fecha,
  sucursalId,
  onClose,
  onCreated,
}: Props) {
  const { data: servicios = [] } = useServicios()
  const { data: sucursales = [] } = useSucursales()
  const { data: empleadas = [] } = useTodasEmpleadas()
  const crearCita = useCrearCita()
  
  const [selected, setSelected] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [comentarios, setComentarios] = useState('')
  const [localEmpleadaId, setLocalEmpleadaId] = useState(initialEmpleadaId || '')
  
  // Modules management
  const [manualSlots, setManualSlots] = useState<number | null>(null)

  const toggleServicio = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))

  const serviciosSeleccionados = useMemo(() => 
    servicios.filter((s) => selected.includes(s.id)),
  [servicios, selected])

  const autoSlots = serviciosSeleccionados.reduce((sum, s) => sum + s.duracion_slots, 0)
  const effectiveSlots = manualSlots ?? autoSlots
  const totalMin = effectiveSlots * 15

  // When services change, if not manually adjusted yet, keep it null to follow auto
  // But user wants a UI like < 6 >. 
  // If manualSlots is null, we show autoSlots.

  const filteredServices = useMemo(() => {
    const s = search.toLowerCase().trim()
    if (!s) return servicios
    return servicios.filter(item => 
      item.nombre.toLowerCase().includes(s) || 
      item.familia?.toLowerCase().includes(s)
    )
  }, [servicios, search])

  const groups = useMemo(() => {
    return filteredServices.reduce<Record<string, Servicio[]>>((acc, s) => {
      const fam = s.familia ?? 'Otros'
      acc[fam] = acc[fam] ? [...acc[fam], s] : [s]
      return acc
    }, {})
  }, [filteredServices])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected.length || !sucursalId || !localEmpleadaId) return
    await crearCita.mutateAsync({
      cita: {
        cliente_id: cliente.id,
        empleada_id: localEmpleadaId,
        sucursal_id: sucursalId,
        fecha,
        bloque_inicio: horaInicio,
        estado: 'Programada',
        duracion_manual_slots: manualSlots,
        comentarios: comentarios || null,
        ticket_id: null,
      },
      servicioIds: selected,
    })
    onCreated()
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box modal-lg-split" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Nueva Cita</h2>
          <button onClick={onClose} className="btn-ghost" style={{ padding: 4 }}><X size={20} /></button>
        </div>

        <div className="modal-split-body">
          {/* LEFT: CART */}
          <div className="modal-side-cart">
            <div className="cart-header">
              <div className="cart-client-name">{cliente.nombre_completo}</div>
              <div className="cart-client-phone">
                <Phone size={13} /> {cliente.telefono_cel || 'Sin teléfono'}
              </div>
            </div>

            <div style={{ padding: '12px 20px', fontSize: 11, color: 'var(--text-2)', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Calendar size={13} color="var(--text-3)" /> <span>{fecha}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={13} color="var(--text-3)" /> <span>{horaInicio}</span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <MapPin size={13} color="var(--text-3)" />
                <span>{sucursales.find(s => s.id === sucursalId)?.nombre || 'Sucursal'}</span>
              </div>
            </div>

            <div className="cart-items-list">
              {serviciosSeleccionados.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-3)', fontSize: 11, marginTop: 40 }}>
                  No hay servicios seleccionados
                </div>
              ) : (
                serviciosSeleccionados.map(s => (
                  <div key={s.id} className="cart-item">
                    <div className="cart-item-info">
                      <div className="cart-item-name">{s.nombre}</div>
                      <div className="cart-item-meta">{s.duracion_slots * 15} min · ${s.precio}</div>
                    </div>
                    <button type="button" onClick={() => toggleServicio(s.id)} className="cart-item-remove">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="cart-summary-footer">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-3)' }}>Módulos:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button 
                      type="button" 
                      className="btn-ghost" 
                      style={{ padding: 2 }}
                      onClick={() => setManualSlots(Math.max(1, (manualSlots ?? autoSlots) - 1))}
                    >
                      <ChevronLeft size={16} color="var(--accent)" />
                    </button>
                    <span style={{ fontSize: 15, fontWeight: 700, minWidth: 20, textAlign: 'center' }}>
                      {manualSlots ?? autoSlots}
                    </span>
                    <button 
                      type="button" 
                      className="btn-ghost" 
                      style={{ padding: 2 }}
                      onClick={() => setManualSlots((manualSlots ?? autoSlots) + 1)}
                    >
                      <ChevronRight size={16} color="var(--accent)" />
                    </button>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                   <div style={{ fontSize: 13, fontWeight: 600 }}>{totalMin} min</div>
                   {manualSlots !== null && (
                     <button 
                       onClick={() => setManualSlots(null)} 
                       style={{ fontSize: 10, color: 'var(--accent)', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                     >
                       Restablecer auto
                     </button>
                   )}
                </div>
              </div>

              <textarea 
                value={comentarios} 
                onChange={e => setComentarios(e.target.value)} 
                placeholder="Notas de la cita..." 
                className="form-input" 
                style={{ fontSize: 11 }}
                rows={2}
              />
            </div>
          </div>

          {/* RIGHT: PICKER */}
          <div className="modal-side-selection">
            <div className="selection-search-wrap">
              <div style={{ position: 'relative', width: '100%' }}>
                <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
                <input 
                  type="text"
                  placeholder="Buscar servicio..."
                  className="selection-search-input"
                  style={{ paddingLeft: 38 }}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div style={{ padding: '0 20px 15px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', minWidth: 80 }}>Profesional:</span>
              <select 
                className="form-input" 
                style={{ fontSize: 13, flex: 1, height: 36, padding: '0 12px' }}
                value={localEmpleadaId} 
                onChange={e => setLocalEmpleadaId(e.target.value)}
                required
              >
                <option value="">Elegir profesional...</option>
                {empleadas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
              </select>
            </div>

            <div className="selection-services-list">
              {Object.entries(groups).length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-3)', padding: 40 }}>No se encontraron servicios</div>
              ) : (
                Object.entries(groups).map(([familia, items]) => (
                  <div key={familia} style={{ marginBottom: 20 }}>
                    <div className="servicio-familia" style={{ marginBottom: 8 }}>{familia}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {items.map(s => {
                        const isAdded = selected.includes(s.id)
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => toggleServicio(s.id)}
                            className={`servicio-btn ${isAdded ? 'active' : ''}`}
                            style={{ padding: '10px 14px' }}
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
                ))
              )}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn-ghost">Cancelar</button>
          <button 
            type="button" 
            onClick={handleSubmit} 
            disabled={!selected.length || !sucursalId || crearCita.isPending} 
            className="btn-primary"
            style={{ padding: '10px 24px' }}
          >
            {crearCita.isPending ? 'Agendando...' : 'Confirmar y Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}
