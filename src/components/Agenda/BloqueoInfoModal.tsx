import { X, Lock, FileText, User, Clock, Trash2 } from 'lucide-react'
import type { BloqueoAgenda, Empleada } from '../../types/database'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

interface Props {
  bloqueo: BloqueoAgenda
  empleadas: Empleada[]
  onClose: () => void
  onDelete: (id: string) => void
}

export default function BloqueoInfoModal({ bloqueo, empleadas, onClose, onDelete }: Props) {
  const empleada = empleadas.find((e) => e.id === bloqueo.empleada_id)
  
  const dateObj = parseISO(bloqueo.fecha)
  const dateStr = format(dateObj, "EEEE d 'de' MMMM", { locale: es })
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 360 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Lock size={18} style={{ color: '#ef4444' }} />
            <h2 className="modal-title">Detalle de Bloqueo</h2>
          </div>
          <button onClick={onClose} className="modal-close-btn">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <FileText size={16} style={{ color: 'var(--text-3)' }} />
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase' }}>Motivo</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-1)' }}>{bloqueo.motivo || 'Sin motivo especificado'}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <User size={16} style={{ color: 'var(--text-3)' }} />
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase' }}>Profesional</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-1)' }}>{empleada?.nombre || 'Todas'}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Clock size={16} style={{ color: 'var(--text-3)' }} />
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase' }}>Horario</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-1)', textTransform: 'capitalize' }}>
                {dateStr} <br />
                <span style={{ color: 'var(--accent)' }}>{bloqueo.hora_inicio} a {bloqueo.hora_fin}</span>
              </div>
            </div>
          </div>

        </div>

        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <button 
            onClick={() => {
              onDelete(bloqueo.id)
              onClose() // Optimizamos cerrar de inmediato, AgendaPage igual mostrará el confirm box
            }} 
            className="btn-danger-ghost"
          >
            <Trash2 size={15} />
            Desbloquear
          </button>
          
          <button onClick={onClose} className="btn-secondary">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
