import { useState } from 'react'
import { X, Unlock } from 'lucide-react'
import { format } from 'date-fns'
import { useEliminarBloqueosMasivo } from '../../hooks/useCitas'
import type { Empleada } from '../../types/database'
import DatePicker from '../Common/DatePicker'
import { useToast } from '../Common/Toast'

interface Props {
  empleadas: Empleada[]
  onClose: () => void
}

export default function DesbloqueoModal({ empleadas, onClose }: Props) {
  const [fechaInicio, setFechaInicio] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [fechaFin, setFechaFin] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [siempre, setSiempre] = useState(false)
  const [selectedEmpleadas, setSelectedEmpleadas] = useState<string[]>([])
  const [showConfirm, setShowConfirm] = useState(false)
  
  const eliminarMasivo = useEliminarBloqueosMasivo()
  const toast = useToast()

  const handleToggleEmpleada = (id: string) => {
    setSelectedEmpleadas((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const handleToggleAllEmpleadas = () => {
    if (selectedEmpleadas.length === empleadas.length) {
      setSelectedEmpleadas([])
    } else {
      setSelectedEmpleadas(empleadas.map((e) => e.id))
    }
  }

  const handleConfirmAction = async () => {
    try {
      // Si "siempre" es verdadero, mandamos una fecha en el futuro muy lejana
      const fechaFinReal = siempre ? '2099-12-31' : fechaFin

      await eliminarMasivo.mutateAsync({
        fechaInicio,
        fechaFin: fechaFinReal,
        empleadasIds: selectedEmpleadas
      })
      toast('Bloqueos eliminados correctamente', 'success')
      onClose()
    } catch (err) {
      console.error(err)
      toast('Error al eliminar bloqueos', 'error')
    } finally {
      setShowConfirm(false)
    }
  }

  const handleDesbloquear = () => {
    if (selectedEmpleadas.length === 0) {
      toast('Por favor selecciona al menos una cabina', 'warning')
      return
    }
    setShowConfirm(true)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box bloqueos-modal animate-in" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Unlock size={20} color="var(--accent)" /> Desbloqueo masivo
          </h2>
          <button onClick={onClose} className="btn-icon">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20, lineHeight: 1.5 }}>
            Selecciona un rango de fechas y las cabinas para eliminar todos los bloqueos establecidos en ese periodo.
          </div>

          {/* Rango de Fechas */}
          <div className="bloqueo-row" style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <DatePicker 
                label="Desde"
                value={fechaInicio}
                onChange={setFechaInicio}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ opacity: siempre ? 0.4 : 1, pointerEvents: siempre ? 'none' : 'auto', transition: 'all 0.2s' }}>
                <DatePicker 
                  label="Hasta"
                  value={fechaFin}
                  onChange={setFechaFin}
                  minDate={fechaInicio}
                />
              </div>
            </div>
          </div>

          <label className="custom-checkbox" style={{ marginBottom: 24, display: 'inline-flex' }}>
            <input
              type="checkbox"
              checked={siempre}
              onChange={(e) => setSiempre(e.target.checked)}
            />
            <div className="checkmark"></div>
            <span style={{ fontSize: 13, fontWeight: 500 }}>De ahora en adelante (sin límite)</span>
          </label>

          {/* Empleadas (Cabinas) */}
          <div className="bloqueo-section">
            <label className="section-label">Cabinas a desbloquear</label>
            <div className="cabinas-grid">
              {empleadas.map((emp) => (
                <label key={emp.id} className="custom-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedEmpleadas.includes(emp.id)}
                    onChange={() => handleToggleEmpleada(emp.id)}
                  />
                  <div className="checkmark"></div>
                  <span>{emp.nombre.split(' ')[0]}</span>
                </label>
              ))}
            </div>
            <div className="all-cabinas" style={{ marginTop: 12, paddingTop: 12 }}>
              <label className="custom-checkbox">
                <input
                  type="checkbox"
                  checked={selectedEmpleadas.length === empleadas.length && empleadas.length > 0}
                  onChange={handleToggleAllEmpleadas}
                />
                <div className="checkmark"></div>
                <span style={{ fontWeight: 600 }}>(Todas las cabinas)</span>
              </label>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary">Cancelar</button>
          <button 
            onClick={handleDesbloquear} 
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            disabled={eliminarMasivo.isPending || selectedEmpleadas.length === 0}
          >
            {eliminarMasivo.isPending ? 'Procesando...' : 'Confirmar Desbloqueo'}
          </button>
        </div>
      </div>

      {/* CONFIRM MODAL */}
      {showConfirm && (
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
        }} onClick={() => setShowConfirm(false)}>
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
              background: 'var(--danger-bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px'
            }}>
              <Unlock size={28} color="var(--danger)" />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>¿Desbloquear horarios?</h3>
            <p style={{ fontSize: 14, color: 'var(--text-3)', lineHeight: '1.5', marginBottom: 24 }}>
              Estás a punto de eliminar <strong style={{ color: 'var(--accent)' }}>TODOS los bloqueos</strong> en este rango de fechas para las cabinas seleccionadas. <br/>Esta acción no se puede deshacer.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button 
                className="btn-primary" 
                style={{ background: 'var(--danger)', width: '100%', padding: '12px' }}
                onClick={handleConfirmAction}
                disabled={eliminarMasivo.isPending}
              >
                {eliminarMasivo.isPending ? 'Eliminando...' : 'Sí, eliminar bloqueos'}
              </button>
              <button className="btn-secondary" style={{ width: '100%', padding: '12px' }} onClick={() => setShowConfirm(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
