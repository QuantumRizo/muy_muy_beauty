import { useState, useMemo } from 'react'
import { 
  X, User, Plus, Trash2, Calculator, 
  ChevronDown, ChevronUp, Gift, DollarSign, Package, Percent, Search 
} from 'lucide-react'
import { useTodasEmpleadas } from '../hooks/useEmpleadas'
import { useCrearTicket } from '../hooks/useTickets'
import { useProductos } from '../hooks/useProductos'
import type { Cita, TicketItem, Pago, Producto } from '../types/database'
import PagoModal from '../components/Citas/PagoModal'


interface Props {
  cita: Cita
  onBack: () => void
  onFinish: () => void
}

export default function TicketPage({ cita, onBack, onFinish }: Props) {
  const { data: empleadas = [] } = useTodasEmpleadas()
  const crearTicket = useCrearTicket()

  const [vendedorId, setVendedorId] = useState(cita.empleada_id || '')
  const [showClientData, setShowClientData] = useState(false)
  const [saving, setSaving] = useState(false)

  const [items, setItems] = useState<TicketItem[]>(() => 
    (cita.servicios || []).map(s => ({
      id: crypto.randomUUID(),
      ticket_id: '',
      tipo: 'Servicio',
      referencia_id: s.id,
      nombre: s.nombre,
      cantidad: 1,
      precio_unitario: s.precio,
      iva_porcentaje: 16,
      descuento: 0,
      total: s.precio
    }))
  )

  const [pagos, setPagos] = useState<Pago[]>([])
  const [showPagoModal, setShowPagoModal] = useState(false)
  const [showProductModal, setShowProductModal] = useState(false)
  const [productSearch, setProductSearch] = useState('')
  const [propina, setPropina] = useState(0)
  
  // Invoice numbering
  const [serie] = useState('MXDUO4')
  const [numTicket] = useState(() => Math.floor(1000 + Math.random() * 9000).toString())

  const { data: allProducts = [] } = useProductos()

  const filteredProducts = useMemo(() => {
    const s = productSearch.toLowerCase().trim()
    return allProducts.filter(p => p.nombre.toLowerCase().includes(s) || (p.sku && p.sku.toLowerCase().includes(s)))
  }, [allProducts, productSearch])

  // Calcs
  const subtotal = items.reduce((sum: number, item: TicketItem) => sum + item.total, 0)
  const total = subtotal + propina
  const totalPagado = pagos.reduce((sum: number, p: Pago) => sum + p.importe, 0)
  const pendiente = Math.max(0, total - totalPagado)


  const handleAddTip = () => {
    const amount = window.prompt('Introduce el importe de la propina:', '0')
    if (amount !== null) {
      const val = parseFloat(amount)
      if (!isNaN(val)) setPropina(val)
    }
  }

  const selectProduct = (p: Producto) => {
    const newItem: TicketItem = {
      id: crypto.randomUUID(),
      ticket_id: '',
      tipo: 'Producto',
      referencia_id: p.id,
      nombre: p.nombre,
      cantidad: 1,
      precio_unitario: p.precio,
      iva_porcentaje: 16,
      descuento: 0,
      total: p.precio
    }
    setItems([...items, newItem])
    setShowProductModal(false)
    setProductSearch('')
  }

  const removeItem = (id: string) => {
    setItems(items.filter((i: TicketItem) => i.id !== id))
  }


  const handleFinalizar = async () => {
    if (pendiente > 0) {
      if (!confirm(`Aún queda un saldo de $${pendiente.toFixed(2)} pendiente. ¿Deseas finalizar el ticket igualmente?`)) return
    }
    
    setSaving(true)
    try {
      await crearTicket.mutateAsync({
        ticket: {
          sucursal_id: cita.sucursal_id,
          cliente_id: cita.cliente_id,
          vendedor_id: vendedorId || null,
          num_ticket: `${serie}/${numTicket}`,
          fecha: new Date().toLocaleDateString('en-CA'), // YYYY-MM-DD en hora local

          base_imponible: subtotal / 1.16,
          iva: subtotal - (subtotal / 1.16),
          total,
          descuento: 0,
          propina,
          estado: pendiente <= 0 ? 'Pagado' : 'Pendiente'
        },
        items: items.map((item: TicketItem) => ({
          tipo: item.tipo,
          referencia_id: item.referencia_id,
          nombre: item.nombre,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
          iva_porcentaje: item.iva_porcentaje,
          descuento: item.descuento,
          total: item.total
        })),
        pagos: pagos.map((p: Pago) => ({
          metodo_pago: p.metodo_pago,
          importe: p.importe,
          detalles: p.detalles
        })),

        citaId: cita.id
      })
      onFinish()
    } catch (err) {
      console.error(err)
      alert('Error al guardar el ticket')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="validacion-container">
      {/* Header */}
      <div className="validacion-header">
        <div className="header-left">
          <h1>Factura Nº <span style={{ color: 'var(--text-1)' }}>{serie}O/{numTicket}</span></h1>
        </div>
        <div className="client-info-card" onClick={() => setShowClientData(!showClientData)} style={{ cursor: 'pointer' }}>
          <div className="client-avatar"><User size={24} /></div>
          <div className="client-details">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2>{cita.cliente?.nombre_completo}</h2>
              {showClientData ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
            <span className="client-meta">Tel: {cita.cliente?.telefono_cel} · Nº {cita.cliente?.num_cliente}</span>
          </div>
        </div>
      </div>

      {showClientData && (
        <div className="client-data-expanded" style={{ padding: '15px 30px', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
          <p><strong>Email:</strong> {cita.cliente?.email || '—'}</p>
          <p><strong>Notas:</strong> {cita.cliente?.datos_extra?.notas || 'Sin notas'}</p>
        </div>
      )}

      {/* Toolbar */}
      <div className="ticket-toolbar" style={{ padding: '15px 30px', display: 'flex', gap: 20, alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
        <div className="form-group">
          <label style={{ fontSize: 11 }}>Vendedor</label>
          <select value={vendedorId} onChange={e => setVendedorId(e.target.value)} className="table-select" style={{ height: 32 }}>
            {empleadas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label style={{ fontSize: 11 }}>Nº Serie</label>
          <select className="table-select" style={{ height: 32, padding: '0 8px', fontWeight: 600 }}>
            <option>{serie}</option>
          </select>
        </div>
      </div>

      {/* Body */}
      <div className="validacion-body">
        <div className="services-table-wrap">
          <table className="services-table">
            <thead>
              <tr>
                <th>Concepto</th>
                <th style={{ textAlign: 'center' }}>IVA %</th>
                <th style={{ textAlign: 'center' }}>Uds.</th>
                <th style={{ textAlign: 'right' }}>Precio</th>
                <th style={{ textAlign: 'right' }}>Dto.</th>
                <th style={{ textAlign: 'right' }}>Total</th>
                <th style={{ width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.nombre}</td>
                  <td style={{ textAlign: 'center' }}>{item.iva_porcentaje.toFixed(2)}</td>
                  <td style={{ textAlign: 'center' }}>{item.cantidad}</td>
                  <td style={{ textAlign: 'right' }}>${item.precio_unitario.toFixed(2)}</td>
                  <td style={{ textAlign: 'right' }}>{item.descuento.toFixed(2)} %</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>${item.total.toFixed(2)}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button className="btn-icon danger" onClick={() => removeItem(item.id)}>
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="ticket-actions-grid">
          <button className="btn-secondary" onClick={handleAddTip}><Plus size={14} /> Añadir propina</button>
          <button className="btn-secondary"><Gift size={14} /> Añadir cheque regalo</button>
          <button className="btn-secondary"><DollarSign size={14} /> Añadir anticipo</button>
          <button className="btn-secondary"><Percent size={14} /> Código promoción</button>
          <button className="btn-secondary" onClick={() => setShowProductModal(true)}><Package size={14} /> Añadir producto</button>
        </div>

        <div className="ticket-summary-card">
          <div className="summary-row">
            <span>Base Imponible:</span>
            <span>${(subtotal / 1.16).toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>IVA (16%):</span>
            <span>{(subtotal - (subtotal / 1.16)).toFixed(2)}</span>
          </div>
          {propina > 0 && (
            <div className="summary-row">
              <span>Propina:</span>
              <span>${propina.toFixed(2)}</span>
            </div>
          )}
          <div className="summary-row total" style={{ borderTop: '2px solid var(--border)', paddingTop: 10, marginTop: 10 }}>
            <span>TOTAL:</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>

        {pagos.length > 0 && (
          <div className="pagos-list" style={{ marginTop: 20 }}>
            <h3 style={{ fontSize: 13, marginBottom: 10, fontWeight: 600 }}>Pagos realizados:</h3>
            {pagos.map(p => (
              <div key={p.id} className="pago-item" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--surface-2)', borderRadius: 6, marginBottom: 4, fontSize: 13 }}>
                <span>{p.metodo_pago}</span>
                <span style={{ fontWeight: 600 }}>${p.importe.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: 30, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="pendiente-label" style={{ fontSize: 14 }}>
            Pendiente: <span style={{ fontWeight: 700, color: pendiente > 0 ? 'var(--danger)' : 'var(--success)' }}>${pendiente.toFixed(2)}</span>
          </div>
          <button className="btn-primary" style={{ padding: '12px 24px' }} onClick={() => setShowPagoModal(true)}>
            <Calculator size={18} /> Añadir pago
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="validacion-footer">
        <button className="btn-secondary" onClick={onBack} disabled={saving}>Volver</button>
        <button className="btn-primary" onClick={handleFinalizar} disabled={saving}>
          {saving ? 'Guardando...' : 'Cerrar ticket'}
        </button>
      </div>

      {/* Modals */}
      {showPagoModal && (
        <PagoModal
          pendiente={pendiente}
          onClose={() => setShowPagoModal(false)}
          onAddPago={(p: Pago) => setPagos([...pagos, p])}
        />

      )}


      {showProductModal && (
        <div className="modal-overlay" onClick={() => setShowProductModal(false)}>
          <div className="modal-box" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Añadir producto</h3>
              <button className="btn-icon" onClick={() => setShowProductModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="search-box" style={{ marginBottom: 15, position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-3)' }} />
                <input 
                  type="text" 
                  placeholder="Buscar por nombre o SKU..." 
                  className="form-input"
                  style={{ paddingLeft: 40 }}
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="products-list-scroll" style={{ maxHeight: 300, overflowY: 'auto' }}>
                {filteredProducts.length > 0 ? filteredProducts.map(p => (
                  <div 
                    key={p.id} 
                    className="product-search-item" 
                    style={{ padding: '10px 15px', borderBottom: '1px solid var(--border-color)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}
                    onClick={() => selectProduct(p)}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{p.nombre}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>SKU: {p.sku || 'N/A'} - Stock: {p.stock}</div>
                    </div>
                    <div style={{ fontWeight: 700, color: 'var(--accent)' }}>${p.precio.toFixed(2)}</div>
                  </div>
                )) : (
                  <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
                    No se encontraron productos.
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowProductModal(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
