import { useState } from 'react'
import { X, Lock, FileText, User, Clock, Trash2, Unlock } from 'lucide-react'
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
  const [showConfirm, setShowConfirm] = useState(false)
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
            onClick={() => setShowConfirm(true)} 
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
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>¿Eliminar bloqueo?</h3>
            <p style={{ fontSize: 14, color: 'var(--text-3)', lineHeight: '1.5', marginBottom: 24 }}>
              Estás a punto de eliminar este bloqueo del <strong style={{ color: 'var(--accent)' }}>{dateStr}</strong>. <br/>Esta acción no se puede deshacer.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button 
                className="btn-primary" 
                style={{ background: 'var(--danger)', width: '100%', padding: '12px' }}
                onClick={() => {
                  onDelete(bloqueo.id)
                  onClose()
                }}
              >
                Sí, eliminar bloqueo
              </button>
              <button className="btn-secondary" style={{ width: '100%', padding: '12px' }} onClick={() => setShowConfirm(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
