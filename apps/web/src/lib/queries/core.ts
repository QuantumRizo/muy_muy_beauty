import { startOfDayMXIso, endOfDayMXIso } from '../dateUtils'

export interface ReportRow {
  nombre: string
  cantidad?: number
  total?: number
  media?: number
  duracion?: number
  sesiones?: number
  no_asistidas?: number
  total_citas?: number
  tratamiento?: string
  porcentaje?: number
  tipo?: string
  ingresos?: number
  gastos?: number
}

export interface ReportResult {
  rows: ReportRow[]
  totals: Record<string, number>
}

export function pct(val: number, total: number): number {
  if (!total) return 0
  return parseFloat(((val / total) * 100).toFixed(2))
}

export function startOfDayIso(dateStr: string): string {
  if (!dateStr) return ''
  return startOfDayMXIso(dateStr)
}

export function endOfDayIso(dateStr: string): string {
  if (!dateStr) return ''
  return endOfDayMXIso(dateStr)
}

export function buildTotals(rows: ReportRow[]): Record<string, number> {
  return {
    cantidad: rows.reduce((a, r) => a + (r.cantidad ?? 0), 0),
    total: rows.reduce((a, r) => a + (r.total ?? 0), 0),
  }
}

export function groupAndPct(
  data: any[],
  keyFn: (item: any) => string,
  valueFn: (item: any) => { cantidad?: number; total?: number }
): ReportRow[] {
  const groups: Record<string, { cantidad: number; total: number }> = {}
  data.forEach(item => {
    const key = keyFn(item) || 'Sin datos'
    if (!groups[key]) groups[key] = { cantidad: 0, total: 0 }
    const v = valueFn(item)
    groups[key].cantidad += v.cantidad ?? 1
    groups[key].total += v.total ?? 0
  })
  const totalCant = Object.values(groups).reduce((a, g) => a + g.cantidad, 0)
  const totalMXN = Object.values(groups).reduce((a, g) => a + g.total, 0)
  return Object.entries(groups).map(([nombre, g]) => ({
    nombre,
    cantidad: g.cantidad,
    total: g.total || undefined,
    porcentaje: totalMXN > 0 ? pct(g.total, totalMXN) : pct(g.cantidad, totalCant),
  }))
}
