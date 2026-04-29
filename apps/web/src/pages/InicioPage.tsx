import { useState, useEffect } from 'react'
import { 
  DollarSign, Calendar, Users, CheckCircle, 
  MapPin, TrendingUp, RefreshCw, BarChart2, Package
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import KPICard from '../components/Dashboard/KPICard'
import { 
  DashboardBarChart,
  DashboardPieChart,
  DashboardLineChart,
} from '../components/Dashboard/Charts'
import { useDashboardData, type TimeRange } from '../hooks/useDashboardData'
import type { Sucursal } from '../types/database'

const fmt = (v: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(v)

export default function InicioPage() {
  const [sucursalId, setSucursalId] = useState<string>('all')
  const [range, setRange] = useState<TimeRange>('today')
  const [sucursales, setSucursales] = useState<Sucursal[]>([])

  const { data, loading, error } = useDashboardData(sucursalId, range)

  useEffect(() => {
    supabase.from('sucursales').select('*').order('nombre').then(({ data }) => {
      if (data) setSucursales(data)
    })
  }, [])

  if (error) {
    return (
      <div className="card" style={{ padding: '20px', margin: '20px', color: 'var(--danger)', background: 'var(--danger-bg)' }}>
        Error al cargar el dashboard: {error}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Page Header */}
      <div className="page-header" style={{ padding: '18px 24px 0', marginBottom: 15 }}>
        <div className="page-header-content">
          <h1 className="page-title" style={{ fontSize: '24px', margin: 0 }}>Inicio</h1>
          <p className="page-subtitle" style={{ fontSize: '12px', marginTop: '2px' }}>Rendimiento general del negocio</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <MapPin size={12} style={{ position: 'absolute', left: '10px', color: 'var(--text-3)' }} />
            <select 
              value={sucursalId} 
              onChange={(e) => setSucursalId(e.target.value)}
              className="sucursal-select"
              style={{ paddingLeft: '28px', paddingRight: '28px', fontSize: '12px', height: '34px' }}
            >
              <option value="all">Sedes combinadas</option>
              {sucursales.map(s => (
                <option key={s.id} value={s.id}>{s.nombre}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', background: 'var(--surface-2)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border)' }}>
            {(['today', 'week', 'month'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                style={{
                  padding: '4px 12px', fontSize: '10px', fontWeight: 600, borderRadius: '6px',
                  border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                  background: range === r ? 'var(--surface)' : 'transparent',
                  color: range === r ? 'var(--accent)' : 'var(--text-3)',
                  boxShadow: range === r ? 'var(--shadow-sm)' : 'none',
                  height: '28px'
                }}
              >
                {r === 'today' ? 'Hoy' : r === 'week' ? 'Semana' : 'Mes'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="page-content" style={{ padding: '0 24px 24px', overflowY: 'auto' }}>
        {loading && !data ? (
          <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-3)', fontSize: '13px' }}>
            Cargando indicadores...
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* ══ KPI ROW 1: CORE METRICS (Large) ══ */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              <KPICard title="Ingresos Totales" value={fmt(data?.revenue || 0)} Icon={DollarSign} subtitle="Ventas del periodo" variant="accent" />
              <KPICard 
                title="Recurrencia" 
                value={`${data?.retentionRate || 0}%`} 
                Icon={RefreshCw} 
                subtitle="Clientes que regresan (30d)" 
                variant={data?.retentionRate >= 50 ? 'success' : 'accent'} 
              />
              <KPICard 
                title="Ticket Promedio" 
                value={fmt(data?.ticketPromedio || 0)} 
                Icon={TrendingUp} 
                subtitle="Por visita de cliente" 
                variant="accent" 
              />
              <KPICard 
                title="Dif. Caja" 
                value={fmt(data?.cashDifference || 0)} 
                Icon={DollarSign} 
                subtitle="Arqueo de cierres" 
                variant={(data?.cashDifference || 0) < 0 ? 'danger' : 'success'} 
              />
            </div>

            {/* ══ KPI ROW 2: MINI METRICS (Compact) ══ */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              <KPICard isMini title="Citas" value={data?.appointments || 0} Icon={Calendar} subtitle="Agendadas" variant="white" />
              <KPICard isMini title="Clientes Nuevos" value={data?.newClients || 0} Icon={Users} subtitle="Registro en periodo" variant="white" />
              <KPICard isMini title="Asistencia" value={`${(data?.attendanceRate || 0).toFixed(1)}%`} Icon={CheckCircle} subtitle="Tasa de asistencia" variant="white" />
              <KPICard isMini title="Tasa de Ocupación" value={`${data?.ocupacion || 0}%`} Icon={BarChart2} subtitle="Citas atendidas/totales" variant="white" />
            </div>

            {/* ══ KPI ROW 3: MINI FINANCIAL (Compact) ══ */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              <KPICard isMini title="Venta Prods." value={fmt(data?.inventoryMetrics?.ingreso || 0)} Icon={Package} variant="white" />
              <KPICard isMini title="Costo Prods." value={fmt(data?.inventoryMetrics?.costo || 0)} Icon={Package} variant="white" />
              <KPICard isMini title="Nuevos vs Recurr." value={`${data?.nuevosVsRecurrentes?.nuevos || 0}/${data?.nuevosVsRecurrentes?.recurrentes || 0}`} Icon={Users} variant="white" />
              <KPICard isMini title="Sueldos Est." value={fmt(data?.salaryExpense || 0)} Icon={Users} subtitle={`${range === 'today' ? 'Hoy' : 'Periodo'}`} variant="white" />
            </div>

            {/* ══ CHART ROW 1: Revenue Stacked + Service Trend ══ */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '16px' }}>
              <div className="card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span className="card-title" style={{ fontSize: '13px' }}>Ingresos por Sucursal (Gastos vs Utilidad)</span>
                  <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--accent)', background: 'var(--accent-light)', padding: '3px 8px', borderRadius: '15px' }}>FINANCIERO</span>
                </div>
                <DashboardBarChart 
                  data={data?.ingresosSucursal || []} 
                  height={220} 
                  stacked 
                  dataKeys={[
                    { key: 'comisiones', name: 'Comisiones', color: '#88B04B' },
                    { key: 'sueldos', name: 'Sueldos', color: '#2D5A27' },
                    { key: 'otros', name: 'Utilidad/Otros', color: '#10b981' },
                  ]}
                />
              </div>

              <div className="card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span className="card-title" style={{ fontSize: '13px' }}>Tendencia del Periodo (Servicios por Familia)</span>
                  <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--accent)', background: 'var(--accent-light)', padding: '3px 8px', borderRadius: '15px' }}>PERIODICIDAD</span>
                </div>
                <DashboardLineChart data={data?.serviciosTendencia || []} height={220} />
              </div>
            </div>

            {/* ══ CHART ROW 2: Top Empleados + Métodos de Pago ══ */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '16px' }}>
              <div className="card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span className="card-title" style={{ fontSize: '13px' }}>Top 10 Empleados</span>
                  <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--accent)', background: 'var(--accent-light)', padding: '3px 8px', borderRadius: '15px' }}>RENDIMIENTO</span>
                </div>
                <DashboardBarChart data={data?.topEmpleados || []} height={220} colors={['#2D5A27']} />
              </div>

              <div className="card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span className="card-title" style={{ fontSize: '13px' }}>Tipo de Pago Preferido</span>
                  <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--accent)', background: 'var(--accent-light)', padding: '3px 8px', borderRadius: '15px' }}>FINANZAS</span>
                </div>
                <DashboardPieChart data={data?.pagosPreferidos || []} height={220} />
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
