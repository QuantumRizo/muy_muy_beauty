// ─── Indicator Configuration ──────────────────────────────────
// Each indicator defines its own columns, available breakdowns, and default sort.

export type ColType = 'text' | 'number' | 'money' | 'percent' | 'minutes' | 'date'

export interface ColDef {
  key: string
  label: string
  type: ColType
  align?: 'left' | 'right'
}

export interface DesgloseOption {
  value: string
  label: string
}

export interface SortOption {
  value: string
  label: string
}

export interface IndicatorConfig {
  id: string
  nombre: string
  categoria: string
  columns: ColDef[]
  desgloseOptions: DesgloseOption[]
  defaultDesglose: string
  sortOptions: SortOption[]
  defaultSort: string
  footerLabels?: Record<string, string> // column key -> label for total row
}

// ─── Common breakdown sets ─────────────────────────────────────

const BY_PERIOD: DesgloseOption[] = [
  { value: 'sucursal', label: 'Por sucursal' },
  { value: 'mes', label: 'Por mes' },
  { value: 'dia', label: 'Por día' },
]

const BY_PERIOD_PROF: DesgloseOption[] = [
  { value: 'sucursal', label: 'Por sucursal' },
  { value: 'profesional', label: 'Por profesional' },
  { value: 'mes', label: 'Por mes' },
  { value: 'dia', label: 'Por día' },
]

const SORT_COUNT_NAME: SortOption[] = [
  { value: 'cantidad_desc', label: 'Cantidad ↓' },
  { value: 'cantidad_asc', label: 'Cantidad ↑' },
  { value: 'nombre_asc', label: 'Nombre A-Z' },
]

const SORT_TOTAL_NAME: SortOption[] = [
  { value: 'total_desc', label: 'Total ↓' },
  { value: 'total_asc', label: 'Total ↑' },
  { value: 'nombre_asc', label: 'Nombre A-Z' },
]

// ─── Indicator definitions ─────────────────────────────────────

export const INDICATOR_CONFIG: Record<string, IndicatorConfig> = {
  '1.1.1': {
    id: '1.1.1', nombre: '1.1.1.- Nº Total de clientes nuevos', categoria: '1',
    columns: [
      { key: 'nombre', label: 'Desglose', type: 'text', align: 'left' },
      { key: 'cantidad', label: 'Cantidad', type: 'number', align: 'right' },
      { key: 'porcentaje', label: 'Porcentaje', type: 'percent', align: 'right' },
    ],
    desgloseOptions: [
      { value: 'total', label: 'Total global' },
      { value: 'mes', label: 'Por mes' },
      { value: 'dia', label: 'Por día' },
    ],
    defaultDesglose: 'total', sortOptions: SORT_COUNT_NAME, defaultSort: 'cantidad_desc',
  },
  '1.1.2': {
    id: '1.1.2', nombre: '1.1.2.- Nº Total de primeras sesiones', categoria: '1',
    columns: [
      { key: 'nombre', label: 'Desglose', type: 'text', align: 'left' },
      { key: 'cantidad', label: 'Primeras sesiones', type: 'number', align: 'right' },
      { key: 'porcentaje', label: 'Porcentaje', type: 'percent', align: 'right' },
    ],
    desgloseOptions: BY_PERIOD,
    defaultDesglose: 'sucursal', sortOptions: SORT_COUNT_NAME, defaultSort: 'cantidad_desc',
  },
  '1.1.3': {
    id: '1.1.3', nombre: '1.1.3.- Nº Total de primeras compras', categoria: '1',
    columns: [
      { key: 'nombre', label: 'Desglose', type: 'text', align: 'left' },
      { key: 'cantidad', label: 'Primeras compras', type: 'number', align: 'right' },
      { key: 'total', label: 'Total MXN', type: 'money', align: 'right' },
      { key: 'porcentaje', label: 'Porcentaje', type: 'percent', align: 'right' },
    ],
    desgloseOptions: BY_PERIOD,
    defaultDesglose: 'sucursal', sortOptions: SORT_COUNT_NAME, defaultSort: 'cantidad_desc',
  },
  '1.2': {
    id: '1.2', nombre: '1.2.- Desglose de ¿cómo nos ha conocido?', categoria: '1',
    columns: [
      { key: 'nombre', label: 'Procedencia', type: 'text', align: 'left' },
      { key: 'cantidad', label: 'Clientes', type: 'number', align: 'right' },
      { key: 'porcentaje', label: 'Porcentaje', type: 'percent', align: 'right' },
    ],
    desgloseOptions: [{ value: 'procedencia', label: 'Por procedencia' }],
    defaultDesglose: 'procedencia', sortOptions: SORT_COUNT_NAME, defaultSort: 'cantidad_desc',
  },
  '2.3.1': {
    id: '2.3.1', nombre: '2.3.1.- Nº Total de clientes por tratamiento', categoria: '2',
    columns: [
      { key: 'nombre', label: 'Tratamiento', type: 'text', align: 'left' },
      { key: 'cantidad', label: 'Clientes', type: 'number', align: 'right' },
      { key: 'porcentaje', label: 'Porcentaje', type: 'percent', align: 'right' },
    ],
    desgloseOptions: [
      { value: 'tratamiento', label: 'Por tratamiento' },
      { value: 'sucursal', label: 'Por sucursal' },
      { value: 'mes', label: 'Por mes' },
    ],
    defaultDesglose: 'tratamiento', sortOptions: SORT_COUNT_NAME, defaultSort: 'cantidad_desc',
  },
  '2.4': {
    id: '2.4', nombre: '2.4.- Nº Medio de tratamientos por cliente', categoria: '2',
    columns: [
      { key: 'nombre', label: 'Desglose', type: 'text', align: 'left' },
      { key: 'cantidad', label: 'Clientes', type: 'number', align: 'right' },
      { key: 'total', label: 'Tratamientos', type: 'number', align: 'right' },
      { key: 'media', label: 'Media', type: 'number', align: 'right' },
    ],
    desgloseOptions: BY_PERIOD,
    defaultDesglose: 'sucursal', sortOptions: SORT_COUNT_NAME, defaultSort: 'cantidad_desc',
  },
  '2.5': {
    id: '2.5', nombre: '2.5.- Tiempo medio de duración de tratamientos', categoria: '2',
    columns: [
      { key: 'nombre', label: 'Tratamiento', type: 'text', align: 'left' },
      { key: 'duracion', label: 'Duración media (min)', type: 'minutes', align: 'right' },
      { key: 'sesiones', label: 'Sesiones', type: 'number', align: 'right' },
    ],
    desgloseOptions: [{ value: 'tratamiento', label: 'Por tratamiento' }],
    defaultDesglose: 'tratamiento',
    sortOptions: [
      { value: 'duracion_desc', label: 'Duración ↓' },
      { value: 'duracion_asc', label: 'Duración ↑' },
      { value: 'nombre_asc', label: 'Nombre A-Z' },
    ],
    defaultSort: 'sesiones_desc',
  },
  '2.6': {
    id: '2.6', nombre: '2.6.- Desglose de sesiones asistidas por tratamiento', categoria: '2',
    columns: [
      { key: 'nombre', label: 'Tratamiento', type: 'text', align: 'left' },
      { key: 'cantidad', label: 'Sesiones asistidas', type: 'number', align: 'right' },
      { key: 'porcentaje', label: 'Porcentaje', type: 'percent', align: 'right' },
    ],
    desgloseOptions: [
      { value: 'tratamiento', label: 'Por tratamiento' },
      { value: 'mes', label: 'Por mes' },
    ],
    defaultDesglose: 'tratamiento', sortOptions: SORT_COUNT_NAME, defaultSort: 'cantidad_desc',
  },
  '2.7': {
    id: '2.7', nombre: '2.7.- Sesiones asistidas por profesional y tratamiento', categoria: '2',
    columns: [
      { key: 'nombre', label: 'Profesional', type: 'text', align: 'left' },
      { key: 'tratamiento', label: 'Tratamiento', type: 'text', align: 'left' },
      { key: 'cantidad', label: 'Sesiones', type: 'number', align: 'right' },
    ],
    desgloseOptions: [{ value: 'profesional_tratamiento', label: 'Por profesional y tratamiento' }],
    defaultDesglose: 'profesional_tratamiento',
    sortOptions: SORT_COUNT_NAME, defaultSort: 'cantidad_desc',
  },
  '3.1': {
    id: '3.1', nombre: '3.1.- Porcentaje de citas no asistidas', categoria: '3',
    columns: [
      { key: 'nombre', label: 'Desglose', type: 'text', align: 'left' },
      { key: 'total_citas', label: 'Total citas', type: 'number', align: 'right' },
      { key: 'no_asistidas', label: 'No asistidas', type: 'number', align: 'right' },
      { key: 'porcentaje', label: '% No asistencia', type: 'percent', align: 'right' },
    ],
    desgloseOptions: BY_PERIOD_PROF,
    defaultDesglose: 'sucursal',
    sortOptions: [
      { value: 'porcentaje_desc', label: '% No asistencia ↓' },
      { value: 'total_desc', label: 'Total citas ↓' },
      { value: 'nombre_asc', label: 'Nombre A-Z' },
    ],
    defaultSort: 'porcentaje_desc',
  },
  '3.5': {
    id: '3.5', nombre: '3.5.- Desglose de citas no asistidas', categoria: '3',
    columns: [
      { key: 'nombre', label: 'Desglose', type: 'text', align: 'left' },
      { key: 'cantidad', label: 'No asistidas', type: 'number', align: 'right' },
      { key: 'porcentaje', label: 'Porcentaje', type: 'percent', align: 'right' },
    ],
    desgloseOptions: BY_PERIOD_PROF,
    defaultDesglose: 'profesional', sortOptions: SORT_COUNT_NAME, defaultSort: 'cantidad_desc',
  },
  '3.7': {
    id: '3.7', nombre: '3.7.- Desglose de citas en agenda', categoria: '3',
    columns: [
      { key: 'nombre', label: 'Estado', type: 'text', align: 'left' },
      { key: 'cantidad', label: 'Citas', type: 'number', align: 'right' },
      { key: 'porcentaje', label: 'Porcentaje', type: 'percent', align: 'right' },
    ],
    desgloseOptions: [
      { value: 'estado', label: 'Por estado' },
      { value: 'profesional', label: 'Por profesional' },
      { value: 'sucursal', label: 'Por sucursal' },
      { value: 'mes', label: 'Por mes' },
    ],
    defaultDesglose: 'estado', sortOptions: SORT_COUNT_NAME, defaultSort: 'cantidad_desc',
  },
  '4.1.1': {
    id: '4.1.1', nombre: '4.1.1.- Facturación total', categoria: '4',
    columns: [
      { key: 'nombre', label: 'Desglose', type: 'text', align: 'left' },
      { key: 'cantidad', label: 'Tickets', type: 'number', align: 'right' },
      { key: 'total', label: 'Total MXN', type: 'money', align: 'right' },
      { key: 'porcentaje', label: '% del Total', type: 'percent', align: 'right' },
    ],
    desgloseOptions: BY_PERIOD_PROF,
    defaultDesglose: 'sucursal', sortOptions: SORT_TOTAL_NAME, defaultSort: 'total_desc',
  },
  '4.1.2': {
    id: '4.1.2', nombre: '4.1.2.- Ventas totales', categoria: '4',
    columns: [
      { key: 'nombre', label: 'Desglose', type: 'text', align: 'left' },
      { key: 'cantidad', label: 'Tickets', type: 'number', align: 'right' },
      { key: 'total', label: 'Total MXN', type: 'money', align: 'right' },
      { key: 'porcentaje', label: '% del Total', type: 'percent', align: 'right' },
    ],
    desgloseOptions: BY_PERIOD_PROF,
    defaultDesglose: 'sucursal', sortOptions: SORT_TOTAL_NAME, defaultSort: 'total_desc',
  },
  '4.4.1': {
    id: '4.4.1', nombre: '4.4.1.- Desglose de facturación por tratamiento', categoria: '4',
    columns: [
      { key: 'nombre', label: 'Tratamiento', type: 'text', align: 'left' },
      { key: 'cantidad', label: 'Líneas', type: 'number', align: 'right' },
      { key: 'total', label: 'Total MXN', type: 'money', align: 'right' },
      { key: 'porcentaje', label: '% del Total', type: 'percent', align: 'right' },
    ],
    desgloseOptions: [
      { value: 'tratamiento', label: 'Por tratamiento' },
      { value: 'sucursal', label: 'Por sucursal' },
      { value: 'mes', label: 'Por mes' },
    ],
    defaultDesglose: 'tratamiento', sortOptions: SORT_TOTAL_NAME, defaultSort: 'total_desc',
  },
  '4.5.1': {
    id: '4.5.1', nombre: '4.5.1.- Desglose de facturación por profesional', categoria: '4',
    columns: [
      { key: 'nombre', label: 'Profesional', type: 'text', align: 'left' },
      { key: 'cantidad', label: 'Tickets', type: 'number', align: 'right' },
      { key: 'total', label: 'Total MXN', type: 'money', align: 'right' },
      { key: 'porcentaje', label: '% del Total', type: 'percent', align: 'right' },
    ],
    desgloseOptions: [
      { value: 'profesional', label: 'Por profesional' },
      { value: 'mes', label: 'Por mes' },
    ],
    defaultDesglose: 'profesional', sortOptions: SORT_TOTAL_NAME, defaultSort: 'total_desc',
  },
  '4.6.1': {
    id: '4.6.1', nombre: '4.6.1.- Desglose de facturación por familia', categoria: '4',
    columns: [
      { key: 'nombre', label: 'Familia', type: 'text', align: 'left' },
      { key: 'cantidad', label: 'Líneas', type: 'number', align: 'right' },
      { key: 'total', label: 'Total MXN', type: 'money', align: 'right' },
      { key: 'porcentaje', label: '% del Total', type: 'percent', align: 'right' },
    ],
    desgloseOptions: [
      { value: 'familia', label: 'Por familia' },
      { value: 'sucursal', label: 'Por sucursal' },
    ],
    defaultDesglose: 'familia', sortOptions: SORT_TOTAL_NAME, defaultSort: 'total_desc',
  },
  '4.8.1': {
    id: '4.8.1', nombre: '4.8.1.- Desglose de facturación por vendedor', categoria: '4',
    columns: [
      { key: 'nombre', label: 'Vendedor', type: 'text', align: 'left' },
      { key: 'cantidad', label: 'Tickets', type: 'number', align: 'right' },
      { key: 'total', label: 'Total MXN', type: 'money', align: 'right' },
      { key: 'porcentaje', label: '% del Total', type: 'percent', align: 'right' },
    ],
    desgloseOptions: [
      { value: 'vendedor', label: 'Por vendedor' },
      { value: 'mes', label: 'Por mes' },
    ],
    defaultDesglose: 'vendedor', sortOptions: SORT_TOTAL_NAME, defaultSort: 'total_desc',
  },
  '4.9.1': {
    id: '4.9.1', nombre: '4.9.1.- Desglose de facturación por producto', categoria: '4',
    columns: [
      { key: 'nombre', label: 'Producto', type: 'text', align: 'left' },
      { key: 'cantidad', label: 'Unidades', type: 'number', align: 'right' },
      { key: 'total', label: 'Total MXN', type: 'money', align: 'right' },
      { key: 'porcentaje', label: '% del Total', type: 'percent', align: 'right' },
    ],
    desgloseOptions: [
      { value: 'producto', label: 'Por producto' },
      { value: 'sucursal', label: 'Por sucursal' },
    ],
    defaultDesglose: 'producto', sortOptions: SORT_TOTAL_NAME, defaultSort: 'total_desc',
  },
  '4.10': {
    id: '4.10', nombre: '4.10.- Facturación estimada según agenda', categoria: '4',
    columns: [
      { key: 'nombre', label: 'Desglose', type: 'text', align: 'left' },
      { key: 'cantidad', label: 'Citas programadas', type: 'number', align: 'right' },
      { key: 'total', label: 'Estimado MXN', type: 'money', align: 'right' },
      { key: 'porcentaje', label: '% del Total', type: 'percent', align: 'right' },
    ],
    desgloseOptions: BY_PERIOD_PROF,
    defaultDesglose: 'sucursal', sortOptions: SORT_TOTAL_NAME, defaultSort: 'total_desc',
  },
  '4.12.1': {
    id: '4.12.1', nombre: '4.12.1.- Desglose de facturación por forma de pago', categoria: '4',
    columns: [
      { key: 'nombre', label: 'Forma de pago', type: 'text', align: 'left' },
      { key: 'cantidad', label: 'Pagos', type: 'number', align: 'right' },
      { key: 'total', label: 'Total MXN', type: 'money', align: 'right' },
      { key: 'porcentaje', label: '% del Total', type: 'percent', align: 'right' },
    ],
    desgloseOptions: [{ value: 'metodo_pago', label: 'Por forma de pago' }],
    defaultDesglose: 'metodo_pago', sortOptions: SORT_TOTAL_NAME, defaultSort: 'total_desc',
  },
  '4.16.1': {
    id: '4.16.1', nombre: '4.16.1.- Desglose de tratamientos por unidades realizadas', categoria: '4',
    columns: [
      { key: 'nombre', label: 'Tratamiento', type: 'text', align: 'left' },
      { key: 'cantidad', label: 'Unidades', type: 'number', align: 'right' },
      { key: 'total', label: 'Total MXN', type: 'money', align: 'right' },
      { key: 'porcentaje', label: '% del Total', type: 'percent', align: 'right' },
    ],
    desgloseOptions: [
      { value: 'tratamiento', label: 'Por tratamiento' },
      { value: 'mes', label: 'Por mes' },
    ],
    defaultDesglose: 'tratamiento', sortOptions: SORT_COUNT_NAME, defaultSort: 'cantidad_desc',
  },
  '4.17.1': {
    id: '4.17.1', nombre: '4.17.1.- Desglose de facturación por hora', categoria: '4',
    columns: [
      { key: 'nombre', label: 'Hora', type: 'text', align: 'left' },
      { key: 'cantidad', label: 'Tickets', type: 'number', align: 'right' },
      { key: 'total', label: 'Total MXN', type: 'money', align: 'right' },
      { key: 'porcentaje', label: '% del Total', type: 'percent', align: 'right' },
    ],
    desgloseOptions: [{ value: 'hora', label: 'Por hora' }],
    defaultDesglose: 'hora', sortOptions: SORT_TOTAL_NAME, defaultSort: 'nombre_asc',
  },
  '4.18': {
    id: '4.18', nombre: '4.18.- Reporte de ingresos generados por servicios', categoria: '4',
    columns: [
      { key: 'nombre', label: 'Servicio', type: 'text', align: 'left' },
      { key: 'cantidad', label: 'Líneas', type: 'number', align: 'right' },
      { key: 'total', label: 'Total MXN', type: 'money', align: 'right' },
      { key: 'porcentaje', label: '% del Total', type: 'percent', align: 'right' },
    ],
    desgloseOptions: [
      { value: 'servicio', label: 'Por servicio' },
      { value: 'profesional', label: 'Por profesional' },
      { value: 'mes', label: 'Por mes' },
    ],
    defaultDesglose: 'servicio', sortOptions: SORT_TOTAL_NAME, defaultSort: 'total_desc',
  },
}

// ─── CATEGORIAS for Sidebar ───────────────────────────────────

export const CATEGORIAS = [
  {
    id: '1', nombre: '1. Clientes',
    items: [
      INDICATOR_CONFIG['1.1.1'],
      INDICATOR_CONFIG['1.1.2'],
      INDICATOR_CONFIG['1.1.3'],
      INDICATOR_CONFIG['1.2'],
    ]
  },
  {
    id: '2', nombre: '2. Servicios',
    items: [
      INDICATOR_CONFIG['2.3.1'],
      INDICATOR_CONFIG['2.4'],
      INDICATOR_CONFIG['2.5'],
      INDICATOR_CONFIG['2.6'],
      INDICATOR_CONFIG['2.7'],
    ]
  },
  {
    id: '3', nombre: '3. Agenda',
    items: [
      INDICATOR_CONFIG['3.1'],
      INDICATOR_CONFIG['3.5'],
      INDICATOR_CONFIG['3.7'],
    ]
  },
  {
    id: '4', nombre: '4. Facturación',
    items: [
      INDICATOR_CONFIG['4.1.1'],
      INDICATOR_CONFIG['4.1.2'],
      INDICATOR_CONFIG['4.4.1'],
      INDICATOR_CONFIG['4.5.1'],
      INDICATOR_CONFIG['4.6.1'],
      INDICATOR_CONFIG['4.8.1'],
      INDICATOR_CONFIG['4.9.1'],
      INDICATOR_CONFIG['4.10'],
      INDICATOR_CONFIG['4.12.1'],
      INDICATOR_CONFIG['4.16.1'],
      INDICATOR_CONFIG['4.17.1'],
      INDICATOR_CONFIG['4.18'],
    ]
  }
]

// ─── Helpers ──────────────────────────────────────────────────

export function formatCell(value: any, type: ColType): string {
  if (value === null || value === undefined) return '—'
  switch (type) {
    case 'money': return `$${Number(value).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    case 'percent': return `${Number(value).toFixed(2)} %`
    case 'minutes': return `${Number(value).toFixed(0)} min`
    case 'number': return Number(value).toLocaleString('es-MX')
    default: return String(value)
  }
}

export function applySort(rows: any[], sort: string): any[] {
  const [field, dir] = sort.split('_')
  const desc = dir === 'desc'
  return [...rows].sort((a, b) => {
    const va = a[field] ?? a['nombre'] ?? ''
    const vb = b[field] ?? b['nombre'] ?? ''
    if (typeof va === 'string') return desc ? vb.localeCompare(va) : va.localeCompare(vb)
    return desc ? (vb as number) - (va as number) : (va as number) - (vb as number)
  })
}
