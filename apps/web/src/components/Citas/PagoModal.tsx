import { useState } from 'react'
import { X } from 'lucide-react'
import type { MetodoPago, Pago } from '../../types/database'
import { format } from 'date-fns'
import { useToast } from '../Common/Toast'

interface Props {
  pendiente: number
  onClose: () => void
  onAddPago: (pago: Pago) => void
}

export default function PagoModal({ pendiente, onClose, onAddPago }: Props) {

  const [metodo, setMetodo] = useState<MetodoPago>('Efectivo')
  const [importe, setImporte] = useState(pendiente)
  const [entregado, setEntregado] = useState(pendiente)
  const toast = useToast()

  const cambio = Math.max(0, entregado - importe)

  const handleConfirm = () => {
    if (importe <= 0) {
      toast('El importe debe ser mayor a 0', 'warning')
      return
    }
    if (importe > pendiente + 0.01) {
      toast(`El importe no puede ser mayor al saldo pendiente ($${pendiente.toFixed(2)})`, 'warning')
      return
    }
    onAddPago({
      id: crypto.randomUUID(),
      ticket_id: '',
      metodo_pago: metodo,
      importe,
      detalles: { entregado, cambio },
      fecha: format(new Date(), 'yyyy-MM-dd'),
      hora: format(new Date(), 'HH:mm:ss')
    })
    onClose() // Cerrar tras confirmar
  }


  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Añadir Pago</h2>
          <button onClick={onClose} className="btn-icon"><X size={18}/></button>
        </div>
        <div className="modal-body">
          <div className="form-group" style={{ marginBottom: 15 }}>
            <label style={{ display: 'block', marginBottom: 5, fontSize: 13, fontWeight: 600 }}>Forma de pago</label>
            <select 
              value={metodo} 
              onChange={e => {
                const newMetodo = e.target.value as MetodoPago
                setMetodo(newMetodo)
              }} 
              className="form-input"
            >
              <option value="Efectivo">Efectivo</option>
              <option value="Tarjeta">Tarjeta (Visa/Mastercard)</option>
              <option value="Transferencia">Transferencia</option>
              <option value="Bono">Bono / Sesión</option>
              <option value="Puntos">Puntos</option>
              <option value="Anticipo">Anticipo</option>
              <option value="Aplazado">Aplazado (Fiar / Deuda)</option>
              <option value="Otros">Otros</option>
            </select>
          </div>
          
          <div className="form-group" style={{ marginBottom: 15 }}>
            <label style={{ display: 'block', marginBottom: 5, fontSize: 13, fontWeight: 600 }}>Importe a pagar</label>
            <input 
              type="number" 
              className="form-input" 
              value={importe} 
              onChange={e => {
                const val = Number(e.target.value)
                setImporte(val)
                setEntregado(val)
              }} 
            />
          </div>

          {metodo === 'Efectivo' && (
            <div style={{ background: 'var(--surface-2)', padding: 15, borderRadius: 8 }}>
              <div className="form-group" style={{ marginBottom: 15 }}>
                <label style={{ display: 'block', marginBottom: 5, fontSize: 13, fontWeight: 600 }}>Cantidad entregada</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={entregado} 
                  onChange={e => setEntregado(Number(e.target.value))} 
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: 5, fontSize: 13, fontWeight: 600 }}>Cantidad a devolver</label>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent)' }}>
                  ${cambio.toFixed(2)}
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={handleConfirm}>
            Confirmar pago
          </button>
        </div>
      </div>
    </div>
  )
}
