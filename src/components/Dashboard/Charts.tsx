import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell, Legend 
} from 'recharts'

interface ChartProps {
  data: any[]
  height?: number
  colors?: string[]
}

// SaaS Palette: Amber/Yellow shades
const DEFAULT_COLORS = ['#f59e0b', '#fbbf24', '#d97706', '#fcd34d', '#78350f']

const truncate = (str: string, max = 15) => 
  (str && str.length > max) ? str.substring(0, max) + '...' : (str || '')

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-slate-200 shadow-lg rounded-lg">
        <p className="text-xs font-semibold text-slate-500 mb-1">{label}</p>
        <p className="text-sm font-bold text-slate-900">
          {new Intl.NumberFormat('es-MX', { 
            style: payload[0].name.toLowerCase().includes('total') ? 'currency' : 'decimal',
            currency: 'MXN'
          }).format(payload[0].value)}
        </p>
      </div>
    )
  }
  return null
}

export const DashboardBarChart = ({ data, height = 300, colors = DEFAULT_COLORS }: ChartProps) => {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey="nombre" 
            axisLine={false} 
            tickLine={false} 
            tickFormatter={(val) => truncate(val, 12)}
            tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }} 
            dy={8}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }} 
          />
          <Tooltip cursor={{ fill: '#f8fafc' }} content={<CustomTooltip />} />
          <Bar 
            dataKey="cantidad" 
            name="Cantidad"
            fill={colors[0]} 
            radius={[4, 4, 0, 0]} 
            barSize={20}
            animationDuration={1000}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export const DashboardAreaChart = ({ data, height = 300, colors = DEFAULT_COLORS }: ChartProps) => {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={colors[0]} stopOpacity={0.1}/>
              <stop offset="95%" stopColor={colors[0]} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey="nombre" 
            axisLine={false} 
            tickLine={false} 
            tickFormatter={(val) => truncate(val, 12)}
            tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }} 
            dy={8}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }} 
          />
          <Tooltip content={<CustomTooltip />} />
          <Area 
            type="monotone" 
            dataKey="total" 
            name="Total"
            stroke={colors[0]} 
            fillOpacity={1} 
            fill="url(#colorValue)" 
            strokeWidth={2.5}
            animationDuration={1000}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export const DashboardPieChart = ({ data, height = 300, colors = DEFAULT_COLORS }: ChartProps) => {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={90}
            paddingAngle={2}
            dataKey="cantidad"
            nameKey="nombre"
            stroke="#fff"
            strokeWidth={2}
            animationDuration={1000}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="bottom" 
            align="center" 
            iconType="circle"
            iconSize={8}
            formatter={(value) => truncate(value, 18)}
            wrapperStyle={{ paddingTop: '24px', fontSize: '11px', fontWeight: 500, color: '#64748b' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
