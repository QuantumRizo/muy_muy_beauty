import { useState, useEffect } from 'react'
import { Search, LockKeyhole, FileDown } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { Sucursal } from '../../types/database'
import { format } from 'date-fns'
import { downloadResumenVentasCSV } from '../../lib/exportReports'

type SubTab = 'ventas' | 'aplazados' | 'cajas'

export default function VentasTab() {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('ventas')
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  
  useEffect(() => {
    supabase.from('sucursales').select('*').order('nombre').then(({ data }) => {
      if (data) setSucursales(data)
    })
  }, [])

  return (
    <div className="animate-in">
      <div style={{ display: 'flex', gap: 20, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        <button 
          onClick={() => setActiveSubTab('ventas')}
          className={`tab-item-sub ${activeSubTab === 'ventas' ? 'active' : ''}`}
        >
          Listado de ventas
        </button>
        <button 
          onClick={() => setActiveSubTab('aplazados')}
          className={`tab-item-sub ${activeSubTab === 'aplazados' ? 'active' : ''}`}
        >
          Pagos aplazados
        </button>
        <button 
          onClick={() => setActiveSubTab('cajas')}
          className={`tab-item-sub ${activeSubTab === 'cajas' ? 'active' : ''}`}
        >
          Buscador de cajas
        </button>
      </div>

      <div className="sub-tab-content">
        {activeSubTab === 'ventas' && <VentasSubTab sucursales={sucursales} />}
        {activeSubTab === 'aplazados' && <PagosAplazadosSubTab />}
        {activeSubTab === 'cajas' && <CortesCajaSubTab />}
      </div>

      <style>{`
        .tab-item-sub {
          background: transparent;
          border: none;
          padding: 10px 4px;
          font-size: 13px;
          font-weight: 500;
          color: var(--text-3);
          cursor: pointer;
          position: relative;
          transition: all 0.2s;
        }
        .tab-item-sub:hover { color: var(--text-1); }
        .tab-item-sub.active { color: var(--accent); font-weight: 700; }
        .tab-item-sub.active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--accent);
        }
      `}</style>
    </div>
  )
}

function VentasSubTab({ sucursales }: { sucursales: Sucursal[] }) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [fechaInicio, setFechaInicio] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [fechaFin, setFechaFin] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [sucursalId, setSucursalId] = useState('all')

  const fetchVentas = async () => {
    setLoading(true)
    let query = supabase
      .from('tickets')
      .select('*, cliente:clientes(nombre_completo)')
      .eq('estado', 'Pagado')
      .gte('fecha', fechaInicio)
      .lte('fecha', fechaFin)
      .order('created_at', { ascending: false })

    if (sucursalId !== 'all') query = query.eq('sucursal_id', sucursalId)

    const { data: tickets } = await query
    if (tickets) setData(tickets)
    setLoading(false)
  }

  useEffect(() => {
    fetchVentas()
  }, [fechaInicio, fechaFin, sucursalId])

  return (
    <div className="stats-card">
      <div style={{ display: 'flex', gap: 15, marginBottom: 20, alignItems: 'end', flexWrap: 'wrap' }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, marginBottom: 5, display: 'block' }}>Rango de Fechas</label>
          <div style={{ display: 'flex', gap: 10 }}>
            <input className="form-input" type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} />
            <input className="form-input" type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} />
          </div>
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, marginBottom: 5, display: 'block' }}>Sucursal</label>
          <select className="form-input" value={sucursalId} onChange={e => setSucursalId(e.target.value)} style={{ minWidth: 200 }}>
            <option value="all">Todas las sucursales</option>
            {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <button className="btn-primary" onClick={fetchVentas} style={{ height: 40 }}><Search size={16} /> Buscar</button>
          <button 
            className="btn-secondary-outline" 
            onClick={() => downloadResumenVentasCSV(fechaInicio, fechaFin, sucursalId === 'all' ? sucursales.map(s => s.id) : [sucursalId])} 
            style={{ height: 40 }}
            title="Descargar Resumen Monetario por Sucursal"
          >
            <FileDown size={16} /> Resumen
          </button>
        </div>
      </div>

      {loading ? <p>Cargando ventas...</p> : (
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Nº Venta</th>
                <th>Fecha</th>
                <th>Cliente</th>
                <th style={{ textAlign: 'right' }}>Total</th>
                <th style={{ width: 80 }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 30 }}>No hay ventas pagadas en este periodo.</td></tr>
              )}
              {data.map(t => (
                <tr key={t.id}>
                  <td>{t.num_ticket || t.id.substring(0,8).toUpperCase()}</td>
                  <td>{format(new Date(t.fecha), 'dd/MM/yyyy')}</td>
                  <td>{t.cliente?.nombre_completo || 'Cliente General'}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>${Number(t.total).toFixed(2)}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--success)' }}>
                      <LockKeyhole size={14} /> Cerrada
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function PagosAplazadosSubTab() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPendientes = async () => {
    setLoading(true)
    const { data: tickets } = await supabase
      .from('tickets')
      .select('*, cliente:clientes(nombre_completo), sucursal:sucursales(nombre)')
      .eq('estado', 'Pendiente')
      .order('fecha', { ascending: false })

    if (tickets) {
      const tIds = tickets.map(t => t.id)
      if (tIds.length > 0) {
        const { data: pagos } = await supabase.from('pagos').select('ticket_id, importe').in('ticket_id', tIds)
        const sumPagos = (pagos || []).reduce((acc: any, p: any) => {
          acc[p.ticket_id] = (acc[p.ticket_id] || 0) + Number(p.importe)
          return acc
        }, {})

        const enriched = tickets.map(t => ({
          ...t,
          pagado: sumPagos[t.id] || 0,
          monto_pendiente: Number(t.total) - (sumPagos[t.id] || 0)
        })).filter(t => t.monto_pendiente > 0)

        setData(enriched)
      } else {
        setData([])
      }
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchPendientes()
  }, [])

  return (
    <div className="stats-card">
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600 }}>Listado de pagos aplazados</h3>
        <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Muestra todos los tickets que tienen un saldo pendiente por liquidar (Deudores).</p>
      </div>

      {loading ? <p>Cargando deudores...</p> : (
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Centro</th>
                <th>Nº Fact/Ticket</th>
                <th>Fecha</th>
                <th>Cliente</th>
                <th style={{ textAlign: 'right' }}>Total</th>
                <th style={{ textAlign: 'right' }}>Pendiente</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 30 }}>No hay cobros pendientes o aplazados activos.</td></tr>
              )}
              {data.map(t => (
                <tr key={t.id}>
                  <td style={{ fontSize: 12 }}>{t.sucursal?.nombre || 'General'}</td>
                  <td>{t.num_ticket || t.id.substring(0,8).toUpperCase()}</td>
                  <td>{format(new Date(t.fecha), 'dd/MM/yyyy')}</td>
                  <td>{t.cliente?.nombre_completo || 'Cliente General'}</td>
                  <td style={{ textAlign: 'right', color: 'var(--text-2)' }}>${Number(t.total).toFixed(2)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#e74c3c' }}>${t.monto_pendiente.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function CortesCajaSubTab() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [fechaInicio, setFechaInicio] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [fechaFin, setFechaFin] = useState(format(new Date(), 'yyyy-MM-dd'))
  
  const fetchCortes = async () => {
    setLoading(true)
    const { data: turnos } = await supabase
      .from('turnos_caja')
      .select('*, sucursal:sucursales(nombre)')
      .gte('fecha_apertura', fechaInicio)
      .lte('fecha_apertura', fechaFin)
      .order('fecha_apertura', { ascending: false })

    if (turnos) setData(turnos)
    setLoading(false)
  }

  useEffect(() => {
    fetchCortes()
  }, [fechaInicio, fechaFin])

  return (
    <div className="stats-card">
      <div style={{ display: 'flex', gap: 15, marginBottom: 20, alignItems: 'end', flexWrap: 'wrap' }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, marginBottom: 5, display: 'block' }}>Rango de Fechas</label>
          <div style={{ display: 'flex', gap: 10 }}>
            <input className="form-input" type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} />
            <input className="form-input" type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} />
          </div>
        </div>
        <button className="btn-primary" onClick={fetchCortes} style={{ height: 40 }}><Search size={16} /> Buscar</button>
      </div>

      {loading ? <p>Cargando cortes de caja...</p> : (
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Fecha Apertura</th>
                <th>Clínica</th>
                <th style={{ textAlign: 'right' }}>Facturado (Ventas)</th>
                <th style={{ textAlign: 'right' }}>Retirado (Cierre)</th>
                <th style={{ textAlign: 'right' }}>Diferencia</th>
                <th style={{ width: 100 }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 30 }}>No hay cortes registrados en estas fechas.</td></tr>
              )}
              {data.map(t => {
                const isCerrada = t.estado === 'Cerrada'
                const facturado = (Number(t.total_ventas_efectivo) || 0) + (Number(t.total_ventas_tarjeta) || 0) + (Number(t.total_ventas_otros) || 0)
                const dif = Number(t.diferencia_efectivo) || 0
                return (
                  <tr key={t.id}>
                    <td>{format(new Date(t.fecha_apertura), 'dd/MM/yyyy')} a las {t.hora_apertura.substring(0,5)}</td>
                    <td>{t.sucursal?.nombre || 'General'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>${facturado.toFixed(2)}</td>
                    <td style={{ textAlign: 'right' }}>{isCerrada ? `$${Number(t.monto_cierre_efectivo_real || 0).toFixed(2)}` : '-'}</td>
                    <td style={{ textAlign: 'right', color: dif < 0 ? '#e74c3c' : (dif > 0 ? '#2ecc71' : 'var(--text-1)') }}>
                      {isCerrada ? `$${dif.toFixed(2)}` : '-'}
                    </td>
                    <td>
                      <span className={`status-badge status-${isCerrada ? 'Finalizada' : 'Programada'}`}>
                        {isCerrada ? 'cerrada' : 'abierta'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
