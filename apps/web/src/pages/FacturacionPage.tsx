import { useState, useEffect } from 'react'
import { Search, LockKeyhole } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Sucursal } from '../types/database'
import { format } from 'date-fns'

type Tab = 'ventas' | 'aplazados' | 'cajas'

export default function FacturacionPage() {
  const [activeTab, setActiveTab] = useState<Tab>('ventas')
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  
  // Fetch sucursales
  useEffect(() => {
    supabase.from('sucursales').select('*').order('nombre').then(({ data }) => {
      if (data) setSucursales(data)
    })
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div className="page-header" style={{ padding: '24px 24px 0', marginBottom: 24 }}>
        <div className="page-header-content">
          <h1 className="page-title">Facturación</h1>
          <p className="page-subtitle">Gestiona ventas, estados de cuenta y cortes de caja.</p>
        </div>
        <div style={{ display: 'flex', gap: 15, marginTop: 15 }}>
          <button 
            onClick={() => setActiveTab('ventas')}
            style={{ 
              background: 'transparent', border: 'none', padding: '10px 5px', fontSize: 14, 
              fontWeight: activeTab === 'ventas' ? 600 : 400, 
              color: activeTab === 'ventas' ? 'var(--accent)' : 'var(--text-2)',
              borderBottom: activeTab === 'ventas' ? '2px solid var(--accent)' : '2px solid transparent',
              cursor: 'pointer'
            }}
          >
            Listado de ventas
          </button>
          <button 
            onClick={() => setActiveTab('aplazados')}
            style={{ 
              background: 'transparent', border: 'none', padding: '10px 5px', fontSize: 14, 
              fontWeight: activeTab === 'aplazados' ? 600 : 400, 
              color: activeTab === 'aplazados' ? 'var(--accent)' : 'var(--text-2)',
              borderBottom: activeTab === 'aplazados' ? '2px solid var(--accent)' : '2px solid transparent',
              cursor: 'pointer'
            }}
          >
            Pagos aplazados
          </button>
          <button 
            onClick={() => setActiveTab('cajas')}
            style={{ 
              background: 'transparent', border: 'none', padding: '10px 5px', fontSize: 14, 
              fontWeight: activeTab === 'cajas' ? 600 : 400, 
              color: activeTab === 'cajas' ? 'var(--accent)' : 'var(--text-2)',
              borderBottom: activeTab === 'cajas' ? '2px solid var(--accent)' : '2px solid transparent',
              cursor: 'pointer'
            }}
          >
            Buscador de cajas
          </button>
        </div>
      </div>

      <div className="page-content" style={{ padding: '0 24px 24px', flex: 1, overflowY: 'auto' }}>
        {activeTab === 'ventas' && <VentasTab sucursales={sucursales} />}
        {activeTab === 'aplazados' && <PagosAplazadosTab />}
        {activeTab === 'cajas' && <CortesCajaTab />}
      </div>
    </div>
  )
}

function VentasTab({ sucursales }: { sucursales: Sucursal[] }) {
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
            <input className="form-input" type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} style={{ cursor: 'pointer' }} />
            <input className="form-input" type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} style={{ cursor: 'pointer' }} />
          </div>
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, marginBottom: 5, display: 'block' }}>Sucursal</label>
          <select className="form-input" value={sucursalId} onChange={e => setSucursalId(e.target.value)} style={{ minWidth: 200 }}>
            <option value="all">Todas las sucursales</option>
            {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
          </select>
        </div>
        <button className="btn-primary" onClick={fetchVentas} style={{ height: 40 }}><Search size={16} /> Buscar</button>
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

function PagosAplazadosTab() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPendientes = async () => {
    setLoading(true)
    // Fetch tickets that are "Pendiente"
    const { data: tickets } = await supabase
      .from('tickets')
      .select('*, cliente:clientes(nombre_completo), sucursal:sucursales(nombre)')
      .eq('estado', 'Pendiente')
      .order('fecha', { ascending: false })

    if (tickets) {
      // Also fetch sum of payments for these to calculate exact "Pendiente"
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

function CortesCajaTab() {
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
            <input className="form-input" type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} style={{ cursor: 'pointer' }} />
            <input className="form-input" type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} style={{ cursor: 'pointer' }} />
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
