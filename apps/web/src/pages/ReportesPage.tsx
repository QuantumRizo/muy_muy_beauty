import { useState, useEffect } from 'react'
import { FileDown, Calendar } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Sucursal } from '../types/database'
import { downloadResumenVentasCSV, downloadLiquidacionComisionesCSV } from '../lib/exportReports'
import { useToast } from '../components/Common/Toast'

export default function ReportesPage() {
  const [reportType, setReportType] = useState('liquidacion')
  const [fechaInicio, setFechaInicio] = useState(() => {
    const d = new Date()
    d.setDate(1)
    return d.toISOString().split('T')[0]
  })
  const [fechaFin, setFechaFin] = useState(() => new Date().toISOString().split('T')[0])
  const [sucursalId, setSucursalId] = useState('all')
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [exporting, setExporting] = useState(false)
  const toast = useToast()

  useEffect(() => {
    supabase.from('sucursales').select('*').order('nombre').then(({ data }) => {
      if (data) setSucursales(data)
    })
  }, [])

  const handleExport = async () => {
    setExporting(true)
    try {
      if (reportType === 'liquidacion') {
        await downloadLiquidacionComisionesCSV(fechaInicio, fechaFin)
      } else if (reportType === 'ventas') {
        await downloadResumenVentasCSV(fechaInicio, fechaFin, sucursalId === 'all' ? sucursales.map(s => s.id) : [sucursalId])
      }
    } catch (err: any) {
      toast('Error al generar el reporte: ' + err.message, 'error')
      console.error(err)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div className="page-header" style={{ padding: '24px 24px 0', marginBottom: 24 }}>
        <div className="page-header-content">
          <h1 className="page-title">Reportes</h1>
          <p className="page-subtitle">Descarga extractos de información directa en formato CSV listo para Excel.</p>
        </div>
      </div>

      <div className="page-content" style={{ padding: '0 24px 24px' }}>
        <div className="stats-card" style={{ maxWidth: 600, margin: '0 auto' }}>
          
          <div className="filter-group-box" style={{ marginBottom: 20 }}>
            <div className="filter-box-label">Tipo de Reporte</div>
            <div className="filter-box-content">
              <label className="radio-label" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, cursor: 'pointer' }}>
                <input 
                  type="radio" 
                  name="reportType" 
                  value="liquidacion" 
                  checked={reportType === 'liquidacion'} 
                  onChange={e => setReportType(e.target.value)} 
                />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>Liquidación de Comisiones (Financiero)</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Reporte detallado de comisiones según ventas, tramos y hoja de evaluación.</div>
                </div>
              </label>

              <label className="radio-label" style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input 
                  type="radio" 
                  name="reportType" 
                  value="ventas" 
                  checked={reportType === 'ventas'} 
                  onChange={e => setReportType(e.target.value)} 
                />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>Resumen de Ventas (Financiero)</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Facturación total, ticket medio y conteo de clientes nuevos por sucursal.</div>
                </div>
              </label>
            </div>
          </div>

          <div className="filter-group-box" style={{ marginBottom: 20 }}>
            <div className="filter-box-label">Parámetros</div>
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
                  <label>Fecha final</label>
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

              <div className="filter-field w-full" style={{ marginTop: 15 }}>
                <label>Sucursal</label>
                <select className="form-input" value={sucursalId} onChange={e => setSucursalId(e.target.value)}>
                  <option value="all">Todas las sucursales</option>
                  {sucursales.map(s => (
                    <option key={s.id} value={s.id}>{s.nombre}</option>
                  ))}
                </select>
              </div>

            </div>
          </div>

          <button 
            className="btn-primary" 
            style={{ width: '100%', padding: '16px', fontSize: 15, display: 'flex', justifyContent: 'center', gap: 10 }}
            onClick={handleExport}
            disabled={exporting}
          >
            <FileDown size={20} />
            {exporting ? 'Generando archivo Excel...' : 'Descargar Archivo CSV'}
          </button>
          
          <div style={{ marginTop: 15, fontSize: 12, color: 'var(--text-3)', textAlign: 'center' }}>
            Abre el archivo descargado directamente en Microsoft Excel, Numbers o Google Sheets.
          </div>
        </div>
      </div>
    </div>
  )
}
