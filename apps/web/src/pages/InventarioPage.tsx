import { useState } from 'react'
import { Search, Plus, Package, Edit2 } from 'lucide-react'
import { useProductos } from '../hooks/useProductos'
import FormularioProducto from '../components/Inventario/FormularioProducto'
import type { Producto } from '../types/database'

export default function InventarioPage() {
  const [query, setQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingProd, setEditingProd] = useState<Producto | null>(null)
  
  const { data: productos = [], isLoading } = useProductos(query)

  const handleEdit = (prod: Producto) => {
    setEditingProd(prod)
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setEditingProd(null)
    setShowForm(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div className="page-header" style={{ padding: '24px 24px 0', marginBottom: 24 }}>
        <div className="page-header-content">
          <h1 className="page-title">Inventario</h1>
          <p className="page-subtitle">Gestiona el stock, precios y catálogo de productos para venta</p>
        </div>
        <div className="page-header-actions">
          <div className="clientes-search-input-wrap" style={{ width: '280px' }}>
            <Search size={15} color="var(--text-3)" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre o SKU..."
              className="clientes-search-input"
            />
          </div>
          <button onClick={() => setShowForm(true)} className="btn-primary">
            <Plus size={14} /> Nuevo producto
          </button>
        </div>
      </div>

      {/* Results Table */}
      <div className="table-container">
        {isLoading ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-3)' }}>Cargando catálogo...</div>
        ) : productos.length === 0 ? (
          <div style={{ padding: 64, textAlign: 'center', color: 'var(--text-3)' }}>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center' }}>
              <Package size={48} opacity={0.2} />
            </div>
            <div style={{ marginBottom: 8, fontSize: 16, fontWeight: 500, color: 'var(--text-2)' }}>
              No se encontraron productos
            </div>
            {query.length === 0 && (
              <button onClick={() => setShowForm(true)} className="btn-secondary" style={{ marginTop: 16 }}>
                <Plus size={14} /> Registrar primer producto
              </button>
            )}
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>SKU</th>
                <th style={{ textAlign: 'right' }}>Costo</th>
                <th style={{ textAlign: 'right' }}>Venta</th>
                <th style={{ textAlign: 'right' }}>Stock Disponible</th>
                <th style={{ textAlign: 'center' }}>Estado</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productos.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{p.nombre}</div>
                    {p.descripcion && <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 2 }}>{p.descripcion}</div>}
                  </td>
                  <td>{p.sku || '—'}</td>
                  <td style={{ textAlign: 'right', color: 'var(--text-3)' }}>${(p.precio_costo || 0).toFixed(2)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>${p.precio.toFixed(2)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <span style={{ 
                      fontWeight: p.stock <= 5 ? 700 : 500, 
                      color: p.stock <= 5 ? (p.stock === 0 ? 'var(--danger)' : 'var(--accent)') : 'inherit'
                    }}>
                      {p.stock}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-flex',
                      padding: '4px 10px',
                      borderRadius: 20,
                      fontSize: 11,
                      fontWeight: 600,
                      background: p.activo ? 'var(--success-bg)' : 'var(--bg-1)',
                      color: p.activo ? 'var(--success)' : 'var(--text-3)'
                    }}>
                      {p.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button 
                      onClick={() => handleEdit(p)}
                      className="btn-secondary" 
                      style={{ padding: '6px 12px', fontSize: 12 }}
                    >
                      <Edit2 size={13} style={{ marginRight: 6 }} /> Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <FormularioProducto 
          productoBase={editingProd}
          onClose={handleCloseForm} 
        />
      )}
    </div>
  )
}
