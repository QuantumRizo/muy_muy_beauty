import { useState, useMemo, useEffect } from 'react'
import { X, Check, User, ArrowLeft, Plus, Trash2, Calculator, Package, Percent, Printer, ChevronDown, ChevronUp } from 'lucide-react'
import { useEmpleadas } from '../../hooks/useEmpleadas'
import { useServicios } from '../../hooks/useServicios'
import { useCrearTicket } from '../../hooks/useTickets'
import { useProductos } from '../../hooks/useProductos'
import type { Cita, Servicio, TicketItem, Pago, Producto } from '../../types/database'
import PagoModal from './PagoModal'
import TicketPrintView from './TicketPrintView'
import { useToast } from '../Common/Toast'
import ConfirmDialog from '../Common/ConfirmDialog'
import AjusteImporte from '../Common/AjusteImporte'

interface ServicioConProfesional extends Servicio {
  profesional_id?: string
}

interface Props {
  cita: Cita
  onClose: () => void
  onFinish: () => void
}

export default function CheckoutFlow({ cita, onClose, onFinish }: Props) {
  const [step, setStep] = useState<'validacion' | 'cobro' | 'ticket'>('validacion')
  const { data: empleadas = [] } = useEmpleadas(cita.sucursal_id)
  const { data: servicios = [] } = useServicios()
  const { data: allProducts = [] } = useProductos()
  const crearTicket = useCrearTicket()
  const toast = useToast()

  // ─── Estado de la cita ───────────────────────────────────────────
  const [selectedServicios, setSelectedServicios] = useState<ServicioConProfesional[]>(() =>
    (cita.servicios || []).map(s => ({
      ...s,
      profesional_id: cita.empleada_id || (empleadas[0]?.id ?? '')
    }))
  )
  const [comentarios, setComentarios] = useState(cita.comentarios || '')
  
  // Horas
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

  // ─── Estado del ticket (Cobro) ───────────────────────────────────
  const [items, setItems] = useState<TicketItem[]>([])
  const [pagos, setPagos] = useState<Pago[]>([])
  const [propina, setPropina] = useState(0)
  const [descuentoGlobal, setDescuentoGlobal] = useState(0)
  
  // Modales adicionales
  const [showAddService, setShowAddService] = useState(false)
  const [searchService, setSearchService] = useState('')
  const [showProductModal, setShowProductModal] = useState(false)
  const [searchProduct, setSearchProduct] = useState('')
  const [showPagoModal, setShowPagoModal] = useState(false)
  const [showPropinaModal, setShowPropinaModal] = useState(false)
  const [propinaInput, setPropinaInput] = useState('')
  const [showDescuentoModal, setShowDescuentoModal] = useState(false)
  const [descuentoInput, setDescuentoInput] = useState('')
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', action: () => {} })

  // Estado final del ticket guardado
  const [saving, setSaving] = useState(false)
  const [numTicketFinal, setNumTicketFinal] = useState('')
  const [fechaTicket, setFechaTicket] = useState('')
  
  // Printing State
  const [showPerServicePrint, setShowPerServicePrint] = useState(false)
  const [selectedServicePrintIdx, setSelectedServicePrintIdx] = useState(0)
  
  const [showClientData, setShowClientData] = useState(false)

  // ─── Cálculos compartidos ─────────────────────────────────────────
  const subtotal = items.reduce((sum, item) => sum + item.total, 0)
  const total = subtotal - descuentoGlobal // Propina ya no suma al total facturable
  const totalPagado = pagos.reduce((sum, p) => sum + p.importe, 0)
  const pendiente = Math.max(0, total - totalPagado)

  // Auto-fill profesional if missing
  useEffect(() => {
    if (empleadas.length > 0) {
      setSelectedServicios(prev => prev.map(s => ({
        ...s,
        profesional_id: s.profesional_id || cita.empleada_id || empleadas[0]?.id || ''
      })))
    }
  }, [empleadas, cita.empleada_id])

  useEffect(() => {
    const totalSlots = selectedServicios.reduce((sum, s) => sum + (s.duracion_slots || 0), 0) || 4
    const [h, m] = horaInicio.split(':').map(Number)
    const totalMin = h * 60 + m + totalSlots * 15
    const hh = Math.floor(totalMin / 60).toString().padStart(2, '0')
    const mm = (totalMin % 60).toString().padStart(2, '0')
    setHoraFin(`${hh}:${mm}`)
  }, [selectedServicios, horaInicio])


  // ─── Funciones Step 1: Validación ─────────────────────────────────
  const timeOptions = useMemo(() => {
    const times = []
    for (let h = 8; h <= 21; h++) {
      for (let m = 0; m < 60; m += 15) {
        times.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`)
      }
    }
    return times
  }, [])

  const filteredServices = useMemo(() => {
    const s = searchService.toLowerCase().trim()
    if (!s) return servicios
    return servicios.filter(i => i.nombre.toLowerCase().includes(s) || i.familia?.toLowerCase().includes(s))
  }, [servicios, searchService])

  const handleAddServiceToValidation = (s: Servicio) => {
    const defaultProf = cita.empleada_id || empleadas[0]?.id || ''
    setSelectedServicios([...selectedServicios, { ...s, profesional_id: defaultProf }])
    setShowAddService(false)
    setSearchService('')
  }
  
  const proceedToCobro = () => {
    const newItems: TicketItem[] = selectedServicios.map(s => ({
      id: crypto.randomUUID(),
      ticket_id: '',
      tipo: 'Servicio',
      referencia_id: s.id,
      nombre: s.nombre,
      cantidad: 1,
      precio_unitario: s.precio,
      iva_porcentaje: 16,
      descuento: 0,
      total: s.precio,
      vendedor_id: s.profesional_id || ''
    }))
    setItems(newItems)
    setStep('cobro')
  }

  // ─── Funciones Step 2: Cobro ──────────────────────────────────────
  const handleAddProduct = (p: Producto) => {
    setItems([...items, {
      id: crypto.randomUUID(),
      ticket_id: '',
      tipo: 'Producto',
      referencia_id: p.id,
      nombre: p.nombre,
      cantidad: 1,
      precio_unitario: p.precio,
      iva_porcentaje: 16,
      descuento: 0,
      total: p.precio,
      vendedor_id: selectedServicios[0]?.profesional_id || cita.empleada_id || ''
    }])
    setShowProductModal(false)
    setSearchProduct('')
  }

  const handleFinalizarTicket = async () => {
    const runSave = async () => {
      setSaving(true)
      try {
        const mainEmpleadaId = selectedServicios[0]?.profesional_id || cita.empleada_id || ''
        const tData = await crearTicket.mutateAsync({
          ticket: {
            sucursal_id: cita.sucursal_id,
            cliente_id: cita.cliente_id,
            vendedor_id: mainEmpleadaId,
            num_ticket: 'pending',
            fecha: new Date().toLocaleDateString('en-CA'),
            base_imponible: subtotal / 1.16,
            iva: subtotal - (subtotal / 1.16),
            total,
            descuento: descuentoGlobal,
            propina,
            estado: pendiente <= 0 ? 'Pagado' : 'Pendiente'
          },
          items: items.map(item => {
            const emp = empleadas.find(e => e.id === item.vendedor_id)
            return {
              tipo: item.tipo,
              referencia_id: item.referencia_id,
              nombre: item.nombre,
              cantidad: item.cantidad,
              precio_unitario: item.precio_unitario,
              iva_porcentaje: item.iva_porcentaje,
              descuento: item.descuento,
              total: item.total,
              vendedor_id: item.vendedor_id || null,
              vendedor_nombre: emp?.nombre || null
            }
          }),
          pagos: pagos.map(p => ({ metodo_pago: p.metodo_pago, importe: p.importe, detalles: p.detalles })),
          citaId: cita.id
        })
        
        setNumTicketFinal(tData.num_ticket)
        setFechaTicket(new Date().toLocaleString('es-MX', { hour12: true }))
        setStep('ticket')
        onFinish()
      } catch (err) {
        console.error(err)
        toast('Error al guardar', 'error')
      } finally {
        setSaving(false)
      }
    }

    if (pendiente > 0) {
      setConfirmDialog({
        isOpen: true,
        title: 'Saldo Pendiente',
        message: `Aún queda un saldo de $${pendiente.toFixed(2)} pendiente. ¿Deseas cerrar el ticket igualmente?`,
        action: runSave
      })
    } else {
      runSave()
    }
  }

  // ─── Renders ──────────────────────────────────────────────────────
  const renderValidacion = () => (
    <div className="checkout-step-body">
      <div className="form-row-compact" style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
        <div className="form-group" style={{ flex: 1 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)' }}>HORA INICIO</label>
          <select className="form-input" value={horaInicio} onChange={e => setHoraInicio(e.target.value)}>
            {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="form-group" style={{ flex: 1 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)' }}>HORA FIN</label>
          <select className="form-input" value={horaFin} onChange={e => setHoraFin(e.target.value)}>
            {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div style={{ background: 'var(--surface-2)', borderRadius: 12, padding: 16 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: 'var(--text-1)' }}>Servicios Realizados</h3>
        {selectedServicios.map((s, idx) => (
          <div key={`${s.id}-${idx}`} style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
            <div style={{ flex: 2, fontWeight: 600, fontSize: 13 }}>{s.nombre}</div>
            <select
              className="table-select"
              style={{ flex: 1.5, fontSize: 12 }}
              value={s.profesional_id || ''}
              onChange={e => {
                const newServs = [...selectedServicios]
                newServs[idx].profesional_id = e.target.value
                setSelectedServicios(newServs)
              }}
            >
              {empleadas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>
            <button 
              className="btn-icon danger" 
              style={{ border: 'none', background: 'transparent', color: 'var(--danger)', cursor: 'pointer', padding: 4 }}
              onClick={() => setSelectedServicios(prev => prev.filter((_, i) => i !== idx))}
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        <button className="btn-secondary" style={{ width: '100%', marginTop: 8, borderColor: 'var(--accent)', color: 'var(--accent)' }} onClick={() => setShowAddService(true)}>
          <Plus size={14} /> Añadir otro servicio
        </button>
      </div>

      <div style={{ marginTop: 20 }}>
        <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', display: 'block', marginBottom: 6 }}>OBSERVACIONES DE LA CITA</label>
        <textarea
          className="form-input"
          style={{ height: 80, fontSize: 13 }}
          value={comentarios}
          onChange={e => setComentarios(e.target.value)}
          placeholder="Notas internas..."
        />
      </div>

      <div style={{ marginTop: 24 }}>
         <button className="btn-primary" style={{ width: '100%', padding: '14px', borderRadius: 12, fontWeight: 700 }} onClick={proceedToCobro}>
           Continuar al Cobro <ArrowLeft size={16} style={{ transform: 'rotate(180deg)' }}/>
         </button>
      </div>
    </div>
  )

  const renderCobro = () => (
    <div className="checkout-step-body">
      <div style={{ maxHeight: '50vh', overflowY: 'auto', paddingRight: 4 }}>
        <table className="services-table" style={{ width: '100%', marginBottom: 16 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '8px 0', fontSize: 11, color: 'var(--text-3)' }}>CONCEPTO</th>
              <th style={{ textAlign: 'right', padding: '8px 0', fontSize: 11, color: 'var(--text-3)' }}>PRECIO</th>
              <th style={{ width: 40 }}></th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id}>
                <td style={{ padding: '8px 0' }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{item.nombre}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{item.tipo}</div>
                </td>
                <td style={{ textAlign: 'right', padding: '8px 0', fontWeight: 600 }}>${item.total.toFixed(2)}</td>
                <td style={{ padding: '8px 0', textAlign: 'right' }}>
                  <button className="btn-icon danger" onClick={() => setItems(prev => prev.filter(i => i.id !== item.id))}>
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <button className="btn-secondary" style={{ flex: 1, fontSize: 11, fontWeight: 600 }} onClick={() => setShowProductModal(true)}>
            <Package size={14} /> PRODUCTO
          </button>
          <button className="btn-secondary" style={{ flex: 1, fontSize: 11, fontWeight: 600 }} onClick={() => setShowPropinaModal(true)}>
            <Plus size={14} /> PROPINA
          </button>
          <button className="btn-secondary" style={{ flex: 1, fontSize: 11, fontWeight: 600 }} onClick={() => setShowDescuentoModal(true)}>
            <Percent size={14} /> DCTO.
          </button>
        </div>

        <div className="ticket-summary-card" style={{ background: 'var(--surface-2)', borderRadius: 12, padding: 16 }}>
          <div className="summary-row" style={{ fontSize: 13, marginBottom: 6 }}><span>Subtotal:</span><span>${subtotal.toFixed(2)}</span></div>
          {descuentoGlobal > 0 && <div className="summary-row" style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 6 }}><span>Descuento:</span><span>-${descuentoGlobal.toFixed(2)}</span></div>}
          {propina > 0 && <div className="summary-row" style={{ color: 'var(--text-3)', fontSize: 13, marginBottom: 6 }}><span>Propina (Se cobra por separado):</span><span>+${propina.toFixed(2)}</span></div>}
          <div className="summary-row total" style={{ borderTop: '1px solid var(--border)', paddingTop: 10, marginTop: 10, fontSize: 18, fontWeight: 800 }}>
            <span>TOTAL (Sin propina):</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>

        {pagos.map(p => (
          <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--accent-light)', color: 'var(--accent)', borderRadius: 10, marginTop: 8, fontSize: 13, fontWeight: 600 }}>
            <span>{p.metodo_pago}</span><span>${p.importe.toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: pendiente > 0 ? 'var(--danger)' : 'var(--success)' }}>
            Pendiente: ${pendiente.toFixed(2)}
          </div>
          <button className="btn-secondary" style={{ padding: '8px 16px', borderRadius: 10 }} onClick={() => setShowPagoModal(true)}>
            <Calculator size={16} /> Cobrar
          </button>
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <button className="btn-secondary" style={{ flex: 1, padding: 14 }} onClick={() => setStep('validacion')}>Atrás</button>
          <button className="btn-primary" style={{ flex: 2, padding: 14, fontWeight: 700 }} onClick={handleFinalizarTicket} disabled={saving}>
            {saving ? 'Guardando...' : 'Finalizar Venta'}
          </button>
        </div>
      </div>
    </div>
  )

  const renderTicket = () => {
    const serviceItems = items.filter(i => i.tipo === 'Servicio')
    const ticketData = {
      numTicket: numTicketFinal,
      fechaStr: fechaTicket,
      vendedor: '',
      items,
      subtotal,
      iva: total - (subtotal / 1.16),
      total,
      descuento: descuentoGlobal,
      pagos,
      propina,
      pendiente
    }

    return (
      <div className="checkout-step-body" style={{ textAlign: 'center', padding: '20px 0' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <Check size={32} color="white" />
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Venta Exitosa</h2>
        <p style={{ color: 'var(--text-3)', fontSize: 14, marginBottom: 32 }}>Ticket #{numTicketFinal}</p>

        <div style={{ display: 'none' }}>
          {!showPerServicePrint ? (
            <TicketPrintView cita={cita} ticketData={ticketData} />
          ) : (
            <TicketPrintView
              cita={cita}
              ticketData={{
                ...ticketData,
                items: [serviceItems[selectedServicePrintIdx]],
                subtotal: serviceItems[selectedServicePrintIdx]?.total ?? 0,
                total: serviceItems[selectedServicePrintIdx]?.total ?? 0,
                descuento: 0,
                pagos: [],
                pendiente: 0
              }}
            />
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button 
            className="btn-primary" 
            style={{ padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontWeight: 700 }} 
            onClick={() => { setShowPerServicePrint(false); setTimeout(() => window.print(), 50) }}
          >
            <Printer size={20} /> Imprimir Ticket Gral.
          </button>

          {serviceItems.length > 1 && (
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textAlign: 'left', marginBottom: 12 }}>TICKETS INDIVIDUALES</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {serviceItems.map((item, idx) => {
                  const prof = empleadas.find(e => e.id === item.vendedor_id)
                  return (
                    <button
                      key={item.id}
                      className="btn-secondary"
                      style={{ padding: '12px 16px', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                      onClick={() => {
                        setSelectedServicePrintIdx(idx)
                        setShowPerServicePrint(true)
                        setTimeout(() => window.print(), 50)
                      }}
                    >
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: 700 }}>{item.nombre}</div>
                        <div style={{ fontSize: 11, opacity: 0.7 }}>{prof?.nombre}</div>
                      </div>
                      <Printer size={16} />
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <button className="btn-secondary" style={{ marginTop: 32, padding: 12, border: 'none' }} onClick={onClose}>
            Finalizar y Volver
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay">
      <div 
        className="modal-box" 
        style={{ 
          maxWidth: 640, 
          width: '95vw',
          maxHeight: '90vh',
          background: 'var(--surface)', 
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          padding: 0,
          overflow: 'hidden',
          borderRadius: 20,
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
        }}
      >
        {/* Step Header */}
        <div style={{ background: 'var(--bg)', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', gap: 24, fontSize: 13, fontWeight: 800, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            <span style={{ color: step === 'validacion' ? 'var(--accent)' : 'inherit' }}>1. Validar</span>
            <span style={{ color: step === 'cobro' ? 'var(--accent)' : 'inherit' }}>2. Cobro</span>
            <span style={{ color: step === 'ticket' ? 'var(--accent)' : 'inherit' }}>3. Recibo</span>
          </div>
          {step !== 'ticket' && (
            <button className="btn-icon" onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}><X size={20}/></button>
          )}
        </div>

        {/* Profile Card */}
        {step !== 'ticket' && (
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }} onClick={() => setShowClientData(!showClientData)}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                <User size={22} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 17, color: 'var(--text-1)' }}>{cita.cliente?.nombre_completo}</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 600 }}>Nº {cita.cliente?.num_cliente} · {cita.cliente?.telefono_cel}</div>
              </div>
              {showClientData ? <ChevronUp size={18} color="var(--text-3)"/> : <ChevronDown size={18} color="var(--text-3)"/>}
            </div>
            {showClientData && (
              <div style={{ marginTop: 16, padding: 16, background: 'var(--bg)', borderRadius: 12, fontSize: 13, border: '1px solid var(--border)' }}>
                <div style={{ marginBottom: 4 }}><strong style={{ color: 'var(--text-2)' }}>Email:</strong> {cita.cliente?.email || '—'}</div>
                <div><strong style={{ color: 'var(--text-2)' }}>Notas:</strong> {cita.cliente?.datos_extra?.notas || 'Sin notas.'}</div>
              </div>
            )}
          </div>
        )}

        <div style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
          {step === 'validacion' && renderValidacion()}
          {step === 'cobro' && renderCobro()}
          {step === 'ticket' && renderTicket()}
        </div>
      </div>

      {/* --- Secondary Modals --- */}
      {showAddService && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-box" style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h3 className="modal-title">Añadir Servicio</h3>
              <button className="btn-icon" onClick={() => setShowAddService(false)}><X size={18}/></button>
            </div>
            <div className="modal-body p-4">
              <input className="form-input" placeholder="Buscar..." value={searchService} onChange={e => setSearchService(e.target.value)} autoFocus style={{ marginBottom: 12 }} />
              <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                {filteredServices.map(s => (
                  <div key={s.id} onClick={() => handleAddServiceToValidation(s)} style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ fontWeight: 600 }}>{s.nombre}</span><span>${s.precio}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {showProductModal && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-box" style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h3 className="modal-title">Añadir Producto</h3>
              <button className="btn-icon" onClick={() => setShowProductModal(false)}><X size={18}/></button>
            </div>
            <div className="modal-body p-4">
              <input className="form-input" placeholder="Buscar..." value={searchProduct} onChange={e => setSearchProduct(e.target.value)} autoFocus style={{ marginBottom: 12 }} />
              <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                {allProducts.filter(p => p.nombre.toLowerCase().includes(searchProduct.toLowerCase())).map(p => (
                  <div key={p.id} onClick={() => handleAddProduct(p)} style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ fontWeight: 600 }}>{p.nombre}</span><span>${p.precio}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {showPagoModal && (
        <div style={{ zIndex: 1200, position: 'relative' }}>
          <PagoModal pendiente={pendiente} onClose={() => setShowPagoModal(false)} onAddPago={p => setPagos([...pagos, p])} />
        </div>
      )}

      {showPropinaModal && (
        <AjusteImporte
          label="Propina"
          subtitle="Importe de propina (MXN)"
          value={propinaInput}
          onValueChange={setPropinaInput}
          onConfirm={() => { setPropina(Number(propinaInput) || 0); setShowPropinaModal(false) }}
          onClose={() => setShowPropinaModal(false)}
        />
      )}

      {showDescuentoModal && (
        <AjusteImporte
          label="Descuento"
          subtitle={`Monto del descuento (MXN) - Máximo local: $${subtotal.toFixed(2)}`}
          value={descuentoInput}
          onValueChange={setDescuentoInput}
          isDanger
          max={subtotal}
          onConfirm={() => { setDescuentoGlobal(Number(descuentoInput) || 0); setShowDescuentoModal(false) }}
          onClose={() => setShowDescuentoModal(false)}
        />
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={() => {
          confirmDialog.action()
          setConfirmDialog({ ...confirmDialog, isOpen: false })
        }}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />
    </div>
  )
}
