import { useState, useMemo, useEffect } from 'react'
import { Search, ChevronDown, Calendar, ChevronRight, ChevronLeft, ChevronsUpDown } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { CATEGORIAS, INDICATOR_CONFIG, formatCell } from '../lib/reportConfig'
import { runQuery } from '../lib/reportQueries'
import type { Sucursal } from '../types/database'
import { useToast } from '../components/Common/Toast'

export default function EstadisticasPage() {
  const toast = useToast()

  // ─── Selector state ───────────────────────────────────────
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [openCats, setOpenCats] = useState<string[]>([])

  // ─── Filters state ────────────────────────────────────────
  const [fechaInicio, setFechaInicio] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
  })
  const [fechaFin, setFechaFin] = useState(() => new Date().toISOString().split('T')[0])
  const [sucursalId, setSucursalId] = useState<string>('all')
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [desglose, setDesglose] = useState<string>('sucursal')
  const [sort, setSort] = useState<string>('cantidad_desc')

  // ─── Result state ─────────────────────────────────────────
  const [calculating, setCalculating] = useState(false)
  const [resultado, setResultado] = useState<any>(null)

  // ─── Pagination state ─────────────────────────────────────
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  // ─── Current indicator config ─────────────────────────────
  const config = selectedId ? INDICATOR_CONFIG[selectedId] : null

  // ─── Sync desglose/sort when indicator changes ────────────
  useEffect(() => {
    if (config) {
      setDesglose(config.defaultDesglose)
      setSort(config.defaultSort)
      setResultado(null)
      setPage(1)
    }
  }, [selectedId])

  // ─── Load branches ────────────────────────────────────────
  useEffect(() => {
    supabase.from('sucursales').select('*').order('nombre').then(({ data }) => {
      if (data) setSucursales(data)
    })
  }, [])

  // ─── Helpers ──────────────────────────────────────────────
  const toggleCat = (id: string) =>
    setOpenCats(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id])

  const selectedLabel = useMemo(() => config?.nombre ?? 'Busca o selecciona', [config])

  const filteredCats = useMemo(() => {
    if (!search) return CATEGORIAS
    return CATEGORIAS.map(cat => ({
      ...cat,
      items: cat.items.filter(i => i.nombre.toLowerCase().includes(search.toLowerCase()))
    })).filter(cat => cat.items.length > 0)
  }, [search])

  // ─── Calculate ────────────────────────────────────────────
  const handleCalculate = async () => {
    if (!selectedId) return
    setCalculating(true)
    setResultado(null)
    setPage(1)
    try {
      const result = await runQuery(selectedId, desglose, sort, fechaInicio, fechaFin, sucursalId)
      setResultado(result)
    } catch (err: any) {
      console.error(err)
      toast(`Error al calcular: ${err.message}`, 'error')
    } finally {
      setCalculating(false)
    }
  }

  // ─── Exportar a Excel (CSV nativo UTF-8) ────────────────
  const handleExportExcel = () => {
    if (!resultado || !config) return

    // 1. Cabeceras
    const headers = config.columns.map(c => `"${c.label.replace(/"/g, '""')}"`)
    
    // 2. Filas (limpiando comillas y usando punto para decimales)
    const rows = resultado.rows.map((row: any) => {
      return config.columns.map(c => {
        let val = row[c.key]
        if (c.type === 'money' && typeof val === 'number') val = val.toFixed(2)
        if (val === null || val === undefined) val = ''
        return `"${String(val).replace(/"/g, '""')}"`
      })
    })

    // 3. Totales (Footer)
    const footer = config.columns.map((col, i) => {
      if (i === 0) return '"Total:"'
      if (col.key === 'nombre' || col.key === 'tratamiento') return '""'
      if (col.type === 'percent') return '"100%"'
      if (col.type === 'money') return `"${resultado.totals.total?.toFixed(2) || '0.00'}"`
      if (col.key === 'cantidad') return `"${resultado.totals.cantidad || '0'}"`
      return '"-"'
    })

    // Construir CSV usando separador ';' para que Excel (Latam/España) lo auto-divida en columnas
    const csvContent = [
      headers.join(';'),
      ...rows.map((r: string[]) => r.join(';')),
      footer.join(';')
    ].join('\n')

    // El BOM (Byte Order Mark) le dice a Excel que esto es nativo UTF-8 y no Windows-1252. Conserva los acentos.
    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
    
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    // Nombre de archivo amigable
    const safeName = config.nombre.replace(/[/\\?%*:|"<>]/g, '-').replace(/\s+/g, '_')
    link.setAttribute('download', `Estadisticas_${safeName}_${fechaInicio}_al_${fechaFin}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // ─── Render ───────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div className="page-header" style={{ padding: '24px 24px 0', marginBottom: 24 }}>
        <div className="page-header-content">
          <h1 className="page-title">Estadísticas</h1>
          <p className="page-subtitle">Genera reportes operativos y financieros detallados</p>
        </div>
      </div>

      <div className="page-content" style={{ padding: '0 24px 24px' }}>
        <div className="stats-card">
        {/* Indicator selector */}
        <div className="stats-section-label">Elige un indicador</div>
        <div className="indicator-selector-wrap">
          <div
            className={`indicator-selector-trigger ${isOpen ? 'open' : ''}`}
            onClick={() => setIsOpen(!isOpen)}
          >
            <div className="indicator-placeholder">
              {selectedId
                ? <span className="selected-text">{selectedLabel}</span>
                : 'Busca o selecciona'}
            </div>
            <ChevronDown size={20} className={`arrow ${isOpen ? 'up' : ''}`} />
          </div>

          {isOpen && (
            <div className="indicator-dropdown">
              <div className="dropdown-search">
                <Search size={16} />
                <input
                  autoFocus
                  placeholder="Buscar indicador..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onClick={e => e.stopPropagation()}
                />
              </div>
              <div className="dropdown-list">
                {filteredCats.map(cat => (
                  <div key={cat.id} className="dropdown-cat-group">
                    <div
                      className="dropdown-cat-header"
                      onClick={e => { e.stopPropagation(); toggleCat(cat.id) }}
                    >
                      <span>{cat.nombre}</span>
                      <ChevronRight size={16} className={`cat-arrow ${openCats.includes(cat.id) ? 'down' : ''}`} />
                    </div>
                    {openCats.includes(cat.id) && (
                      <div className="dropdown-items">
                        {cat.items.map(item => (
                          <div
                            key={item.id}
                            className={`dropdown-item ${selectedId === item.id ? 'active' : ''}`}
                            onClick={e => { e.stopPropagation(); setSelectedId(item.id); setIsOpen(false) }}
                          >
                            {item.nombre}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="stats-filters-grid">
          {/* Visualización */}
          <div className="filter-group-box">
            <div className="filter-box-label">Visualización</div>
            <div className="filter-box-content">
              <div className="filter-row">
                <div className="filter-field">
                  <label>Fecha inicial</label>
                  <div className="input-with-icon">
                    <input 
                      type="date" 
                      value={fechaInicio} 
                      onChange={e => setFechaInicio(e.target.value)} 
                    />
                    <Calendar size={16} />
                  </div>
                </div>
                <div className="filter-field">
                  <label>F. final</label>
                  <div className="input-with-icon">
                    <input 
                      type="date" 
                      value={fechaFin} 
                      onChange={e => setFechaFin(e.target.value)} 
                    />
                    <Calendar size={16} />
                  </div>
                </div>
              </div>
              <div className="filter-field w-full">
                <label>Sucursal</label>
                <div className="input-with-icon">
                  <select value={sucursalId} onChange={e => setSucursalId(e.target.value)}>
                    <option value="all">Todas las sucursales</option>
                    {sucursales.map(s => (
                      <option key={s.id} value={s.id}>{s.nombre}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} />
                </div>
              </div>
            </div>
          </div>

          {/* Filtros contextuales */}
          <div className="filter-group-box">
            <div className="filter-box-label">Filtros</div>
            <div className="filter-box-content">
              <div className="filter-field w-full">
                <label>Desglose</label>
                <div className="input-with-icon">
                  <select
                    value={desglose}
                    onChange={e => setDesglose(e.target.value)}
                    disabled={!config}
                  >
                    {(config?.desgloseOptions ?? []).map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                    {!config && <option>— selecciona un indicador —</option>}
                  </select>
                  <ChevronDown size={16} />
                </div>
              </div>
              <div className="filter-field w-full">
                <label>Ordenar por</label>
                <div className="input-with-icon">
                  <select
                    value={sort}
                    onChange={e => setSort(e.target.value)}
                    disabled={!config}
                  >
                    {(config?.sortOptions ?? []).map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                    {!config && <option>— selecciona un indicador —</option>}
                  </select>
                  <ChevronDown size={16} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="stats-actions">
          <button 
            className="btn-secondary-outline"
            onClick={handleExportExcel}
            disabled={!resultado || calculating}
          >
            Exportar a Excel
          </button>
          <button
            className="btn-calculate"
            onClick={handleCalculate}
            disabled={calculating || !selectedId}
          >
            {calculating ? 'Calculando...' : 'Calcular'}
          </button>
        </div>

        {/* Results */}
        {resultado && config && (() => {
          const totalPages = Math.max(1, Math.ceil(resultado.rows.length / rowsPerPage))
          const paginatedRows = resultado.rows.slice((page - 1) * rowsPerPage, page * rowsPerPage)
          return (
          <div className="stats-results-area">
            <div className="result-table-wrap">
              <div className="result-table-header-title">Resultado del cálculo estadístico</div>
              <table className="result-table">
                <thead>
                  <tr>
                    {config.columns.map(col => (
                      <th key={col.key} align={col.align ?? 'left'}>
                        {col.label} <ChevronsUpDown size={11} className="sort-icon inline" />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedRows.map((row: any, idx: number) => (
                    <tr key={idx}>
                      {config.columns.map(col => (
                        <td key={col.key} align={col.align ?? 'left'}>
                          {formatCell(row[col.key], col.type)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
                <tfoot className="result-table-footer">
                  <tr>
                    {config.columns.map((col, i) => {
                      if (i === 0) return <td key={col.key} align="right"><strong>Total:</strong></td>
                      if (col.key === 'nombre' || col.key === 'tratamiento') return <td key={col.key} />
                      if (col.type === 'percent') return <td key={col.key} align="right">100 %</td>
                      if (col.type === 'money') return <td key={col.key} align="right"><strong>{formatCell(resultado.totals.total, 'money')}</strong></td>
                      if (col.key === 'cantidad') return <td key={col.key} align="right"><strong>{resultado.totals.cantidad?.toLocaleString('es-MX')}</strong></td>
                      return <td key={col.key} align="right">—</td>
                    })}
                  </tr>
                </tfoot>
              </table>

              {/* Pagination */}
              <div className="result-pagination">
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                  {resultado.rows.length} resultados · mostrando {(page - 1) * rowsPerPage + 1}–{Math.min(page * rowsPerPage, resultado.rows.length)}
                </div>
                <div className="pagination-controls">
                  <button
                    className="pagination-arrow"
                    style={{ background: 'none', border: 'none', cursor: page <= 1 ? 'default' : 'pointer', opacity: page <= 1 ? 0.3 : 1 }}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span style={{ fontSize: 13 }}>Página {page} de {totalPages}</span>
                  <button
                    className="pagination-arrow"
                    style={{ background: 'none', border: 'none', cursor: page >= totalPages ? 'default' : 'pointer', opacity: page >= totalPages ? 0.3 : 1 }}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
                <div className="rows-per-page">
                  <span>Filas:</span>
                  <select
                    value={rowsPerPage}
                    onChange={e => { setRowsPerPage(Number(e.target.value)); setPage(1) }}
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          )
        })()}
      </div>
      </div>
    </div>
  )
}
