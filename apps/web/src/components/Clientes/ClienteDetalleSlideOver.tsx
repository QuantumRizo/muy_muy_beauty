import { useState } from 'react'
import { X, Phone, Mail, MapPin, Calendar, Receipt, FileText, ChevronRight, Save, Clock } from 'lucide-react'
import { useCitasCliente } from '../../hooks/useCitas'
import { useTicketsCliente } from '../../hooks/useTickets'
import { useActualizarCliente } from '../../hooks/useClientes'
import { useToast } from '../Common/Toast'
import type { Cliente } from '../../types/database'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

interface Props {
  cliente: Cliente
  onClose: () => void
}

export default function ClienteDetalleSlideOver({ cliente, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<'citas' | 'tickets' | 'notas'>('citas')
  const [notas, setNotas] = useState(cliente.datos_extra?.notas || '')
  const [isEditingNotas, setIsEditingNotas] = useState(false)
  
  const { data: citas = [], isLoading: isLoadingCitas } = useCitasCliente(cliente.id)
  const { data: tickets = [], isLoading: isLoadingTickets } = useTicketsCliente(cliente.id)
  const actualizarCliente = useActualizarCliente()
  const toast = useToast()

  const handleSaveNotas = async () => {
    try {
      await actualizarCliente.mutateAsync({
        id: cliente.id,
        updates: { datos_extra: { ...cliente.datos_extra, notas } }
      })
      setIsEditingNotas(false)
      toast('Notas actualizadas', 'success')
    } catch (err) {
      console.error(err)
      toast('Error al guardar notas', 'error')
    }
  }

  const initials = (name: string) =>
    name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('')

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Finalizada': return 'var(--success)'
      case 'Cancelada': return 'var(--danger)'
      case 'Programada': return 'var(--accent)'
      case 'En curso': return '#3b82f6'
      default: return 'var(--text-3)'
    }
  }

  return (
    <div className="slide-over-overlay" onClick={onClose}>
      <div className="slide-over-content" onClick={e => e.stopPropagation()}>
        {/* Header Section */}
        <div className="slide-over-header">
          <button className="btn-icon" onClick={onClose} style={{ position: 'absolute', right: 20, top: 20 }}>
            <X size={20} />
          </button>
          
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginTop: 10 }}>
            <div className="cliente-avatar-lg">
              {initials(cliente.nombre_completo)}
            </div>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: 'var(--text-1)' }}>
                {cliente.nombre_completo}
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 2 }}>
                Cliente #{cliente.num_cliente} • Registrado {format(new Date(cliente.created_at), 'MMMM yyyy', { locale: es })}
              </p>
            </div>
          </div>

          <div className="cliente-quick-info">
            <div className="info-item">
              <Phone size={14} />
              <span>{cliente.telefono_cel || 'Sin teléfono'}</span>
            </div>
            <div className="info-item">
              <Mail size={14} />
              <span>{cliente.email || 'Sin correo'}</span>
            </div>
            <div className="info-item">
              <MapPin size={14} />
              <span>{cliente.sucursal?.nombre || 'Sucursal desconocida'}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="slide-over-tabs">
          <button 
            className={`tab-item ${activeTab === 'citas' ? 'active' : ''}`}
            onClick={() => setActiveTab('citas')}
          >
            <Calendar size={15} /> Citas
          </button>
          <button 
            className={`tab-item ${activeTab === 'tickets' ? 'active' : ''}`}
            onClick={() => setActiveTab('tickets')}
          >
            <Receipt size={15} /> Historial Ventas
          </button>
          <button 
            className={`tab-item ${activeTab === 'notas' ? 'active' : ''}`}
            onClick={() => setActiveTab('notas')}
          >
            <FileText size={15} /> Notas Perfil
          </button>
        </div>

        {/* Tab Content */}
        <div className="slide-over-body">
          {activeTab === 'citas' && (
            <div className="history-list animate-in">
              <h3 className="section-title">Últimas citas</h3>
              {isLoadingCitas ? (
                <p className="loading-text">Cargando historial...</p>
              ) : citas.length === 0 ? (
                <div className="empty-state-mini">Sin citas registradas</div>
              ) : (
                citas.map(cita => (
                  <div key={cita.id} className="history-card">
                    <div className="card-left">
                      <div className="date-badge">
                        <span className="day">{format(parseISO(cita.fecha), 'dd')}</span>
                        <span className="month">{format(parseISO(cita.fecha), 'MMM', { locale: es })}</span>
                      </div>
                    </div>
                    <div className="card-main">
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span className="sc-status" style={{ color: getStatusColor(cita.estado), borderColor: getStatusColor(cita.estado) }}>
                          {cita.estado}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{cita.bloque_inicio}</span>
                      </div>
                      <div className="sc-services">
                        {cita.servicios?.map(s => s.nombre).join(', ') || 'Sin servicios'}
                      </div>
                      <div className="sc-footer">
                        <Clock size={11} /> {cita.empleada?.nombre || 'Personal no asignado'}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'tickets' && (
            <div className="history-list animate-in">
              <h3 className="section-title">Consumos recientes</h3>
              {isLoadingTickets ? (
                <p className="loading-text">Cargando tickets...</p>
              ) : tickets.length === 0 ? (
                <div className="empty-state-mini">Sin tickets registrados</div>
              ) : (
                tickets.map(t => (
                  <div key={t.id} className="ticket-item-row">
                    <div className="t-info">
                      <span className="t-folio">{t.num_ticket}</span>
                      <span className="t-date">{format(parseISO(t.fecha), 'dd/MM/yyyy')}</span>
                    </div>
                    <div className="t-amount">${t.total.toFixed(2)}</div>
                    <ChevronRight size={14} color="var(--text-3)" />
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'notas' && (
            <div className="notes-container animate-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 className="section-title" style={{ margin: 0 }}>Notas del cliente</h3>
                {!isEditingNotas ? (
                  <button className="btn-ghost" onClick={() => setIsEditingNotas(true)}>Editar</button>
                ) : (
                  <button className="btn-primary" style={{ padding: '4px 10px', fontSize: 11 }} onClick={handleSaveNotas}>
                    <Save size={12} /> Guardar
                  </button>
                )}
              </div>
              
              {isEditingNotas ? (
                <textarea 
                  className="form-input"
                  style={{ width: '100%', minHeight: 200, padding: 12, fontSize: 13 }}
                  value={notas}
                  onChange={e => setNotas(e.target.value)}
                  autoFocus
                  placeholder="Escribe notas importantes (alergias, gustos, preferencias...)"
                />
              ) : (
                <div className="notes-view">
                  {notas ? notas : <span style={{ color: 'var(--text-3)', fontStyle: 'italic' }}>Sin notas adicionales registradas</span>}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .slide-over-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.15);
          backdrop-filter: blur(4px);
          z-index: 1000;
          display: flex;
          justify-content: flex-end;
          animation: fadeIn 0.2s ease-out;
        }

        .slide-over-content {
          width: 40%;
          min-width: 450px;
          background: var(--surface);
          height: 100%;
          box-shadow: -10px 0 30px rgba(0,0,0,0.1);
          display: flex;
          flex-direction: column;
          animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          border-left: 1px solid var(--border);
        }

        .slide-over-header {
          padding: 40px 32px 24px;
          background: linear-gradient(to bottom, var(--bg) 0%, var(--surface) 100%);
        }

        .cliente-avatar-lg {
          width: 64px;
          height: 64px;
          border-radius: 20px;
          background: var(--accent-light);
          color: var(--accent);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: 800;
          box-shadow: 0 4px 12px rgba(136, 176, 75, 0.2);
        }

        .cliente-quick-info {
          display: flex;
          gap: 20px;
          margin-top: 24px;
        }

        .info-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: var(--text-2);
        }

        .slide-over-tabs {
          display: flex;
          padding: 0 32px;
          border-bottom: 1px solid var(--border);
          gap: 24px;
        }

        .tab-item {
          padding: 12px 0;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-3);
          background: none;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          position: relative;
          transition: color 0.2s;
        }

        .tab-item:hover { color: var(--text-1); }
        .tab-item.active { color: var(--accent); }
        .tab-item.active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--accent);
        }

        .slide-over-body {
          flex: 1;
          overflow-y: auto;
          padding: 32px;
        }

        .section-title {
          font-size: 11px;
          font-weight: 800;
          color: var(--text-3);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 16px;
        }

        .history-card {
          display: flex;
          gap: 16px;
          padding: 16px;
          background: var(--bg);
          border-radius: 16px;
          margin-bottom: 12px;
          border: 1px solid var(--border-2);
          transition: transform 0.2s;
        }

        .history-card:hover { 
          transform: translateY(-2px);
          border-color: var(--accent-light);
        }

        .date-badge {
          width: 50px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: var(--surface);
          border-radius: 12px;
          padding: 6px 0;
          border: 1px solid var(--border);
        }

        .date-badge .day { font-size: 18px; font-weight: 800; }
        .date-badge .month { font-size: 10px; text-transform: uppercase; font-weight: 600; color: var(--text-3); }
        
        .card-main { flex: 1; display: flex; flex-direction: column; gap: 4px; }
        
        .sc-status {
          font-size: 9px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 10px;
          border: 1px solid currentColor;
          text-transform: uppercase;
        }

        .sc-services { font-size: 13px; font-weight: 600; color: var(--text-1); margin-top: 2px; }
        .sc-footer { font-size: 11px; color: var(--text-3); display: flex; alignItems: center; gap: 4px; margin-top: 2px; }

        .ticket-item-row {
          display: flex;
          align-items: center;
          padding: 14px 16px;
          background: var(--bg);
          border-radius: 12px;
          margin-bottom: 8px;
          border: 1px solid var(--border-2);
          cursor: pointer;
          transition: all 0.2s;
        }

        .ticket-item-row:hover { background: var(--surface); border-color: var(--border); }

        .t-info { flex: 1; display: flex; flex-direction: column; }
        .t-folio { font-size: 13px; font-weight: 700; }
        .t-date { font-size: 11px; color: var(--text-3); }
        .t-amount { font-size: 14px; font-weight: 800; color: var(--text-1); margin-right: 12px; }

        .notes-view {
          padding: 16px;
          background: var(--bg);
          border-radius: 16px;
          font-size: 14px;
          line-height: 1.6;
          color: var(--text-2);
          min-height: 100px;
        }

        .empty-state-mini {
          padding: 40px;
          text-align: center;
          color: var(--text-3);
          font-size: 13px;
          font-style: italic;
        }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
      `}</style>
    </div>
  )
}
