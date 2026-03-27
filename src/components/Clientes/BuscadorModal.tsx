import { useState } from 'react'
import { Search, UserPlus, X } from 'lucide-react'
import { useClientes } from '../../hooks/useClientes'
import type { Cliente } from '../../types/database'

interface Props {
  onSelect: (cliente: Cliente) => void
  onNuevoCliente: () => void
  onClose: () => void
}

export default function BuscadorModal({ onSelect, onNuevoCliente, onClose }: Props) {
  const [query, setQuery] = useState('')
  const { data: clientes = [], isLoading } = useClientes(query)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">Buscar Cliente</h2>
          <button onClick={onClose} className="modal-close-btn">
            <X size={18} />
          </button>
        </div>

        {/* Search Input */}
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            autoFocus
            type="text"
            placeholder="Nombre, teléfono o ID..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="search-input"
          />
        </div>

        {/* Results */}
        <div className="search-results">
          {isLoading && <p className="search-loading">Buscando...</p>}
          {!isLoading && query.length >= 2 && clientes.length === 0 && (
            <p className="search-empty">No se encontró ningún cliente.</p>
          )}
          {clientes.map((c) => (
            <button key={c.id} onClick={() => onSelect(c)} className="search-result-item">
              <div className="search-result-name">{c.nombre_completo}</div>
              <div className="search-result-meta">
                <span>#{c.num_cliente}</span>
                {c.telefono_cel && <span>· {c.telefono_cel}</span>}
                {c.sucursal?.nombre && <span> · {c.sucursal.nombre}</span>}
              </div>
            </button>
          ))}
        </div>

        {/* Nuevo cliente */}
        <div className="modal-footer">
          <button onClick={onNuevoCliente} className="btn-secondary">
            <UserPlus size={15} />
            Nuevo cliente
          </button>
        </div>
      </div>
    </div>
  )
}
