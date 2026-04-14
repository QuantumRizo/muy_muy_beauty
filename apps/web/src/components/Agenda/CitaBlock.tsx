import { CheckCircle2 } from 'lucide-react'
import type { Cita } from '../../types/database'

interface Props {
  cita: Cita
  top: number
  height: number
  color: string
  onClick: () => void
}

export default function CitaBlock({ cita, top, height, color, onClick }: Props) {
  const isValidada = cita.estado === 'Finalizada'
  const isCancelada = cita.estado === 'Cancelada' || cita.estado === 'No asistió'
  const nombre = cita.cliente?.nombre_completo ?? '—'
  const servicios = (cita.servicios ?? []).map((s) => s.nombre).join(', ')

  return (
    <div
      onClick={onClick}
      className="cita-block"
      style={{
        top,
        height: Math.max(height, 28),
        backgroundColor: isCancelada
          ? '#374151'
          : `${color}22`,
        borderLeft: `3px solid ${isCancelada ? '#6B7280' : color}`,
        opacity: isCancelada ? 0.6 : 1,
      }}
    >
      <div className="cita-block-inner">
        <div className="cita-nombre">
          {isValidada && <CheckCircle2 size={11} className="cita-check" />}
          <span>{nombre}</span>
        </div>
        {height > 32 && (
          <div className="cita-servicios">{servicios}</div>
        )}
      </div>
    </div>
  )
}
