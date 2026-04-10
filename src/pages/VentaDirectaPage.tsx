import { useState, useMemo } from 'react'
import { 
  X, Plus, Trash2, Calculator, 
  Package, Percent, Search, Printer, Store
} from 'lucide-react'
import { useTodasEmpleadas } from '../hooks/useEmpleadas'
import { useCrearTicketDirecto } from '../hooks/useTickets'
import { useProductos } from '../hooks/useProductos'
import { useServicios } from '../hooks/useServicios'
import { useSucursales } from '../hooks/useSucursales'
import type { TicketItem, Pago, Producto, Servicio, Sucursal } from '../types/database'
import PagoModal from '../components/Citas/PagoModal'
import TicketPrintView from '../components/Citas/TicketPrintView'
import { useToast } from '../components/Common/Toast'
import { useSucursalContext } from '../context/SucursalContext'

interface Props {
  onFinish?: () => void
}

export default function VentaDirectaPage({ onFinish: _onFinish }: Props) {
  const { data: empleadas = [] } = useTodasEmpleadas()
  const { data: sucursales = [] } = useSucursales()
  const crearTicket = useCrearTicketDirecto()
  const toast = useToast()

  const { selectedSucursalId: sucursalId } = useSucursalContext()
  const [vendedorId, setVendedorId] = useState('')
  const [saving, setSaving] = useState(false)
  const [clienteNombre, setClienteNombre] = useState('')

  const [items, setItems] = useState<TicketItem[]>([])
  const [pagos, setPagos] = useState<Pago[]>([])
  const [showPagoModal, setShowPagoModal] = useState(false)

  // Para la vista de impresión post-venta
  const [ticketGuardado, setTicketGuardado] = useState(false)
  const [numTicketFinal, setNumTicketFinal] = useState('')
  const [ticketSnapshot, setTicketSnapshot] = useState<{
    items: TicketItem[]; pagos: Pago[]; subtotal: number; total: number;
    descuento: number; sucursal: Sucursal | null; vendedorNombre: string
  } | null>(null)

  // Modales de selección
  const [showServicioModal, setShowServicioModal] = useState(false)
  const [showProductModal, setShowProductModal] = useState(false)
  const [searchServicio, setSearchServicio] = useState('')
  const [searchProducto, setSearchProducto] = useState('')

  // Modales de propina/descuento
  const [showPropinaModal, setShowPropinaModal] = useState(false)
  const [propinaInput, setPropinaInput] = useState('')
  const [propina, setPropina] = useState(0)

  const [showDescuentoModal, setShowDescuentoModal] = useState(false)
  const [descuentoInput, setDescuentoInput] = useState('')
  const [descuentoGlobal, setDescuentoGlobal] = useState(0)



  const { data: allProducts = [] } = useProductos()
  const { data: allServicios = [] } = useServicios()

  const filteredProducts = useMemo(() => {
    const s = searchProducto.toLowerCase().trim()
    return allProducts.filter(p => p.nombre.toLowerCase().includes(s) || (p.sku && p.sku.toLowerCase().includes(s)))
  }, [allProducts, searchProducto])

  const filteredServicios = useMemo(() => {
    const s = searchServicio.toLowerCase().trim()
    return allServicios.filter(sv => sv.nombre.toLowerCase().includes(s) || sv.familia?.toLowerCase().includes(s))
  }, [allServicios, searchServicio])

  const subtotal = items.reduce((sum, item) => sum + item.total, 0)
  const total = subtotal - descuentoGlobal + propina
  const totalPagado = pagos.reduce((sum, p) => sum + p.importe, 0)
  const pendiente = Math.max(0, total - totalPagado)


  const addServicio = (s: Servicio) => {
    setItems(prev => [...prev, {
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
      vendedor_id: vendedorId
    }])
    setShowServicioModal(false)
    setSearchServicio('')
  }

  const addProducto = (p: Producto) => {
    setItems(prev => [...prev, {
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
      vendedor_id: vendedorId
    }])
    setShowProductModal(false)
    setSearchProducto('')
  }

  const removeItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id))

  const handleConfirmPropina = () => {
    const val = parseFloat(propinaInput)
    if (!isNaN(val) && val >= 0) setPropina(val)
    setShowPropinaModal(false)
    setPropinaInput('')
  }

  const handleConfirmDescuento = () => {
    const val = parseFloat(descuentoInput)
    if (!isNaN(val) && val >= 0 && val <= subtotal) setDescuentoGlobal(val)
    setShowDescuentoModal(false)
    setDescuentoInput('')
  }

  const handleFinalizar = async () => {
    if (!sucursalId) { toast('Selecciona una sucursal', 'warning'); return }
    if (items.length === 0) { toast('Añade al menos un servicio o producto', 'warning'); return }
    if (pendiente > 0) {
      if (!window.confirm(`Quedan $${pendiente.toFixed(2)} pendientes. ¿Finalizar de todas formas?`)) return
    }
    setSaving(true)
    try {
      const tData = await crearTicket.mutateAsync({
        ticket: {
          sucursal_id: sucursalId,
          cliente_id: null,
          vendedor_id: vendedorId || null,
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
          const emp = empleadas.find(e => e.id === (item.vendedor_id || vendedorId))
          return {
            tipo: item.tipo,
            referencia_id: item.referencia_id,
            nombre: item.nombre,
            cantidad: item.cantidad,
            precio_unitario: item.precio_unitario,
            iva_porcentaje: item.iva_porcentaje,
            descuento: item.descuento,
            total: item.total,
            vendedor_id: item.vendedor_id || vendedorId || null,
            vendedor_nombre: emp?.nombre || null
          }
        }),
        pagos: pagos.map(p => ({
          metodo_pago: p.metodo_pago,
          importe: p.importe,
          detalles: p.detalles
        }))
      })

      // Guardar snapshot para la vista de impresión
      const sucursalObj = sucursales.find(s => s.id === sucursalId) || null
      const vendedorNombre = empleadas.find(e => e.id === vendedorId)?.nombre || ''
      setTicketSnapshot({ items, pagos, subtotal, total, descuento: descuentoGlobal, sucursal: sucursalObj, vendedorNombre })
      setNumTicketFinal(tData.num_ticket)
      setTicketGuardado(true)
    } catch (err) {
      console.error(err)
      toast('Error al guardar el ticket', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleNuevaVenta = () => {
    setItems([])
    setPagos([])
    setPropina(0)
    setDescuentoGlobal(0)
    setClienteNombre('')
    setVendedorId('')
    setTicketGuardado(false)
    setNumTicketFinal('')
    setTicketSnapshot(null)
  }

  if (ticketGuardado && ticketSnapshot) {
    const fechaStr = new Date().toLocaleString('es-MX', { hour12: true })
    // Construir un objeto cita-simulado para TicketPrintView
    const citaSimulada: any = {
      id: '',
      cliente_id: null,
      empleada_id: vendedorId || null,
      sucursal_id: sucursalId,
      fecha: new Date().toISOString().split('T')[0],
      bloque_inicio: '',
      estado: 'Finalizada',
      created_at: new Date().toISOString(),
      cliente: clienteNombre ? { nombre_completo: clienteNombre } : null,
      sucursal: ticketSnapshot.sucursal,
      servicios: []
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', background: 'var(--bg)' }}>
        <TicketPrintView
          cita={citaSimulada}
          ticketData={{
            numTicket: numTicketFinal,
            fechaStr,
            vendedor: ticketSnapshot.vendedorNombre,
            items: ticketSnapshot.items,
            subtotal: ticketSnapshot.subtotal,
            iva: ticketSnapshot.subtotal - ticketSnapshot.subtotal / 1.16,
            total: ticketSnapshot.total,
            descuento: ticketSnapshot.descuento,
            pagos: ticketSnapshot.pagos,
            pendiente: Math.max(0, ticketSnapshot.total - ticketSnapshot.pagos.reduce((s, p) => s + p.importe, 0))
          }}
        />
        <div style={{ padding: 20, display: 'flex', gap: 15, justifyContent: 'center' }}>
          <button className="btn-secondary" onClick={handleNuevaVenta}>Nueva Venta</button>
          <button className="btn-primary" onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Printer size={18} /> Imprimir Ticket
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div className="page-header" style={{ padding: '20px 24px 0', marginBottom: 16 }}>
        <div className="page-header-content">
          <h1 className="page-title">Venta Directa</h1>
          <p className="page-subtitle">Venta de mostrador sin cita previa</p>
        </div>
        {/* Selector de sucursal y vendedor */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 10 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', display: 'block', marginBottom: 3 }}>Profesional / Vendedora</label>
            <select className="form-input" value={vendedorId} onChange={e => setVendedorId(e.target.value)} style={{ height: 34, fontSize: 13, minWidth: 160 }}>
              <option value="">— Seleccionar —</option>
              {empleadas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', display: 'block', marginBottom: 3 }}>Cliente (Opcional)</label>
            <input
              type="text"
              className="form-input"
              value={clienteNombre}
              onChange={e => setClienteNombre(e.target.value)}
              placeholder="Nombre del cliente..."
              style={{ height: 34, fontSize: 13, minWidth: 180 }}
            />
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 340px', overflow: 'hidden' }}>
        {/* Zona de items */}
        <div style={{ overflowY: 'auto', padding: '0 24px 24px' }}>
          {/* Botones de añadir */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <button className="btn-primary" onClick={() => setShowServicioModal(true)}>
              <Plus size={14} /> Añadir Servicio
            </button>
            <button className="btn-secondary" onClick={() => setShowProductModal(true)}>
              <Package size={14} /> Añadir Producto
            </button>
          </div>

          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-3)' }}>
              <Store size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
              <div style={{ fontSize: 15, marginBottom: 8 }}>Ningún artículo añadido</div>
              <div style={{ fontSize: 13 }}>Usa los botones de arriba para añadir servicios o productos</div>
            </div>
          ) : (
            <table className="services-table">
              <thead>
                <tr>
                  <th>Concepto</th>
                  <th style={{ textAlign: 'center' }}>Uds.</th>
                  <th style={{ textAlign: 'right' }}>Precio</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                  <th style={{ width: 40 }}></th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{item.nombre}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{item.tipo}</div>
                    </td>
                    <td style={{ textAlign: 'center' }}>{item.cantidad}</td>
                    <td style={{ textAlign: 'right' }}>${item.precio_unitario.toFixed(2)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>${item.total.toFixed(2)}</td>
                    <td>
                      <button className="btn-icon danger" onClick={() => removeItem(item.id)}>
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Acciones extra */}
          {items.length > 0 && (
            <div className="ticket-actions-grid" style={{ marginTop: 16 }}>
              <button className="btn-secondary" onClick={() => { setPropinaInput(String(propina)); setShowPropinaModal(true) }}>
                <Plus size={14} /> {propina > 0 ? `Propina: $${propina.toFixed(2)}` : 'Añadir propina'}
              </button>
              <button className="btn-secondary" onClick={() => { setDescuentoInput(String(descuentoGlobal)); setShowDescuentoModal(true) }}>
                <Percent size={14} /> {descuentoGlobal > 0 ? `Descuento: -$${descuentoGlobal.toFixed(2)}` : 'Descuento / Promo'}
              </button>
            </div>
          )}
        </div>

        {/* Panel de cobro */}
        <div style={{ borderLeft: '1px solid var(--border)', padding: 24, display: 'flex', flexDirection: 'column', gap: 16, background: 'var(--surface)', overflowY: 'auto' }}>
          <div className="ticket-summary-card">
            <div className="summary-row">
              <span>Base Imponible:</span>
              <span>${(subtotal / 1.16).toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>IVA (16%):</span>
              <span>${(subtotal - subtotal / 1.16).toFixed(2)}</span>
            </div>
            {descuentoGlobal > 0 && (
              <div className="summary-row" style={{ color: 'var(--danger)' }}>
                <span>Descuento:</span>
                <span>-${descuentoGlobal.toFixed(2)}</span>
              </div>
            )}
            {propina > 0 && (
              <div className="summary-row">
                <span>Propina:</span>
                <span>+${propina.toFixed(2)}</span>
              </div>
            )}
            <div className="summary-row total" style={{ borderTop: '2px solid var(--border)', paddingTop: 10, marginTop: 10 }}>
              <span>TOTAL:</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          {pagos.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', marginBottom: 8 }}>PAGOS REGISTRADOS</div>
              {pagos.map(p => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 12px', background: 'var(--surface-2)', borderRadius: 6, marginBottom: 4, fontSize: 13 }}>
                  <span>{p.metodo_pago}</span>
                  <span style={{ fontWeight: 600 }}>${p.importe.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}

          <div style={{ fontSize: 16, fontWeight: 700, display: 'flex', justifyContent: 'space-between', color: pendiente > 0 ? 'var(--danger)' : 'var(--success)' }}>
            <span>Pendiente:</span>
            <span>${pendiente.toFixed(2)}</span>
          </div>

          <button
            className="btn-secondary"
            onClick={() => setShowPagoModal(true)}
            disabled={items.length === 0}
            style={{ width: '100%' }}
          >
            <Calculator size={16} /> Añadir pago
          </button>

          <button
            className="btn-primary"
            onClick={handleFinalizar}
            disabled={saving || items.length === 0}
            style={{ width: '100%', padding: '14px', fontSize: 15 }}
          >
            {saving ? 'Guardando...' : 'Cerrar Venta'}
          </button>
        </div>
      </div>

      {/* Modal Pago */}
      {showPagoModal && (
        <PagoModal
          pendiente={pendiente}
          onClose={() => setShowPagoModal(false)}
          onAddPago={(p: Pago) => setPagos([...pagos, p])}
        />
      )}

      {/* Modal Servicio */}
      {showServicioModal && (
        <div className="modal-overlay" onClick={() => setShowServicioModal(false)}>
          <div className="modal-box" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Seleccionar Servicio</h3>
              <button className="btn-icon" onClick={() => setShowServicioModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div style={{ position: 'relative', marginBottom: 12 }}>
                <Search size={15} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-3)' }} />
                <input className="form-input" style={{ paddingLeft: 38 }} placeholder="Buscar servicio..." value={searchServicio} onChange={e => setSearchServicio(e.target.value)} autoFocus />
              </div>
              <div style={{ maxHeight: 340, overflowY: 'auto' }}>
                {filteredServicios.map(s => (
                  <div key={s.id} onClick={() => addServicio(s)} style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 15px', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{s.nombre}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{s.familia || ''} · {(s.duracion_slots || 0) * 15} min</div>
                    </div>
                    <div style={{ fontWeight: 700, color: 'var(--accent)', fontSize: 14 }}>${s.precio.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Producto */}
      {showProductModal && (
        <div className="modal-overlay" onClick={() => setShowProductModal(false)}>
          <div className="modal-box" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Seleccionar Producto</h3>
              <button className="btn-icon" onClick={() => setShowProductModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div style={{ position: 'relative', marginBottom: 12 }}>
                <Search size={15} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-3)' }} />
                <input className="form-input" style={{ paddingLeft: 38 }} placeholder="Buscar por nombre o SKU..." value={searchProducto} onChange={e => setSearchProducto(e.target.value)} autoFocus />
              </div>
              <div style={{ maxHeight: 340, overflowY: 'auto' }}>
                {filteredProducts.map(p => (
                  <div key={p.id} onClick={() => addProducto(p)} style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 15px', borderBottom: '1px solid var(--border)', cursor: p.stock > 0 ? 'pointer' : 'not-allowed', opacity: p.stock > 0 ? 1 : 0.5 }}
                    onMouseEnter={e => p.stock > 0 && (e.currentTarget.style.background = 'var(--surface-2)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{p.nombre}</div>
                      <div style={{ fontSize: 11, color: p.stock <= 0 ? 'var(--danger)' : 'var(--text-3)' }}>
                        SKU: {p.sku || 'N/A'} · Stock: {p.stock <= 0 ? 'Sin stock' : p.stock}
                      </div>
                    </div>
                    <div style={{ fontWeight: 700, color: 'var(--accent)', fontSize: 14 }}>${p.precio.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Propina */}
      {showPropinaModal && (
        <div className="modal-overlay" onClick={() => setShowPropinaModal(false)}>
          <div className="modal-box" style={{ maxWidth: 360 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3 className="modal-title">Añadir propina</h3></div>
            <div className="modal-body p-5">
              <div className="form-group">
                <label>Importe de propina (MXN)</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 13, top: 11, color: 'var(--text-3)', fontSize: 16 }}>$</span>
                  <input type="number" className="form-input" style={{ paddingLeft: 28, fontSize: 20, fontWeight: 700 }} value={propinaInput} onChange={e => setPropinaInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleConfirmPropina()} autoFocus min="0" step="10" />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowPropinaModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={handleConfirmPropina}>Aplicar propina</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Descuento */}
      {showDescuentoModal && (
        <div className="modal-overlay" onClick={() => setShowDescuentoModal(false)}>
          <div className="modal-box" style={{ maxWidth: 360 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3 className="modal-title">Aplicar descuento</h3></div>
            <div className="modal-body p-5">
              <div className="form-group">
                <label>Monto del descuento (MXN)</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 13, top: 11, color: 'var(--danger)', fontSize: 16 }}>-$</span>
                  <input type="number" className="form-input" style={{ paddingLeft: 35, fontSize: 20, fontWeight: 700, color: 'var(--danger)' }} value={descuentoInput} onChange={e => setDescuentoInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleConfirmDescuento()} autoFocus min="0" max={subtotal} step="10" />
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 6 }}>Máximo: ${subtotal.toFixed(2)}</div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowDescuentoModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={handleConfirmDescuento}>Aplicar descuento</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
