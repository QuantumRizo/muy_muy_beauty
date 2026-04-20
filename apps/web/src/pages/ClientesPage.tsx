import { useState } from 'react'
import { Search, UserPlus, CalendarPlus } from 'lucide-react'
import { useClientes } from '../hooks/useClientes'
import FormularioCliente from '../components/Clientes/FormularioCliente'
import ClienteDetalleSlideOver from '../components/Clientes/ClienteDetalleSlideOver'
import type { Cliente } from '../types/database'

interface Props {
  onGoToAgenda?: (cliente: Cliente) => void
}

export default function ClientesPage({ onGoToAgenda }: Props) {
  const [query, setQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null)
  const { data: clientes = [], isLoading } = useClientes(query)

  const initials = (name: string) =>
    name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div className="page-header" style={{ padding: '24px 24px 0' }}>
        <div className="page-header-content">
          <h1 className="page-title">Buscador de clientes</h1>
          <p className="page-subtitle">Encuentra o registra un nuevo perfil en el sistema</p>
        </div>
        <div className="page-header-actions">
          <div className="clientes-search-input-wrap" style={{ width: '280px' }}>
            <Search size={15} color="var(--text-3)" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre, teléfono o ID..."
              className="clientes-search-input"
            />
          </div>
          <button onClick={() => setShowForm(true)} className="btn-primary">
            <UserPlus size={14} /> Nuevo cliente
          </button>
        </div>
      </div>

      {/* Results Table */}
      <div className="table-container">
        {isLoading && (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-3)' }}>Buscando...</div>
        )}
        {!isLoading && query.length >= 2 && clientes.length === 0 && (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-3)' }}>
            <div style={{ marginBottom: 8 }}>No se encontraron clientes</div>
            <button onClick={() => setShowForm(true)} className="btn-secondary" style={{ marginTop: 12 }}>
              <UserPlus size={14} /> Crear nuevo
            </button>
          </div>
        )}
        {!isLoading && query.length < 2 && (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-3)' }}>
            <div>Escribe al menos 2 letras para buscar clientes</div>
          </div>
        )}
        {!isLoading && query.length >= 2 && clientes.length > 0 && (
          <table className="data-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Nº Cliente</th>
                <th>Teléfono</th>
                <th>E-mail</th>
                <th>Sucursal</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((c) => (
                <tr 
                  key={c.id} 
                  onClick={() => setSelectedCliente(c)}
                  className="clickable-row"
                >
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="cliente-avatar-sm">{initials(c.nombre_completo)}</div>
                      <span style={{ fontWeight: 500 }}>{c.nombre_completo}</span>
                    </div>
                  </td>
                  <td>#{c.num_cliente}</td>
                  <td>{c.telefono_cel || '—'}</td>
                  <td>{c.email || '—'}</td>
                  <td>{c.sucursal?.nombre || '—'}</td>
                  <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); onGoToAgenda?.(c) }}
                        className="btn-secondary"
                        style={{ padding: '6px 10px', fontSize: 11 }}
                        title="Ir a la Agenda para buscar horario"
                      >
                        <CalendarPlus size={14} /> Agendar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* New client modal */}
        {showForm && (
          <FormularioCliente
            onCreated={() => setShowForm(false)}
            onClose={() => setShowForm(false)}
          />
        )}

        {/* Detail slide-over */}
        {selectedCliente && (
          <ClienteDetalleSlideOver
            cliente={selectedCliente}
            onClose={() => setSelectedCliente(null)}
          />
        )}

        <style>{`
          .clickable-row {
            cursor: pointer;
            transition: background-color 0.1s ease;
          }
          .clickable-row:hover {
            background-color: var(--bg);
          }
        `}</style>
      </div>
    )
  }
