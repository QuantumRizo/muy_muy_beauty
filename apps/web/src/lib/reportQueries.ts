import { supabase } from './supabase'
import { applySort } from './reportConfig'
import { calcularPorcentaje, type CommissionThreshold } from './commissions'

// ─── Result Types ─────────────────────────────────────────────

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

// ─── Helpers ──────────────────────────────────────────────────

function pct(val: number, total: number): number {
  if (!total) return 0
  return parseFloat(((val / total) * 100).toFixed(2))
}

function startOfDayIso(dateStr: string): string {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d, 0, 0, 0, 0).toISOString()
}

function endOfDayIso(dateStr: string): string {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d, 23, 59, 59, 999).toISOString()
}

// ─── Individual Indicator Queries ─────────────────────────────

export async function runQuery(
  id: string,
  desglose: string,
  sort: string,
  fechaInicio: string,
  fechaFin: string,
  sucursalId: string
): Promise<ReportResult> {
  switch (id) {
    case '1.1.1': return q_clientes_nuevos(desglose, sort, fechaInicio, fechaFin, sucursalId)
    case '1.1.2': return q_primeras_sesiones(desglose, sort, fechaInicio, fechaFin, sucursalId)
    case '1.1.3': return q_primeras_compras(desglose, sort, fechaInicio, fechaFin, sucursalId)
    case '1.2':   return q_como_conocio(sort, fechaInicio, fechaFin)
    case '2.3.1': return q_clientes_por_tratamiento(desglose, sort, fechaInicio, fechaFin, sucursalId)
    case '2.4':   return q_media_tratamientos(desglose, sort, fechaInicio, fechaFin, sucursalId)
    case '2.5':   return q_duracion_media(sort)
    case '2.6':   return q_sesiones_asistidas(desglose, sort, fechaInicio, fechaFin, sucursalId)
    case '2.7':   return q_sesiones_profesional_tratamiento(sort, fechaInicio, fechaFin, sucursalId)
    case '3.1':   return q_no_asistidas_pct(desglose, sort, fechaInicio, fechaFin, sucursalId)
    case '3.5':   return q_desglose_no_asistidas(desglose, sort, fechaInicio, fechaFin, sucursalId)
    case '3.7':   return q_citas_agenda(desglose, sort, fechaInicio, fechaFin, sucursalId)
    case '4.0':  return q_facturacion_neta(desglose, sort, fechaInicio, fechaFin, sucursalId)
    case '4.1.1': return q_facturacion(desglose, sort, fechaInicio, fechaFin, sucursalId, false)
    case '4.1.2': return q_facturacion(desglose, sort, fechaInicio, fechaFin, sucursalId, true)
    case '4.4.1': return q_facturacion_tratamiento(desglose, sort, fechaInicio, fechaFin, sucursalId)
    case '4.5.1': return q_facturacion_profesional(desglose, sort, fechaInicio, fechaFin, sucursalId)
    case '4.6.1': return q_facturacion_familia(desglose, sort, fechaInicio, fechaFin, sucursalId)
    case '4.8.1': return q_facturacion_vendedor(desglose, sort, fechaInicio, fechaFin, sucursalId)
    case '4.9.1': return q_facturacion_producto(desglose, sort, fechaInicio, fechaFin, sucursalId)
    case '4.10':  return q_facturacion_estimada(desglose, sort, fechaInicio, fechaFin, sucursalId)
    case '4.12.1':return q_por_forma_pago(sort, fechaInicio, fechaFin, sucursalId)
    case '4.16.1':return q_tratamientos_unidades(desglose, sort, fechaInicio, fechaFin, sucursalId)
    case '4.17.1':return q_facturacion_por_hora(sort, fechaInicio, fechaFin, sucursalId)
    case '4.18':  return q_ingresos_servicios(desglose, sort, fechaInicio, fechaFin, sucursalId)
    case '5.1':   return q_inventory_metrics(fechaInicio, fechaFin, sucursalId)
    case '5.2':   return q_salary_metrics()
    case '5.3':   return q_cash_metrics(fechaInicio, fechaFin, sucursalId)
    case 'A.1':   return q_ticket_promedio(fechaInicio, fechaFin, sucursalId)
    case 'A.2':   return q_retention_rate(fechaInicio, fechaFin)
    case 'A.3':   return q_ingresos_sucursal_stacked(fechaInicio, fechaFin)
    case 'A.4':   return q_service_mix(fechaInicio, fechaFin, sucursalId)
    case 'A.5':   return q_citas_tendencia(fechaInicio, fechaFin, sucursalId)
    case 'A.6':   return q_heatmap_afluencia(fechaInicio, fechaFin, sucursalId)
    case 'A.7':   return q_stock_semaforo()
    case 'A.8':   return q_top_empleados(fechaInicio, fechaFin, sucursalId)
    case 'A.9':   return q_servicios_familia_tendencia(fechaInicio, fechaFin, sucursalId)
    default: throw new Error(`Indicador ${id} no implementado`)
  }
}

// ─── Helper: group data ───────────────────────────────────────

function groupAndPct(
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

function buildTotals(rows: ReportRow[]): Record<string, number> {
  return {
    cantidad: rows.reduce((a, r) => a + (r.cantidad ?? 0), 0),
    total: rows.reduce((a, r) => a + (r.total ?? 0), 0),
  }
}

// ─── 1.1.1 Clientes nuevos ────────────────────────────────────

async function q_clientes_nuevos(desglose: string, sort: string, fi: string, ff: string, _suc: string): Promise<ReportResult> {
  // Los clientes son globales (no tienen sucursal_id propio).
  // El desglose y filtro por sucursal no aplica en esta tabla.
  const { data, error } = await supabase
    .from('clientes')
    .select('id, created_at')
    .gte('created_at', startOfDayIso(fi))
    .lte('created_at', endOfDayIso(ff))
  
  if (error) throw error

  const keyFn = (c: any) => {
    if (desglose === 'mes') return c.created_at.substring(0, 7)
    if (desglose === 'dia') return c.created_at.substring(0, 10)
    return 'Total'
  }

  const rows = groupAndPct(data, keyFn, () => ({ cantidad: 1 }))
  const totalCant = rows.reduce((a, r) => a + (r.cantidad ?? 0), 0)
  rows.forEach(r => { r.porcentaje = pct(r.cantidad ?? 0, totalCant) })

  return { rows: applySort(rows, sort), totals: buildTotals(rows) }
}

// ─── 1.1.2 Primeras sesiones ──────────────────────────────────

async function q_primeras_sesiones(desglose: string, sort: string, fi: string, ff: string, suc: string): Promise<ReportResult> {
  let query = supabase
    .from('citas')
    .select('id, cliente_id, fecha, sucursal_id, sucursal:sucursales(nombre), empleada:perfiles_empleadas(nombre)')
    .gte('fecha', fi).lte('fecha', ff)
    .in('estado', ['Programada', 'En curso', 'Finalizada'])
    .order('fecha', { ascending: true })

  if (suc !== 'all') query = query.eq('sucursal_id', suc)
  
  const { data, error } = await query
  if (error) throw error

  if (!data || data.length === 0) return { rows: [], totals: buildTotals([]) }

  const clientIdsInPeriod = Array.from(new Set(data.map(c => c.cliente_id).filter(Boolean)))

  let clientsWithPrior = new Set<string>()
  const BATCH_SIZE = 100
  for (let i = 0; i < clientIdsInPeriod.length; i += BATCH_SIZE) {
    const batch = clientIdsInPeriod.slice(i, i + BATCH_SIZE)
    const { data: prior } = await supabase
      .from('citas')
      .select('cliente_id')
      .in('cliente_id', batch)
      .lt('fecha', fi)
      .in('estado', ['Programada', 'En curso', 'Finalizada'])
    prior?.forEach(p => clientsWithPrior.add(p.cliente_id))
  }

  const seenNew = new Set<string>()
  const firsts = data.filter(c => {
    if (!c.cliente_id || clientsWithPrior.has(c.cliente_id) || seenNew.has(c.cliente_id)) return false
    seenNew.add(c.cliente_id)
    return true
  })

  const keyFn = (c: any) => {
    if (desglose === 'sucursal') return c.sucursal?.nombre || 'Sin sucursal'
    if (desglose === 'mes') return c.fecha.substring(0, 7)
    if (desglose === 'dia') return c.fecha
    return 'Total'
  }

  const rows = groupAndPct(firsts, keyFn, () => ({ cantidad: 1 }))
  const totalCant = rows.reduce((a, r) => a + (r.cantidad ?? 0), 0)
  rows.forEach(r => { r.porcentaje = pct(r.cantidad ?? 0, totalCant); r.total = undefined })

  return { rows: applySort(rows, sort), totals: buildTotals(rows) }
}

// ─── 1.1.3 Primeras compras ───────────────────────────────────

async function q_primeras_compras(desglose: string, sort: string, fi: string, ff: string, suc: string): Promise<ReportResult> {
  let query = supabase
    .from('tickets')
    .select('id, cliente_id, fecha, total, sucursal_id, sucursal:sucursales(nombre)')
    .gte('fecha', fi).lte('fecha', ff)
    .eq('estado', 'Pagado')
    .order('fecha', { ascending: true })

  if (suc !== 'all') query = query.eq('sucursal_id', suc)
  const { data, error } = await query
  if (error) throw error

  if (!data || data.length === 0) return { rows: [], totals: buildTotals([]) }

  const clientIdsInPeriod = Array.from(new Set(data.map(t => t.cliente_id).filter(Boolean)))

  let clientsWithPrior = new Set<string>()
  const BATCH_SIZE = 100
  for (let i = 0; i < clientIdsInPeriod.length; i += BATCH_SIZE) {
    const batch = clientIdsInPeriod.slice(i, i + BATCH_SIZE)
    const { data: prior } = await supabase
      .from('tickets')
      .select('cliente_id')
      .in('cliente_id', batch)
      .lt('fecha', fi)
      .eq('estado', 'Pagado')
    prior?.forEach(p => clientsWithPrior.add(p.cliente_id))
  }

  const seenNew = new Set<string>()
  const firsts = data.filter(t => {
    if (!t.cliente_id || clientsWithPrior.has(t.cliente_id) || seenNew.has(t.cliente_id)) return false
    seenNew.add(t.cliente_id)
    return true
  })

  const keyFn = (t: any) => {
    if (desglose === 'sucursal') return t.sucursal?.nombre || 'Sin sucursal'
    if (desglose === 'mes') return t.fecha.substring(0, 7)
    if (desglose === 'dia') return t.fecha
    return 'Total'
  }

  const rows = groupAndPct(firsts, keyFn, (t: any) => ({ cantidad: 1, total: t.total }))
  const totalMXN = rows.reduce((a, r) => a + (r.total ?? 0), 0)
  rows.forEach(r => { r.porcentaje = pct(r.total ?? 0, totalMXN) })

  return { rows: applySort(rows, sort), totals: buildTotals(rows) }
}

// ─── 1.2 ¿Cómo nos conoció? ──────────────────────────────────

async function q_como_conocio(sort: string, fi: string, ff: string): Promise<ReportResult> {
  const { data, error } = await supabase
    .from('clientes')
    .select('datos_extra, created_at')
    .gte('created_at', startOfDayIso(fi))
    .lte('created_at', endOfDayIso(ff))
  if (error) throw error

  const keyFn = (c: any) => c.datos_extra?.procedencia || 'No especificado'
  const rows = groupAndPct(data, keyFn, () => ({ cantidad: 1 }))
  const totalCant = rows.reduce((a, r) => a + (r.cantidad ?? 0), 0)
  rows.forEach(r => { r.porcentaje = pct(r.cantidad ?? 0, totalCant); r.total = undefined })

  return { rows: applySort(rows, sort), totals: buildTotals(rows) }
}

// ─── 2.3.1 Clientes por tratamiento ──────────────────────────

async function q_clientes_por_tratamiento(desglose: string, sort: string, fi: string, ff: string, suc: string): Promise<ReportResult> {
  let query = supabase
    .from('citas')
    .select('cliente_id, sucursal_id, fecha, sucursal:sucursales(nombre), cita_servicios(servicio_id, servicios(nombre))')
    .gte('fecha', fi).lte('fecha', ff)
    .in('estado', ['Programada', 'En curso', 'Finalizada'])
    
  if (suc !== 'all') query = query.eq('sucursal_id', suc)
  const { data, error } = await query
  if (error) throw error

  const groups: Record<string, Set<string>> = {}
  
  data?.forEach((c: any) => {
    c.cita_servicios?.forEach((cs: any) => {
      const trat = cs.servicios?.nombre || 'Sin nombre'
      const key = desglose === 'sucursal' ? (c.sucursal?.nombre || 'Sin sucursal')
        : desglose === 'mes' ? c.fecha.substring(0, 7)
        : trat
      if (!groups[key]) groups[key] = new Set()
      if (c.cliente_id) groups[key].add(c.cliente_id)
    })
  })

  const rows: ReportRow[] = Object.entries(groups).map(([nombre, pSet]) => ({
    nombre, cantidad: pSet.size
  }))

  const totalCant = rows.reduce((a, r) => a + (r.cantidad ?? 0), 0)
  rows.forEach(r => { r.porcentaje = pct(r.cantidad ?? 0, totalCant) })

  return { rows: applySort(rows, sort), totals: buildTotals(rows) }
}

// ─── 2.4 Media tratamientos por cliente ──────────────────────

async function q_media_tratamientos(desglose: string, sort: string, fi: string, ff: string, suc: string): Promise<ReportResult> {
  let query = supabase
    .from('citas')
    .select('cliente_id, sucursal_id, fecha, sucursal:sucursales(nombre), cita_servicios(id)')
    .gte('fecha', fi).lte('fecha', ff)
    .in('estado', ['Programada', 'En curso', 'Finalizada'])
  if (suc !== 'all') query = query.eq('sucursal_id', suc)
  const { data, error } = await query
  if (error) throw error

  const groups: Record<string, { clientes: Set<string>; servicios: number }> = {}
  data?.forEach((c: any) => {
    const key = desglose === 'sucursal' ? (c.sucursal?.nombre || 'Sin sucursal')
      : desglose === 'mes' ? c.fecha.substring(0, 7)
      : desglose === 'dia' ? c.fecha : 'Total'
    if (!groups[key]) groups[key] = { clientes: new Set(), servicios: 0 }
    if (c.cliente_id) groups[key].clientes.add(c.cliente_id)
    groups[key].servicios += (c.cita_servicios?.length ?? 0)
  })

  const rows: ReportRow[] = Object.entries(groups).map(([nombre, g]) => ({
    nombre,
    cantidad: g.clientes.size,
    total: g.servicios,
    media: g.clientes.size ? parseFloat((g.servicios / g.clientes.size).toFixed(2)) : 0,
  }))

  return { rows: applySort(rows, sort), totals: buildTotals(rows) }
}

// ─── 2.5 Duración media de tratamientos ──────────────────────

async function q_duracion_media(sort: string): Promise<ReportResult> {
  const { data, error } = await supabase
    .from('servicios')
    .select('nombre, duracion_slots')
    .eq('activo', true)
    .order('nombre')
  if (error) throw error

  const rows: ReportRow[] = (data || []).map(s => ({
    nombre: s.nombre,
    duracion: (s.duracion_slots ?? 0) * 15,
    sesiones: s.duracion_slots,
  }))

  return { rows: applySort(rows, sort), totals: {} }
}

// ─── 2.6 Sesiones asistidas por tratamiento ───────────────────

async function q_sesiones_asistidas(desglose: string, sort: string, fi: string, ff: string, suc: string): Promise<ReportResult> {
  let query = supabase
    .from('citas')
    .select('fecha, sucursal_id, cita_servicios(servicio_id, servicios(nombre))')
    .gte('fecha', fi).lte('fecha', ff)
    .eq('estado', 'Finalizada')
  if (suc !== 'all') query = query.eq('sucursal_id', suc)
  const { data, error } = await query
  if (error) throw error

  const flat: any[] = []
  data?.forEach((c: any) => {
    c.cita_servicios?.forEach((cs: any) => {
      flat.push({ servicio: cs.servicios?.nombre || 'Sin nombre', mes: c.fecha.substring(0, 7) })
    })
  })

  const keyFn = (item: any) => desglose === 'mes' ? item.mes : item.servicio
  const rows = groupAndPct(flat, keyFn, () => ({ cantidad: 1 }))
  const totalCant = rows.reduce((a, r) => a + (r.cantidad ?? 0), 0)
  rows.forEach(r => { r.porcentaje = pct(r.cantidad ?? 0, totalCant); r.total = undefined })
  return { rows: applySort(rows, sort), totals: buildTotals(rows) }
}

// ─── 2.7 Sesiones por profesional y tratamiento ───────────────

async function q_sesiones_profesional_tratamiento(sort: string, fi: string, ff: string, suc: string): Promise<ReportResult> {
  let query = supabase
    .from('citas')
    .select('empleada:perfiles_empleadas(nombre), fecha, cita_servicios(servicios(nombre))')
    .gte('fecha', fi).lte('fecha', ff)
    .eq('estado', 'Finalizada')
  if (suc !== 'all') query = query.eq('sucursal_id', suc)
  const { data, error } = await query
  if (error) throw error

  const groups: Record<string, number> = {}
  data?.forEach((c: any) => {
    const prof = (c.empleada as any)?.nombre || 'Sin profesional'
    c.cita_servicios?.forEach((cs: any) => {
      const trat = cs.servicios?.nombre || 'Sin nombre'
      const key = `${prof} — ${trat}`
      groups[key] = (groups[key] || 0) + 1
    })
  })

  const rows: ReportRow[] = Object.entries(groups).map(([nombre, cantidad]) => ({
    nombre: nombre.split(' — ')[0],
    tratamiento: nombre.split(' — ')[1],
    cantidad,
  }))

  return { rows: applySort(rows, sort), totals: buildTotals(rows) }
}

// ─── 3.1 % No asistidas ───────────────────────────────────────

async function q_no_asistidas_pct(desglose: string, sort: string, fi: string, ff: string, suc: string): Promise<ReportResult> {
  let query = supabase
    .from('citas')
    .select('estado, fecha, sucursal_id, empleada_id, sucursal:sucursales(nombre), empleada:perfiles_empleadas(nombre)')
    .gte('fecha', fi).lte('fecha', ff)
  if (suc !== 'all') query = query.eq('sucursal_id', suc)
  const { data, error } = await query
  if (error) throw error

  const groups: Record<string, { total: number; no_asistidas: number }> = {}
  data?.forEach((c: any) => {
    const key = desglose === 'profesional' ? (c.empleada?.nombre || 'Sin profesional')
      : desglose === 'mes' ? c.fecha.substring(0, 7)
      : desglose === 'dia' ? c.fecha
      : c.sucursal?.nombre || 'Sin sucursal'
    if (!groups[key]) groups[key] = { total: 0, no_asistidas: 0 }
    groups[key].total++
    if (c.estado === 'No asistió' || c.estado === 'Cancelada') groups[key].no_asistidas++
  })

  const rows: ReportRow[] = Object.entries(groups).map(([nombre, g]) => ({
    nombre,
    total_citas: g.total,
    no_asistidas: g.no_asistidas,
    porcentaje: pct(g.no_asistidas, g.total),
  }))

  return { rows: applySort(rows, sort === 'porcentaje_desc' ? 'porcentaje_desc' : sort === 'total_desc' ? 'total_citas_desc' : sort), totals: { cantidad: rows.reduce((a, r) => a + (r.total_citas ?? 0), 0), total: rows.reduce((a, r) => a + (r.no_asistidas ?? 0), 0) } }
}

// ─── 3.5 Desglose citas no asistidas ─────────────────────────

async function q_desglose_no_asistidas(desglose: string, sort: string, fi: string, ff: string, suc: string): Promise<ReportResult> {
  let query = supabase
    .from('citas')
    .select('estado, fecha, sucursal_id, empleada:perfiles_empleadas(nombre), sucursal:sucursales(nombre)')
    .gte('fecha', fi).lte('fecha', ff)
    .or('estado.eq.No asistió,estado.eq.Cancelada')
  if (suc !== 'all') query = query.eq('sucursal_id', suc)
  const { data, error } = await query
  if (error) throw error

  const keyFn = (c: any) => {
    if (desglose === 'profesional') return c.empleada?.nombre || 'Sin profesional'
    if (desglose === 'sucursal') return c.sucursal?.nombre || 'Sin sucursal'
    if (desglose === 'mes') return c.fecha.substring(0, 7)
    return c.fecha
  }

  const rows = groupAndPct(data, keyFn, () => ({ cantidad: 1 }))
  const totalCant = rows.reduce((a, r) => a + (r.cantidad ?? 0), 0)
  rows.forEach(r => { r.porcentaje = pct(r.cantidad ?? 0, totalCant); r.total = undefined })
  return { rows: applySort(rows, sort), totals: buildTotals(rows) }
}

// ─── 3.7 Citas en agenda ─────────────────────────────────────

async function q_citas_agenda(desglose: string, sort: string, fi: string, ff: string, suc: string): Promise<ReportResult> {
  let query = supabase
    .from('citas')
    .select('estado, fecha, sucursal_id, empleada:perfiles_empleadas(nombre), sucursal:sucursales(nombre)')
    .gte('fecha', fi).lte('fecha', ff)
    .not('estado', 'in', '("Cancelada","No asistió")')
  if (suc !== 'all') query = query.eq('sucursal_id', suc)
  const { data, error } = await query
  if (error) throw error

  const keyFn = (c: any) => {
    if (desglose === 'estado') return c.estado
    if (desglose === 'profesional') return c.empleada?.nombre || 'Sin profesional'
    if (desglose === 'sucursal') return c.sucursal?.nombre || 'Sin sucursal'
    return c.fecha.substring(0, 7)
  }

  const rows = groupAndPct(data, keyFn, () => ({ cantidad: 1 }))
  const totalCant = rows.reduce((a, r) => a + (r.cantidad ?? 0), 0)
  rows.forEach(r => { r.porcentaje = pct(r.cantidad ?? 0, totalCant); r.total = undefined })
  return { rows: applySort(rows, sort), totals: buildTotals(rows) }
}

// ─── 4.0 Facturación Neta (Ingresos – Gastos) ─────────────────

async function q_facturacion_neta(desglose: string, sort: string, fi: string, ff: string, suc: string): Promise<ReportResult> {
  // ─── 1. INGRESOS: Total de tickets pagados (sin propina) ───
  let ingresosQuery = supabase
    .from('ticket_items')
    .select('total, nombre, tipo, ticket:tickets!inner(fecha, estado, sucursal_id)')
    .eq('ticket.estado', 'Pagado')
    .gte('ticket.fecha', fi).lte('ticket.fecha', ff)
  if (suc !== 'all') ingresosQuery = ingresosQuery.eq('ticket.sucursal_id', suc)
  const { data: ticketsItems, error: ticketsErr } = await ingresosQuery
  if (ticketsErr) throw ticketsErr

  let totalIngresos = 0
  const ingresosGroups: Record<string, number> = {}

  if (desglose === 'familia') {
    const { data: servicios } = await supabase.from('servicios').select('nombre, familia')
    const familiaMap: Record<string, string> = {}
    servicios?.forEach(s => { familiaMap[s.nombre] = s.familia || 'Otros' })
    
    ;(ticketsItems || []).forEach((t: any) => {
      totalIngresos += (t.total || 0)
      let groupName = 'Ingresos - Otros'
      if (t.tipo === 'Servicio') groupName = `Ingresos - ${familiaMap[t.nombre] || 'Otros'}`
      if (t.tipo === 'Producto') groupName = `Ingresos - Productos`
      
      ingresosGroups[groupName] = (ingresosGroups[groupName] || 0) + (t.total || 0)
    })
  } else if (desglose === 'servicio') {
    ;(ticketsItems || []).forEach((t: any) => {
      totalIngresos += (t.total || 0)
      const groupName = `Ingresos - ${t.nombre || 'Desconocido'}`
      ingresosGroups[groupName] = (ingresosGroups[groupName] || 0) + (t.total || 0)
    })
  } else {
    // desglose === 'concepto'
    ;(ticketsItems || []).forEach((t: any) => {
      totalIngresos += (t.total || 0)
    })
    ingresosGroups['Ingresos por Ventas'] = totalIngresos
  }

  // ─── 2. GASTO: Sueldos (sueldo_diario × días con registro de Entrada) ───
  let asistQuery = supabase
    .from('asistencia')
    .select('empleada_id, created_at, tipo')
    .gte('created_at', `${fi}T00:00:00`)
    .lte('created_at', `${ff}T23:59:59`)
  if (suc !== 'all') asistQuery = asistQuery.eq('sucursal_id', suc)
  const { data: asistencia, error: asistErr } = await asistQuery
  if (asistErr) throw asistErr

  // Filtrar solo 'Entrada' para contar días trabajados
  const entradas = (asistencia || []).filter((a: any) => a.tipo === 'Entrada')

  // Contar días únicos por empleada
  const diasPorEmpleada: Record<string, Set<string>> = {}
  entradas.forEach((a: any) => {
    const empId = a.empleada_id
    if (!empId) return
    if (!diasPorEmpleada[empId]) diasPorEmpleada[empId] = new Set()
    diasPorEmpleada[empId].add(new Date(a.created_at).toISOString().split('T')[0])
  })

  // Traer sueldos diarios de las empleadas
  const { data: emps, error: empsErr } = await supabase
    .from('perfiles_empleadas')
    .select('id, sueldo_diario')
    .eq('activo', true)
  if (empsErr) throw empsErr

  let totalSueldos = 0
  ;(emps || []).forEach((emp: any) => {
    const dias = diasPorEmpleada[emp.id]?.size || 0
    totalSueldos += dias * (emp.sueldo_diario || 0)
  })

  // ─── 3. GASTO: Costo de inventario (productos vendidos) ───
  let itemQuery = supabase
    .from('ticket_items')
    .select('total, cantidad, referencia_id, ticket:tickets!inner(fecha, estado, sucursal_id)')
    .eq('tipo', 'Producto')
    .eq('ticket.estado', 'Pagado')
    .gte('ticket.fecha', fi).lte('ticket.fecha', ff)
  if (suc !== 'all') itemQuery = itemQuery.eq('ticket.sucursal_id', suc)
  const { data: prodItems, error: prodErr } = await itemQuery
  if (prodErr) throw prodErr

  const productIds = Array.from(new Set((prodItems || []).map((i: any) => i.referencia_id).filter(Boolean)))
  let totalCostoInventario = 0
  if (productIds.length > 0) {
    const { data: products } = await supabase
      .from('productos')
      .select('id, precio_costo')
      .in('id', productIds)
    const costMap: Record<string, number> = {}
    products?.forEach((p: any) => { costMap[p.id] = p.precio_costo || 0 })
    ;(prodItems || []).forEach((i: any) => {
      totalCostoInventario += (i.cantidad || 0) * (costMap[i.referencia_id] || 0)
    })
  }

  // ─── 4. GASTO: Comisiones del periodo ───
  const [anioStr, mesStr] = fi.split('-')
  const mesNum = parseInt(mesStr, 10)
  const anioNum = parseInt(anioStr, 10)

  let ventaQuery = supabase
    .from('ticket_items')
    .select('vendedor_id, total, ticket:tickets!inner(fecha, estado, sucursal_id)')
    .eq('ticket.estado', 'Pagado')
    .gte('ticket.fecha', fi).lte('ticket.fecha', ff)
  if (suc !== 'all') ventaQuery = ventaQuery.eq('ticket.sucursal_id', suc)
  const { data: ventaItems, error: ventaErr } = await ventaQuery
  if (ventaErr) throw ventaErr

  const ventasPorVendedor: Record<string, number> = {}
  ;(ventaItems || []).forEach((item: any) => {
    const vid = item.vendedor_id
    if (!vid) return
    ventasPorVendedor[vid] = (ventasPorVendedor[vid] || 0) + (Number(item.total) || 0)
  })

  const { data: evals } = await supabase
    .from('evaluaciones_hoja')
    .select('empleada_id, cumplio_hoja')
    .eq('mes', mesNum)
    .eq('anio', anioNum)

  const evalMap: Record<string, boolean> = {}
  ;(evals || []).forEach((ev: any) => {
    if (ev.cumplio_hoja) evalMap[ev.empleada_id] = true
    else if (!(ev.empleada_id in evalMap)) evalMap[ev.empleada_id] = false
  })

  const { data: config } = await supabase
    .from('config_comisiones')
    .select('*')
    .order('umbral', { ascending: true })
  const tablaComisiones = (config as CommissionThreshold[]) || []

  let totalComisiones = 0
  Object.entries(ventasPorVendedor).forEach(([empId, totalConIva]) => {
    const cumplioHoja = evalMap[empId] ?? false
    const totalSinIva = totalConIva / 1.16
    const porcentaje = calcularPorcentaje(totalConIva, cumplioHoja, tablaComisiones)
    totalComisiones += (totalSinIva * porcentaje) / 100
  })

  // ─── Construir filas ───
  const neto = totalIngresos - totalSueldos - totalCostoInventario - totalComisiones
  const totalGastos = totalSueldos + totalCostoInventario + totalComisiones

  let rows: ReportRow[] = Object.entries(ingresosGroups).map(([nombre, total]) => ({
    nombre,
    ingresos: total,
    gastos: 0
  }))

  rows.push({ nombre: 'Sueldos (Días trabajados)', ingresos: 0, gastos: totalSueldos })
  rows.push({ nombre: 'Costo de Inventario', ingresos: 0, gastos: totalCostoInventario })
  rows.push({ nombre: 'Comisiones', ingresos: 0, gastos: totalComisiones })

  rows = applySort(rows, sort)

  return {
    rows,
    totals: { ingresos: totalIngresos, gastos: totalGastos, total: neto }
  }
}

// ─── 4.1.1 Facturación total ─────────────────────────────────

async function q_facturacion(desglose: string, sort: string, fi: string, ff: string, suc: string, includeAll: boolean): Promise<ReportResult> {
  let query = supabase
    .from('tickets')
    .select('total, fecha, sucursal_id, vendedor_id, sucursal:sucursales(nombre), vendedor:perfiles_empleadas(nombre)')
    .gte('fecha', fi).lte('fecha', ff)
  if (!includeAll) query = query.eq('estado', 'Pagado')
  if (suc !== 'all') query = query.eq('sucursal_id', suc)
  const { data, error } = await query
  if (error) throw error

  const keyFn = (t: any) => {
    if (desglose === 'sucursal') return t.sucursal?.nombre || 'Sin sucursal'
    if (desglose === 'profesional') return t.vendedor?.nombre || 'Sin profesional'
    if (desglose === 'mes') return t.fecha.substring(0, 7)
    return t.fecha
  }

  const rows = groupAndPct(data, keyFn, (t: any) => ({ cantidad: 1, total: t.total }))
  const totalMXN = rows.reduce((a, r) => a + (r.total ?? 0), 0)
  rows.forEach(r => { r.porcentaje = pct(r.total ?? 0, totalMXN) })
  return { rows: applySort(rows, sort), totals: buildTotals(rows) }
}

// ─── 4.4.1 Facturación por tratamiento ───────────────────────

async function q_facturacion_tratamiento(desglose: string, sort: string, fi: string, ff: string, suc: string): Promise<ReportResult> {
  let query = supabase
    .from('ticket_items')
    .select('nombre, cantidad, total, ticket:tickets!inner(fecha, estado, sucursal_id, sucursal:sucursales(nombre))')
    .eq('tipo', 'Servicio')
    .eq('ticket.estado', 'Pagado')
    .gte('ticket.fecha', fi).lte('ticket.fecha', ff)
  if (suc !== 'all') query = query.eq('ticket.sucursal_id', suc)
  const { data, error } = await query
  if (error) throw error

  const keyFn = (item: any) => {
    if (desglose === 'sucursal') return (item.ticket as any)?.sucursal?.nombre || 'Sin sucursal'
    if (desglose === 'mes') return (item.ticket as any)?.fecha?.substring(0, 7) || 'Sin fecha'
    return item.nombre
  }

  const rows = groupAndPct(data, keyFn, (i: any) => ({ cantidad: i.cantidad || 1, total: i.total }))
  const totalMXN = rows.reduce((a, r) => a + (r.total ?? 0), 0)
  rows.forEach(r => { r.porcentaje = pct(r.total ?? 0, totalMXN) })
  return { rows: applySort(rows, sort), totals: buildTotals(rows) }
}

// ─── 4.5.1 Facturación por profesional ───────────────────────

async function q_facturacion_profesional(desglose: string, sort: string, fi: string, ff: string, suc: string): Promise<ReportResult> {
  let query = supabase
    .from('tickets')
    .select('total, fecha, sucursal_id, vendedor:perfiles_empleadas(nombre)')
    .gte('fecha', fi).lte('fecha', ff).eq('estado', 'Pagado')
  if (suc !== 'all') query = query.eq('sucursal_id', suc)
  const { data, error } = await query
  if (error) throw error

  const keyFn = (t: any) => desglose === 'mes' ? t.fecha.substring(0, 7) : (t.vendedor?.nombre || 'Sin profesional')
  const rows = groupAndPct(data, keyFn, (t: any) => ({ cantidad: 1, total: t.total }))
  const totalMXN = rows.reduce((a, r) => a + (r.total ?? 0), 0)
  rows.forEach(r => { r.porcentaje = pct(r.total ?? 0, totalMXN) })
  return { rows: applySort(rows, sort), totals: buildTotals(rows) }
}

// ─── 4.6.1 Facturación por familia ───────────────────────────

async function q_facturacion_familia(desglose: string, sort: string, fi: string, ff: string, suc: string): Promise<ReportResult> {
  let query = supabase
    .from('ticket_items')
    .select('nombre, total, tipo, ticket:tickets!inner(fecha, estado, sucursal_id, sucursal:sucursales(nombre))')
    .eq('ticket.estado', 'Pagado')
    .gte('ticket.fecha', fi).lte('ticket.fecha', ff)

  if (suc !== 'all') query = query.eq('ticket.sucursal_id', suc)

  const { data, error } = await query
  if (error) throw error

  // We need to join with servicios to get familia. Build a fast lookup.
  const { data: servicios } = await supabase.from('servicios').select('nombre, familia')
  const familiaByNombre: Record<string, string> = {}
  servicios?.forEach(s => { familiaByNombre[s.nombre] = s.familia || 'Sin familia' })

  const keyFn = (item: any) => {
    if (desglose === 'sucursal') return (item.ticket as any)?.sucursal?.nombre || 'Sin sucursal'
    return familiaByNombre[item.nombre] || 'Sin familia'
  }

  const rows = groupAndPct(data, keyFn, (i: any) => ({ cantidad: 1, total: i.total }))
  const totalMXN = rows.reduce((a, r) => a + (r.total ?? 0), 0)
  rows.forEach(r => { r.porcentaje = pct(r.total ?? 0, totalMXN) })
  return { rows: applySort(rows, sort), totals: buildTotals(rows) }
}

// ─── 4.8.1 Facturación por vendedor (same as profesional alias) ─

async function q_facturacion_vendedor(desglose: string, sort: string, fi: string, ff: string, suc: string): Promise<ReportResult> {
  return q_facturacion_profesional(desglose, sort, fi, ff, suc)
}

// ─── 4.9.1 Facturación por producto ──────────────────────────

async function q_facturacion_producto(desglose: string, sort: string, fi: string, ff: string, suc: string): Promise<ReportResult> {
  let query = supabase
    .from('ticket_items')
    .select('nombre, cantidad, total, ticket:tickets!inner(fecha, estado, sucursal_id, sucursal:sucursales(nombre))')
    .eq('tipo', 'Producto')
    .eq('ticket.estado', 'Pagado')
    .gte('ticket.fecha', fi).lte('ticket.fecha', ff)

  if (suc !== 'all') query = query.eq('ticket.sucursal_id', suc)

  const { data, error } = await query
  if (error) throw error

  const keyFn = (item: any) => desglose === 'sucursal' ? (item.ticket as any)?.sucursal?.nombre || 'Sin sucursal' : item.nombre
  const rows = groupAndPct(data, keyFn, (i: any) => ({ cantidad: i.cantidad || 1, total: i.total }))
  const totalMXN = rows.reduce((a, r) => a + (r.total ?? 0), 0)
  rows.forEach(r => { r.porcentaje = pct(r.total ?? 0, totalMXN) })
  return { rows: applySort(rows, sort), totals: buildTotals(rows) }
}

// ─── 4.10 Facturación estimada ────────────────────────────────

async function q_facturacion_estimada(desglose: string, sort: string, fi: string, ff: string, suc: string): Promise<ReportResult> {
  let query = supabase
    .from('citas')
    .select('fecha, sucursal_id, empleada_id, sucursal:sucursales(nombre), empleada:perfiles_empleadas(nombre), cita_servicios(servicios(precio))')
    .gte('fecha', fi).lte('fecha', ff)
    .eq('estado', 'Programada')
  if (suc !== 'all') query = query.eq('sucursal_id', suc)
  const { data, error } = await query
  if (error) throw error

  const keyFn = (c: any) => {
    if (desglose === 'sucursal') return c.sucursal?.nombre || 'Sin sucursal'
    if (desglose === 'profesional') return c.empleada?.nombre || 'Sin profesional'
    if (desglose === 'mes') return c.fecha.substring(0, 7)
    return c.fecha
  }

  const rows = groupAndPct(data, keyFn, (c: any) => {
    const precio = (c.cita_servicios || []).reduce((s: number, cs: any) => s + (cs.servicios?.precio || 0), 0)
    return { cantidad: 1, total: precio }
  })
  const totalMXN = rows.reduce((a, r) => a + (r.total ?? 0), 0)
  rows.forEach(r => { r.porcentaje = pct(r.total ?? 0, totalMXN) })
  return { rows: applySort(rows, sort), totals: buildTotals(rows) }
}

// ─── 4.12.1 Por forma de pago ─────────────────────────────────

// ─── 4.12.1 Forma de pago ──── usa mv_pagos_diarios ────────────
async function q_por_forma_pago(sort: string, fi: string, ff: string, suc: string): Promise<ReportResult> {
  let query = supabase
    .from('mv_pagos_diarios')
    .select('metodo_pago, cantidad, total')
    .gte('fecha', fi).lte('fecha', ff)
  if (suc !== 'all') query = query.eq('sucursal_id', suc)
  const { data, error } = await query
  if (error) throw error

  // Aggregate (view already grouped by method+day, merge across days)
  const grouped: Record<string, { cantidad: number; total: number }> = {}
  data?.forEach((r: any) => {
    const k = r.metodo_pago || 'Sin método'
    if (!grouped[k]) grouped[k] = { cantidad: 0, total: 0 }
    grouped[k].cantidad += r.cantidad || 0
    grouped[k].total    += parseFloat(r.total) || 0
  })
  const totalMXN = Object.values(grouped).reduce((a, g) => a + g.total, 0)
  const rows = Object.entries(grouped).map(([nombre, g]) => ({
    nombre, cantidad: g.cantidad, total: parseFloat(g.total.toFixed(2)),
    porcentaje: pct(g.total, totalMXN)
  }))
  return { rows: applySort(rows, sort), totals: buildTotals(rows) }
}

// ─── 4.16.1 Tratamientos por unidades ────────────────────────

async function q_tratamientos_unidades(desglose: string, sort: string, fi: string, ff: string, suc: string): Promise<ReportResult> {
  return q_facturacion_tratamiento(desglose, sort === 'cantidad_desc' ? 'cantidad_desc' : sort, fi, ff, suc)
}

// ─── 4.17.1 Facturación por hora ─────────────────────────────

async function q_facturacion_por_hora(sort: string, fi: string, ff: string, suc: string): Promise<ReportResult> {
  let query = supabase
    .from('tickets')
    .select('total, hora')
    .gte('fecha', fi).lte('fecha', ff)
    .eq('estado', 'Pagado')
  if (suc !== 'all') query = query.eq('sucursal_id', suc)
  const { data, error } = await query
  if (error) throw error

  const keyFn = (t: any) => {
    const h = parseInt(t.hora.substring(0, 2), 10)
    return `${String(h).padStart(2, '0')}:00 – ${String(h + 1).padStart(2, '0')}:00`
  }

  const rows = groupAndPct(data, keyFn, (t: any) => ({ cantidad: 1, total: t.total }))
  const totalMXN = rows.reduce((a, r) => a + (r.total ?? 0), 0)
  rows.forEach(r => { r.porcentaje = pct(r.total ?? 0, totalMXN) })
  return { rows: applySort(rows, sort), totals: buildTotals(rows) }
}

// ─── 4.18 Ingresos por servicios ─────────────────────────────

async function q_ingresos_servicios(desglose: string, sort: string, fi: string, ff: string, suc: string): Promise<ReportResult> {
  return q_facturacion_tratamiento(desglose, sort, fi, ff, suc)
}

// ─── 5.1 Métricas de Inventario (Ingreso vs Costo) ─────────────

async function q_inventory_metrics(fi: string, ff: string, suc: string): Promise<ReportResult> {
  let query = supabase
    .from('ticket_items')
    .select('total, cantidad, referencia_id, ticket:tickets!inner(fecha, estado, sucursal_id)')
    .eq('tipo', 'Producto')
    .eq('ticket.estado', 'Pagado')
    .gte('ticket.fecha', fi).lte('ticket.fecha', ff)

  if (suc !== 'all') query = query.eq('ticket.sucursal_id', suc)
  
  const { data, error } = await query
  if (error) throw error

  // Get product cost prices
  const productIds = Array.from(new Set(data?.map(i => i.referencia_id)))
  const { data: products } = await supabase
    .from('productos')
    .select('id, precio_costo')
    .in('id', productIds)
  
  const costMap: Record<string, number> = {}
  products?.forEach(p => { costMap[p.id] = p.precio_costo || 0 })

  let totalIngreso = 0
  let totalCosto = 0
  
  data?.forEach(i => {
    totalIngreso += i.total || 0
    totalCosto += (i.cantidad || 0) * (costMap[i.referencia_id] || 0)
  })

  return { 
    rows: [], 
    totals: { 
      ingreso: totalIngreso, 
      costo: totalCosto 
    } 
  }
}

// ─── 5.2 Métricas de Sueldos (Suma diaria base) ────────────────

async function q_salary_metrics(): Promise<ReportResult> {
  const { data, error } = await supabase
    .from('perfiles_empleadas')
    .select('sueldo_diario')
    .eq('activo', true)
  
  if (error) throw error

  const totalDiario = (data || []).reduce((sum, emp) => sum + (emp.sueldo_diario || 0), 0)

  return { 
    rows: [], 
    totals: { 
      total_diario: totalDiario 
    } 
  }
}

// ─── 5.3 Diferencia de Cajas (Arqueo) ─────────────────────────

async function q_cash_metrics(fi: string, ff: string, suc: string): Promise<ReportResult> {
  let query = supabase
    .from('turnos_caja')
    .select('diferencia_efectivo')
    .eq('estado', 'Cerrada')
    .gte('fecha_cierre', fi)
    .lte('fecha_cierre', ff)
  
  if (suc !== 'all') query = query.eq('sucursal_id', suc)

  const { data, error } = await query
  if (error) throw error

  const totalDiferencia = (data || []).reduce((sum, t) => sum + (t.diferencia_efectivo || 0), 0)

  return { 
    rows: [], 
    totals: { 
      total: totalDiferencia 
    } 
  }
}
// ─── A.1 Ticket Promedio por Sucursal ────────────────────────

async function q_ticket_promedio(fi: string, ff: string, suc: string): Promise<ReportResult> {
  let query = supabase
    .from('tickets')
    .select('total, sucursal_id, sucursal:sucursales(nombre)')
    .eq('estado', 'Pagado')
    .gte('fecha', fi).lte('fecha', ff)
  if (suc !== 'all') query = query.eq('sucursal_id', suc)
  const { data, error } = await query
  if (error) throw error

  const groups: Record<string, { total: number; count: number }> = {}
  data?.forEach((t: any) => {
    const key = (t.sucursal as any)?.nombre || 'Sin sucursal'
    if (!groups[key]) groups[key] = { total: 0, count: 0 }
    groups[key].total += t.total || 0
    groups[key].count++
  })

  const globalTotal = data?.reduce((s, t: any) => s + (t.total || 0), 0) || 0
  const globalCount = data?.length || 0

  const rows: ReportRow[] = Object.entries(groups).map(([nombre, g]) => ({
    nombre,
    total: g.count > 0 ? parseFloat((g.total / g.count).toFixed(2)) : 0,
    cantidad: g.count,
  }))

  return { 
    rows: applySort(rows, 'total_desc'), 
    totals: { 
      total: globalCount > 0 ? parseFloat((globalTotal / globalCount).toFixed(2)) : 0,
      cantidad: globalCount
    } 
  }
}

// ─── A.2 Retención de Clientes (30 días) ─────────────────────

async function q_retention_rate(fi: string, ff: string): Promise<ReportResult> {
  // Clients that visited in the period
  const { data: periodVisits, error: e1 } = await supabase
    .from('citas')
    .select('cliente_id, fecha')
    .gte('fecha', fi).lte('fecha', ff)
    .eq('estado', 'Finalizada')
  if (e1) throw e1

  if (!periodVisits || periodVisits.length === 0) {
    return { rows: [], totals: { tasa: 0, nuevos: 0, recurrentes: 0 } }
  }

  const uniqueClients = Array.from(new Set(periodVisits.map(v => v.cliente_id).filter(Boolean)))

  // Check which of those clients had a prior visit in the 30 days before fi
  const prior30 = new Date(fi)
  prior30.setDate(prior30.getDate() - 30)
  const prior30Str = prior30.toISOString().split('T')[0]

  const BATCH = 100
  const returningSet = new Set<string>()
  for (let i = 0; i < uniqueClients.length; i += BATCH) {
    const batch = uniqueClients.slice(i, i + BATCH)
    const { data: prior } = await supabase
      .from('citas')
      .select('cliente_id')
      .in('cliente_id', batch)
      .gte('fecha', prior30Str)
      .lt('fecha', fi)
      .eq('estado', 'Finalizada')
    prior?.forEach(p => returningSet.add(p.cliente_id))
  }

  const recurrentes = returningSet.size
  const nuevos = uniqueClients.length - recurrentes
  const tasa = uniqueClients.length > 0 ? parseFloat(((recurrentes / uniqueClients.length) * 100).toFixed(1)) : 0

  return {
    rows: [
      { nombre: 'Recurrentes', cantidad: recurrentes, porcentaje: tasa },
      { nombre: 'Nuevos', cantidad: nuevos, porcentaje: parseFloat((100 - tasa).toFixed(1)) }
    ],
    totals: { tasa, nuevos, recurrentes, total_clientes: uniqueClients.length }
  }
}

// ─── A.3 Ingresos por Sucursal (Stacked) ── usa vistas materializadas ────────
async function q_ingresos_sucursal_stacked(fi: string, ff: string): Promise<ReportResult> {
  // 3 queries simples en paralelo (sin JOINs, las vistas ya los resolvieron)
  const [
    { data: tickets, error: te },
    { data: asist,   error: ae },
    { data: ventas,  error: ve },
    { data: config },
  ] = await Promise.all([
    supabase.from('mv_tickets_diarios')
      .select('total, sucursal_id, sucursal_nombre')
      .gte('fecha', fi).lte('fecha', ff),
    supabase.from('mv_asistencias_diarias')
      .select('sucursal_id, empleada_id, sueldo_diario')
      .gte('fecha', fi).lte('fecha', ff),
    supabase.from('mv_ventas_empleado_diarias')
      .select('vendedor_id, sucursal_id, sucursal_nombre, total_ventas')
      .gte('fecha', fi).lte('fecha', ff),
    supabase.from('config_comisiones').select('*').order('umbral', { ascending: true }),
  ])
  if (te) throw te; if (ae) throw ae; if (ve) throw ve

  const [anioStr, mesStr] = fi.split('-')
  const { data: evals } = await supabase.from('evaluaciones_hoja')
    .select('empleada_id, cumplio_hoja')
    .eq('mes', parseInt(mesStr, 10)).eq('anio', parseInt(anioStr, 10))

  const tablaComisiones = (config as CommissionThreshold[]) || []
  const evalMap: Record<string, boolean> = {}
  evals?.forEach(ev => { evalMap[ev.empleada_id] = ev.cumplio_hoja })

  const branches: Record<string, { total: number; sueldos: number; comisiones: number }> = {}

  // Income — ya viene con sucursal_nombre resuelto
  tickets?.forEach((t: any) => {
    const k = t.sucursal_nombre || 'Desconocida'
    if (!branches[k]) branches[k] = { total: 0, sueldos: 0, comisiones: 0 }
    branches[k].total += parseFloat(t.total) || 0
  })

  // Salaries — view already deduplicates one row per employee per day
  asist?.forEach((a: any) => {
    const k = (tickets as any[])?.find(t => t.sucursal_id === a.sucursal_id)?.sucursal_nombre || 'Desconocida'
    if (!branches[k]) branches[k] = { total: 0, sueldos: 0, comisiones: 0 }
    branches[k].sueldos += parseFloat(a.sueldo_diario) || 0
  })

  // Commissions — aggregate sales per employee per branch, then calc %
  const salesByEmpBranch: Record<string, Record<string, number>> = {}
  ventas?.forEach((v: any) => {
    const bid = v.sucursal_id
    const eid = v.vendedor_id
    if (!eid) return
    if (!salesByEmpBranch[bid]) salesByEmpBranch[bid] = {}
    salesByEmpBranch[bid][eid] = (salesByEmpBranch[bid][eid] || 0) + (parseFloat(v.total_ventas) || 0)
  })

  // Build branchName lookup from tickets
  const branchNames: Record<string, string> = {}
  tickets?.forEach((t: any) => { if (t.sucursal_id) branchNames[t.sucursal_id] = t.sucursal_nombre || 'Desconocida' })

  Object.entries(salesByEmpBranch).forEach(([bid, empSales]) => {
    const k = branchNames[bid] || 'Desconocida'
    if (!branches[k]) branches[k] = { total: 0, sueldos: 0, comisiones: 0 }
    Object.entries(empSales).forEach(([eid, totalConIva]) => {
      const cumplioHoja = evalMap[eid] ?? false
      const porcentaje = calcularPorcentaje(totalConIva, cumplioHoja, tablaComisiones)
      branches[k].comisiones += (totalConIva / 1.16 * porcentaje) / 100
    })
  })

  const rows = Object.entries(branches).map(([nombre, v]) => ({
    nombre,
    total:      parseFloat(v.total.toFixed(2)),
    sueldos:    parseFloat(v.sueldos.toFixed(2)),
    comisiones: parseFloat(v.comisiones.toFixed(2)),
    otros:      parseFloat((v.total - v.sueldos - v.comisiones).toFixed(2))
  })).sort((a, b) => b.total - a.total)

  return { rows, totals: buildTotals(rows) }
}

// ─── A.4 Mix de Servicios ─────────────────────────────────────

async function q_service_mix(fi: string, ff: string, suc: string): Promise<ReportResult> {
  let query = supabase
    .from('ticket_items')
    .select('nombre, total, ticket:tickets!inner(fecha, estado, sucursal_id)')
    .eq('tipo', 'Servicio')
    .eq('ticket.estado', 'Pagado')
    .gte('ticket.fecha', fi).lte('ticket.fecha', ff)
  if (suc !== 'all') query = query.eq('ticket.sucursal_id', suc)
  const { data, error } = await query
  if (error) throw error

  const { data: servicios } = await supabase.from('servicios').select('nombre, familia')
  const familiaMap: Record<string, string> = {}
  servicios?.forEach(s => { familiaMap[s.nombre] = s.familia || 'Otros' })

  const groups: Record<string, number> = {}
  data?.forEach((i: any) => {
    const familia = familiaMap[i.nombre] || 'Otros'
    groups[familia] = (groups[familia] || 0) + (i.total || 0)
  })

  const total = Object.values(groups).reduce((s, v) => s + v, 0)
  const rows: ReportRow[] = Object.entries(groups).map(([nombre, val]) => ({
    nombre,
    total: parseFloat(val.toFixed(2)),
    cantidad: parseFloat(val.toFixed(2)),
    porcentaje: total > 0 ? parseFloat(((val / total) * 100).toFixed(1)) : 0
  })).sort((a, b) => (b.total || 0) - (a.total || 0))

  return { rows, totals: buildTotals(rows) }
}

// ─── A.5 Tendencia Citas Agendadas vs Asistidas ───────────────

async function q_citas_tendencia(fi: string, ff: string, suc: string): Promise<ReportResult> {
  let query = supabase
    .from('citas')
    .select('fecha, estado, sucursal_id')
    .gte('fecha', fi).lte('fecha', ff)
  if (suc !== 'all') query = query.eq('sucursal_id', suc)
  const { data, error } = await query
  if (error) throw error

  const groups: Record<string, { agendadas: number; asistidas: number }> = {}
  data?.forEach((c: any) => {
    const key = c.fecha
    if (!groups[key]) groups[key] = { agendadas: 0, asistidas: 0 }
    groups[key].agendadas++
    if (c.estado === 'Finalizada') groups[key].asistidas++
  })

  const rows = Object.entries(groups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([fecha, g]) => ({
      nombre: fecha.substring(5), // MM-DD
      cantidad: g.agendadas,      // line 1
      total: g.asistidas,         // line 2
    }))

  return { rows, totals: buildTotals(rows) }
}

// ─── A.6 Heatmap Afluencia (hora × día semana) ────────────────

async function q_heatmap_afluencia(fi: string, ff: string, suc: string): Promise<ReportResult> {
  let query = supabase
    .from('citas')
    .select('fecha, bloque_inicio, sucursal_id')
    .gte('fecha', fi).lte('fecha', ff)
    .in('estado', ['Programada', 'En curso', 'Finalizada'])
  if (suc !== 'all') query = query.eq('sucursal_id', suc)
  const { data, error } = await query
  if (error) throw error

  const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  const grid: Record<string, Record<string, number>> = {}
  
  data?.forEach((c: any) => {
    const d = new Date(c.fecha + 'T12:00:00')
    const dayName = DAYS[d.getDay()]
    const hour = c.bloque_inicio ? parseInt(c.bloque_inicio.substring(0, 2), 10) : 10
    const hourKey = `${String(hour).padStart(2, '0')}:00`
    if (!grid[hourKey]) grid[hourKey] = {}
    grid[hourKey][dayName] = (grid[hourKey][dayName] || 0) + 1
  })

  // Flatten to rows with day columns
  const rows = Object.entries(grid)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([hour, days]) => ({
      nombre: hour,
      ...days
    })) as any[]

  return { rows, totals: {} }
}

// ─── A.7 Stock Semáforo ───────────────────────────────────────

async function q_stock_semaforo(): Promise<ReportResult> {
  const { data, error } = await supabase
    .from('productos')
    .select('id, nombre, stock')
    .eq('activo', true)
    .order('stock', { ascending: true })
  if (error) throw error

  const rows: ReportRow[] = (data || []).map(p => ({
    nombre: p.nombre,
    cantidad: p.stock,
    // porcentaje encodes the semaforo level: 0=red, 1=yellow, 2=green
    porcentaje: p.stock <= 3 ? 0 : p.stock <= 9 ? 1 : 2,
    total: undefined
  }))

  return { rows, totals: {} }
}
// ─── A.8 Top 10 Empleados ──── usa vistas materializadas ─────────
async function q_top_empleados(fi: string, ff: string, suc: string): Promise<ReportResult> {
  let ticketsQ = supabase.from('mv_tickets_diarios')
    .select('total, vendedor_id, vendedor_nombre').gte('fecha', fi).lte('fecha', ff)
  if (suc !== 'all') ticketsQ = ticketsQ.eq('sucursal_id', suc)

  let asistQ = supabase.from('mv_asistencias_diarias')
    .select('empleada_id, sueldo_diario').gte('fecha', fi).lte('fecha', ff)
  if (suc !== 'all') asistQ = asistQ.eq('sucursal_id', suc)

  let ventasQ = supabase.from('mv_ventas_empleado_diarias')
    .select('vendedor_id, vendedor_nombre, total_ventas').gte('fecha', fi).lte('fecha', ff)
  if (suc !== 'all') ventasQ = ventasQ.eq('sucursal_id', suc)

  const [
    { data: tickets, error: te },
    { data: asist,   error: ae },
    { data: ventas,  error: ve },
    { data: config },
  ] = await Promise.all([
    ticketsQ, asistQ, ventasQ,
    supabase.from('config_comisiones').select('*').order('umbral', { ascending: true }),
  ])
  if (te) throw te; if (ae) throw ae; if (ve) throw ve

  const [anioStr, mesStr] = fi.split('-')
  const { data: evals } = await supabase.from('evaluaciones_hoja')
    .select('empleada_id, cumplio_hoja')
    .eq('mes', parseInt(mesStr, 10)).eq('anio', parseInt(anioStr, 10))

  const tablaComisiones = (config as CommissionThreshold[]) || []
  const evalMap: Record<string, boolean> = {}
  evals?.forEach(ev => { evalMap[ev.empleada_id] = ev.cumplio_hoja })

  const employees: Record<string, { total: number; sueldos: number; comisiones: number }> = {}

  // Income (nombre ya resuelto en la vista)
  tickets?.forEach((t: any) => {
    const k = t.vendedor_nombre || 'Sin profesional'
    if (!employees[k]) employees[k] = { total: 0, sueldos: 0, comisiones: 0 }
    employees[k].total += parseFloat(t.total) || 0
  })

  // Salaries (view already deduplicates: 1 row per employee per day)
  // Build empId→name map from tickets
  const empNames: Record<string, string> = {}
  tickets?.forEach((t: any) => { if (t.vendedor_id) empNames[t.vendedor_id] = t.vendedor_nombre || 'Sin profesional' })
  asist?.forEach((a: any) => {
    const k = empNames[a.empleada_id] || 'Sin profesional'
    if (!employees[k]) employees[k] = { total: 0, sueldos: 0, comisiones: 0 }
    employees[k].sueldos += parseFloat(a.sueldo_diario) || 0
  })

  // Commissions
  const salesByEmp: Record<string, number> = {}
  ventas?.forEach((v: any) => {
    const eid = v.vendedor_id
    if (!eid) return
    salesByEmp[eid] = (salesByEmp[eid] || 0) + (parseFloat(v.total_ventas) || 0)
  })

  // Also get employee names from ventas view
  ventas?.forEach((v: any) => { if (v.vendedor_id && v.vendedor_nombre) empNames[v.vendedor_id] = v.vendedor_nombre })

  Object.entries(salesByEmp).forEach(([eid, totalConIva]) => {
    const k = empNames[eid] || 'Sin profesional'
    if (!employees[k]) employees[k] = { total: 0, sueldos: 0, comisiones: 0 }
    const cumplioHoja = evalMap[eid] ?? false
    const porcentaje = calcularPorcentaje(totalConIva, cumplioHoja, tablaComisiones)
    employees[k].comisiones += (totalConIva / 1.16 * porcentaje) / 100
  })

  const rows = Object.entries(employees).map(([nombre, v]) => ({
    nombre,
    total:      parseFloat(v.total.toFixed(2)),
    sueldos:    parseFloat(v.sueldos.toFixed(2)),
    comisiones: parseFloat(v.comisiones.toFixed(2)),
    otros:      parseFloat((v.total - v.sueldos - v.comisiones).toFixed(2))
  })).sort((a, b) => b.total - a.total).slice(0, 10)

  return { rows, totals: buildTotals(rows) }
}

// ─── A.9 Tendencia Servicios por Familia ──── usa mv_servicios_familia_diarios
async function q_servicios_familia_tendencia(fi: string, ff: string, suc: string): Promise<ReportResult> {
  let query = supabase
    .from('mv_servicios_familia_diarios')
    .select('fecha, familia, cantidad')
    .gte('fecha', fi).lte('fecha', ff)
  if (suc !== 'all') query = query.eq('sucursal_id', suc)
  const { data, error } = await query
  if (error) throw error

  // Pivot: { fecha → { familia: count } }
  const timeGroups: Record<string, Record<string, number>> = {}
  data?.forEach((r: any) => {
    const date = r.fecha as string
    if (!timeGroups[date]) timeGroups[date] = {}
    timeGroups[date][r.familia] = (timeGroups[date][r.familia] || 0) + (r.cantidad || 0)
  })

  const rows = Object.entries(timeGroups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([fecha, families]) => ({ nombre: fecha.substring(5), ...families }))

  return { rows, totals: {} }
}
