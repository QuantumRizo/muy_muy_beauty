import { supabase } from './supabase'
import { applySort } from './reportConfig'

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

async function q_clientes_nuevos(desglose: string, sort: string, fi: string, ff: string, suc: string): Promise<ReportResult> {
  let query = supabase
    .from('clientes')
    .select('id, created_at, sucursal_id, sucursal:sucursales(nombre)')
    .gte('created_at', `${fi}T00:00:00`)
    .lte('created_at', `${ff}T23:59:59`)
  
  if (suc !== 'all') query = query.eq('sucursal_id', suc)
  
  const { data, error } = await query
  if (error) throw error

  const keyFn = (c: any) => {
    if (desglose === 'sucursal') return c.sucursal?.nombre || 'Sin sucursal'
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
  const { data, error } = await supabase
    .from('citas')
    .select('id, cliente_id, fecha, sucursal_id, sucursal:sucursales(nombre), empleada:perfiles_empleadas(nombre)')
    .gte('fecha', fi).lte('fecha', `${ff}T23:59:59`)
    .neq('estado', 'Cancelada')
    .neq('estado', 'No asistió')

  if (error) throw error

  // Keep only first session per client
  const seen = new Set<string>()
  const firsts = (data || []).filter(c => {
    if (seen.has(c.cliente_id)) return false
    seen.add(c.cliente_id)
    return true
  })

  if (suc !== 'all') {
    firsts.filter((c: any) => c.sucursal_id === suc)
  }

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
    .gte('fecha', fi).lte('fecha', `${ff}T23:59:59`)
    .eq('estado', 'Pagado')
    .order('fecha', { ascending: true })

  if (suc !== 'all') query = query.eq('sucursal_id', suc)
  const { data, error } = await query
  if (error) throw error

  const seen = new Set<string>()
  const firsts = (data || []).filter(t => {
    if (!t.cliente_id || seen.has(t.cliente_id)) return false
    seen.add(t.cliente_id)
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
    .gte('created_at', `${fi}T00:00:00`)
    .lte('created_at', `${ff}T23:59:59`)
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
    .select('cliente_id, sucursal_id, fecha, cita_servicios(servicio_id, servicios(nombre))')
    .gte('fecha', fi).lte('fecha', `${ff}T23:59:59`)
    .neq('estado', 'Cancelada')
  if (suc !== 'all') query = query.eq('sucursal_id', suc)
  const { data, error } = await query
  if (error) throw error

  // Flatten to servicio entries
  const flat: any[] = []
  data?.forEach((c: any) => {
    c.cita_servicios?.forEach((cs: any) => {
      flat.push({ cliente_id: c.cliente_id, servicio: cs.servicios?.nombre || 'Sin nombre', mes: c.fecha.substring(0, 7) })
    })
  })

  const keyFn = (item: any) => {
    if (desglose === 'sucursal') return item.sucursal || 'N/A'
    if (desglose === 'mes') return item.mes
    return item.servicio
  }

  const rows = groupAndPct(flat, keyFn, () => ({ cantidad: 1 }))
  const totalCant = rows.reduce((a, r) => a + (r.cantidad ?? 0), 0)
  rows.forEach(r => { r.porcentaje = pct(r.cantidad ?? 0, totalCant); r.total = undefined })
  return { rows: applySort(rows, sort), totals: buildTotals(rows) }
}

// ─── 2.4 Media tratamientos por cliente ──────────────────────

async function q_media_tratamientos(desglose: string, sort: string, fi: string, ff: string, suc: string): Promise<ReportResult> {
  let query = supabase
    .from('citas')
    .select('cliente_id, sucursal_id, fecha, sucursal:sucursales(nombre), cita_servicios(id)')
    .gte('fecha', fi).lte('fecha', `${ff}T23:59:59`).neq('estado', 'Cancelada')
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
    .gte('fecha', fi).lte('fecha', `${ff}T23:59:59`)
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
    .gte('fecha', fi).lte('fecha', `${ff}T23:59:59`)
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
    .gte('fecha', fi).lte('fecha', `${ff}T23:59:59`)
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
    .gte('fecha', fi).lte('fecha', `${ff}T23:59:59`)
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
    .gte('fecha', fi).lte('fecha', `${ff}T23:59:59`)
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

// ─── 4.1.1 / 4.1.2 Facturación / Ventas ─────────────────────

async function q_facturacion(desglose: string, sort: string, fi: string, ff: string, suc: string, includeAll: boolean): Promise<ReportResult> {
  let query = supabase
    .from('tickets')
    .select('total, fecha, sucursal_id, vendedor_id, sucursal:sucursales(nombre), vendedor:perfiles_empleadas(nombre)')
    .gte('fecha', fi).lte('fecha', `${ff}T23:59:59`)
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
    .gte('fecha', fi).lte('fecha', `${ff}T23:59:59`).eq('estado', 'Pagado')
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
    .gte('fecha', fi).lte('fecha', `${ff}T23:59:59`)
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

async function q_por_forma_pago(sort: string, fi: string, ff: string, suc: string): Promise<ReportResult> {
  let query = supabase
    .from('pagos')
    .select('metodo_pago, importe, ticket:tickets!inner(fecha, sucursal_id, estado)')
    .eq('ticket.estado', 'Pagado')
    .gte('ticket.fecha', fi).lte('ticket.fecha', ff)
  if (suc !== 'all') query = query.eq('ticket.sucursal_id', suc)
  const { data, error } = await query
  if (error) throw error

  const keyFn = (p: any) => p.metodo_pago || 'Sin método'
  const rows = groupAndPct(data, keyFn, (p: any) => ({ cantidad: 1, total: p.importe }))
  const totalMXN = rows.reduce((a, r) => a + (r.total ?? 0), 0)
  rows.forEach(r => { r.porcentaje = pct(r.total ?? 0, totalMXN) })
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
    .select('total, created_at')
    .gte('fecha', fi).lte('fecha', `${ff}T23:59:59`)
    .eq('estado', 'Pagado')
  if (suc !== 'all') query = query.eq('sucursal_id', suc)
  const { data, error } = await query
  if (error) throw error

  const keyFn = (t: any) => {
    const h = new Date(t.created_at).getHours()
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
