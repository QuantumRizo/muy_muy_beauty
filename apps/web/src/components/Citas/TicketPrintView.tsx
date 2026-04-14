import type { Cita, TicketItem, Pago } from '../../types/database'

interface TicketPrintViewProps {
  cita: Cita
  ticketData: {
    numTicket: string
    fechaStr: string
    vendedor: string
    items: TicketItem[]
    subtotal: number
    iva: number
    total: number
    descuento: number
    pagos: Pago[]
    pendiente: number
  }
}

export default function TicketPrintView({ cita, ticketData }: TicketPrintViewProps) {
  const montoBaseParaIva = ticketData.subtotal - (ticketData.descuento || 0)
  const baseImponible = montoBaseParaIva / 1.16
  const cuotaIva = montoBaseParaIva - baseImponible
  const fechaSoloDia = ticketData.fechaStr.split(' ')[0] || ticketData.fechaStr

  return (
    <div id="printable-ticket" className="ticket-print-wrapper visible-in-screen">
      <div className="ticket-print-content">
        {/* Header - Fechas */}
        <div className="ticket-print-header-top">
          <span>{ticketData.fechaStr}</span>
        </div>

        {/* Info Sucursal */}
        <div className="ticket-print-company-info">
          <h3>d-uñas {cita.sucursal?.nombre}</h3>
          <p>{cita.sucursal?.direccion}</p>
          <p>Telf. {cita.sucursal?.telefono} - {cita.sucursal?.rfc}</p>
        </div>

        {/* Factura Title */}
        <h2 className="ticket-print-title">FACTURA</h2>

        {/* Ticket Meta */}
        <div className="ticket-print-meta">
          <div className="meta-row">
            <span className="meta-label">Número:</span>
            <span className="meta-value">{ticketData.numTicket}</span>
          </div>
          <div className="meta-row">
            <span className="meta-label">Fecha:</span>
            <span className="meta-value">{ticketData.fechaStr}</span>
          </div>
          <div className="meta-row">
            <span className="meta-label">Le atendió:</span>
            <span className="meta-value">{ticketData.vendedor || '—'}</span>
          </div>
        </div>

        {/* Cliente Name */}
        <div className="ticket-print-client-name">
          {cita.cliente?.nombre_completo?.toUpperCase() || 'CLIENTE MOSTRADOR'}
        </div>

        {/* Tabla Items */}
        <table className="ticket-print-table">
          <thead>
            <tr>
              <th className="align-center width-uds">Uds.</th>
              <th className="align-left width-concepto">Concepto</th>
              <th className="align-center width-dto">Dto.</th>
              <th className="align-right width-pvp">PVP</th>
            </tr>
          </thead>
          <tbody>
            {ticketData.items.map((item, index) => (
              <tr key={item.id || index}>
                <td className="align-center">{item.cantidad}</td>
                <td className="align-left">
                  {item.nombre}
                  {item.vendedor_nombre && (
                    <span style={{ display: 'block', fontSize: 10, color: '#555', marginTop: 2 }}>
                      Atendió: {item.vendedor_nombre}
                    </span>
                  )}
                </td>
                <td className="align-center">{item.descuento > 0 ? `${item.descuento}%` : ''}</td>
                <td className="align-right">{item.total.toFixed(2)} $</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Resumen IVA */}
        <div className="ticket-print-iva-summary">
          <div className="iva-col">IVA 16%</div>
          <div className="iva-col">Base Imponible: {baseImponible.toFixed(2)} $</div>
          <div className="iva-col">Cuota: {cuotaIva.toFixed(2)} $</div>
        </div>

        {/* Total Compra */}
        <div className="ticket-print-total-compra">
          {ticketData.descuento > 0 && (
            <div className="total-row" style={{ fontSize: 12, marginBottom: 5 }}>
              <span>Subtotal: {ticketData.subtotal.toFixed(2)} $</span>
              <span>Descuento: -{ticketData.descuento.toFixed(2)} $</span>
            </div>
          )}
          <div className="total-row">
            <span>Total compra:</span>
            <span className="total-amount">{ticketData.total.toFixed(2)} $</span>
          </div>
        </div>

        {/* Pagos */}
        {ticketData.pagos.length > 0 && (
          <div className="ticket-print-pagos">
            <div className="pagos-header">
              <span>Pagos</span>
            </div>
            {ticketData.pagos.map((p, i) => (
              <div key={i} className="pago-row">
                <span>{fechaSoloDia}</span>
                <span>{p.metodo_pago}</span>
                <span>{p.importe.toFixed(2)} $</span>
              </div>
            ))}
          </div>
        )}

        {/* Total Aplazado (Pendiente) */}
        <div className="ticket-print-pendiente">
          <div className="pendiente-row">
            <span>Total Aplazado</span>
            <span className="pendiente-amount">{ticketData.pendiente.toFixed(2)} $</span>
          </div>
        </div>
        
      </div>
    </div>
  )
}
