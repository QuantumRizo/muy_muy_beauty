import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts'

interface ChartProps {
  data: any[]
  height?: number
  colors?: string[]
}

// SaaS Palette: Amber/Yellow shades + expanded palette
const DEFAULT_COLORS = ['#f59e0b', '#fbbf24', '#d97706', '#fcd34d', '#78350f']
const MULTI_COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#06b6d4', '#f97316']

const truncate = (str: string, max = 15) => 
  (str && str.length > max) ? str.substring(0, max) + '...' : (str || '')

const currencyFmt = (v: number) => 
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(v)

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ 
        background: 'var(--surface)', border: '1px solid var(--border)', 
        borderRadius: 10, padding: '10px 14px', boxShadow: 'var(--shadow-md)' 
      }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', marginBottom: 6 }}>{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ fontSize: 13, fontWeight: 700, color: p.color, margin: '2px 0' }}>
            {p.name}: {typeof p.value === 'number' && p.value > 100 ? currencyFmt(p.value) : p.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

// ─── Bar Chart (single series, Revenue/Branch) ─────────────────

export const DashboardBarChart = ({ data, height = 300, colors = DEFAULT_COLORS }: ChartProps) => {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--border)" />
          <XAxis 
            dataKey="nombre" 
            axisLine={false} tickLine={false}
            tickFormatter={(val: string) => truncate(val, 12)}
            tick={{ fill: 'var(--text-3)', fontSize: 11, fontWeight: 500 }} 
            dy={8}
          />
          <YAxis 
            axisLine={false} tickLine={false}
            tickFormatter={(v: number) => v >= 1000 ? `$${(v/1000).toFixed(0)}k` : `$${v}`}
            tick={{ fill: 'var(--text-3)', fontSize: 11 }} 
          />
          <Tooltip cursor={{ fill: 'var(--surface-2)' }} content={<CustomTooltip />} />
          <Bar 
            dataKey="total" name="Ingresos"
            fill={colors[0]} radius={[6, 6, 0, 0]} 
            barSize={32} animationDuration={800}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── Area Chart ────────────────────────────────────────────────

export const DashboardAreaChart = ({ data, height = 300, colors = DEFAULT_COLORS }: ChartProps) => {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={colors[0]} stopOpacity={0.15}/>
              <stop offset="95%" stopColor={colors[0]} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--border)" />
          <XAxis 
            dataKey="nombre" axisLine={false} tickLine={false}
            tickFormatter={(val: string) => truncate(val, 12)}
            tick={{ fill: 'var(--text-3)', fontSize: 11, fontWeight: 500 }} dy={8}
          />
          <YAxis axisLine={false} tickLine={false}
            tickFormatter={(v: number) => v >= 1000 ? `$${(v/1000).toFixed(0)}k` : `$${v}`}
            tick={{ fill: 'var(--text-3)', fontSize: 11 }} 
          />
          <Tooltip content={<CustomTooltip />} />
          <Area 
            type="monotone" dataKey="total" name="Total"
            stroke={colors[0]} fillOpacity={1} fill="url(#colorValue)" 
            strokeWidth={2.5} animationDuration={800}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── Pie Chart ─────────────────────────────────────────────────

export const DashboardPieChart = ({ data, height = 300, colors = MULTI_COLORS }: ChartProps) => {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data} cx="50%" cy="45%"
            innerRadius={65} outerRadius={95}
            paddingAngle={2} dataKey="cantidad" nameKey="nombre"
            stroke="none" animationDuration={800}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="bottom" align="center" iconType="circle" iconSize={8}
            formatter={(value: string) => truncate(value, 18)}
            wrapperStyle={{ paddingTop: '16px', fontSize: '11px', fontWeight: 500, color: 'var(--text-2)' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── Line Chart (Dual: Agendadas vs Asistidas) ─────────────────

export const DashboardLineChart = ({ data, height = 300, colors = DEFAULT_COLORS }: ChartProps) => {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="lineGrad1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={colors[0]} stopOpacity={0.1}/>
              <stop offset="95%" stopColor={colors[0]} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--border)" />
          <XAxis 
            dataKey="nombre" axisLine={false} tickLine={false}
            tick={{ fill: 'var(--text-3)', fontSize: 10 }} dy={8}
          />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-3)', fontSize: 11 }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="top" align="right" iconType="circle" iconSize={8}
            wrapperStyle={{ fontSize: '11px', fontWeight: 600, paddingBottom: 12 }}
          />
          <Line 
            type="monotone" dataKey="cantidad" name="Agendadas"
            stroke={colors[0]} strokeWidth={2.5} dot={false} animationDuration={800}
          />
          <Line 
            type="monotone" dataKey="total" name="Asistidas" 
            stroke="#10b981" strokeWidth={2.5} dot={false} strokeDasharray="4 2" animationDuration={800}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── Heatmap (hora × día) ──────────────────────────────────────

const DAYS_ORDER = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const HEAT_COLORS = ['#f8fafc', '#fef3c7', '#fde68a', '#fbbf24', '#f59e0b', '#d97706', '#92400e']

function heatColor(value: number, maxVal: number): string {
  if (!value || maxVal === 0) return HEAT_COLORS[0]
  const idx = Math.ceil((value / maxVal) * (HEAT_COLORS.length - 1))
  return HEAT_COLORS[Math.min(idx, HEAT_COLORS.length - 1)]
}

interface HeatmapProps {
  data: any[]
  height?: number
}

export const DashboardHeatmap = ({ data, height = 280 }: HeatmapProps) => {
  if (!data || data.length === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', fontSize: 13 }}>
        Sin datos para el periodo
      </div>
    )
  }

  const maxVal = Math.max(...data.flatMap(row => 
    DAYS_ORDER.map(d => row[d] || 0)
  ))

  return (
    <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
      <table style={{ borderCollapse: 'separate', borderSpacing: 4, minWidth: '100%' }}>
        <thead>
          <tr>
            <th style={{ width: 52, fontSize: 10, color: 'var(--text-3)', textAlign: 'right', paddingRight: 8 }}></th>
            {DAYS_ORDER.map(d => (
              <th key={d} style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-2)', textAlign: 'center', paddingBottom: 6, minWidth: 44 }}>
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row: any) => (
            <tr key={row.nombre}>
              <td style={{ fontSize: 10, color: 'var(--text-3)', textAlign: 'right', paddingRight: 8, fontWeight: 600, whiteSpace: 'nowrap' }}>
                {row.nombre}
              </td>
              {DAYS_ORDER.map(d => {
                const val = row[d] || 0
                const bg = heatColor(val, maxVal)
                return (
                  <td 
                    key={d}
                    title={`${row.nombre} ${d}: ${val} citas`}
                    style={{ 
                      background: bg, 
                      borderRadius: 6, 
                      width: 44, height: 32, 
                      textAlign: 'center', 
                      fontSize: 10, 
                      fontWeight: val > 0 ? 700 : 400,
                      color: val > maxVal * 0.5 ? '#78350f' : 'var(--text-3)',
                      cursor: 'default',
                      transition: 'transform 0.15s',
                    }}
                  >
                    {val > 0 ? val : ''}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 12, justifyContent: 'flex-end' }}>
        <span style={{ fontSize: 9, color: 'var(--text-3)', marginRight: 4 }}>Baja</span>
        {HEAT_COLORS.slice(1).map((c, i) => (
          <div key={i} style={{ width: 16, height: 12, borderRadius: 3, background: c }} />
        ))}
        <span style={{ fontSize: 9, color: 'var(--text-3)', marginLeft: 4 }}>Alta</span>
      </div>
    </div>
  )
}

// ─── Stock Semáforo ────────────────────────────────────────────

interface SemaforoProps {
  data: any[]
}

const SEMAFORO_CONFIG = [
  { label: 'Crítico', color: '#ef4444', bg: '#fef2f2', border: '#fca5a5' },
  { label: 'Bajo', color: '#f59e0b', bg: '#fffbeb', border: '#fcd34d' },
  { label: 'OK', color: '#10b981', bg: '#f0fdf4', border: '#6ee7b7' },
]

export const DashboardSemaforo = ({ data }: SemaforoProps) => {
  if (!data || data.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
        Sin productos activos
      </div>
    )
  }

  const criticos = data.filter(p => p.porcentaje === 0)
  const bajos = data.filter(p => p.porcentaje === 1)
  const ok = data.filter(p => p.porcentaje === 2)

  const groups = [
    { ...SEMAFORO_CONFIG[0], items: criticos },
    { ...SEMAFORO_CONFIG[1], items: bajos },
    { ...SEMAFORO_CONFIG[2], items: ok },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {groups.map(g => g.items.length > 0 && (
        <div key={g.label}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: g.color }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: g.color }}>{g.label} ({g.items.length})</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {g.items.slice(0, 8).map((p: any) => (
              <div key={p.nombre} style={{ 
                padding: '4px 10px', borderRadius: 20,
                background: g.bg, border: `1px solid ${g.border}`,
                fontSize: 11, fontWeight: 600, color: g.color,
                display: 'flex', alignItems: 'center', gap: 5
              }}>
                <span>{p.nombre}</span>
                <span style={{ opacity: 0.7 }}>({p.cantidad})</span>
              </div>
            ))}
            {g.items.length > 8 && (
              <span style={{ fontSize: 10, color: g.color, alignSelf: 'center' }}>+{g.items.length - 8} más</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
