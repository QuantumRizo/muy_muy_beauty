import { supabase } from '../supabase'
import { applySort } from '../reportConfig'
import type { ReportResult, ReportRow } from './core'
import { groupAndPct, pct, buildTotals, startOfDayIso, endOfDayIso } from './core'

export async function q_clientes_nuevos(desglose: string, sort: string, fi: string, ff: string): Promise<ReportResult> {
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

  const rows = groupAndPct(data || [], keyFn, () => ({ cantidad: 1 }))
  const totalCant = rows.reduce((a, r) => a + (r.cantidad ?? 0), 0)
  rows.forEach(r => { r.porcentaje = pct(r.cantidad ?? 0, totalCant) })

  return { rows: applySort(rows, sort), totals: buildTotals(rows) }
}

export async function q_primeras_sesiones(desglose: string, sort: string, fi: string, ff: string, suc: string): Promise<ReportResult> {
  const { data, error } = await supabase.rpc('get_primeras_sesiones', {
    p_fecha_inicio: fi,
    p_fecha_fin: ff,
    p_sucursal_id: suc === 'all' ? null : suc
  })
  if (error) throw error

  const keyFn = (c: any) => {
    if (desglose === 'sucursal') return c.sucursal_nombre || 'Sin sucursal'
    if (desglose === 'mes') return c.fecha.substring(0, 7)
    if (desglose === 'dia') return c.fecha
    return 'Total'
  }

  const rows = groupAndPct(data || [], keyFn, () => ({ cantidad: 1 }))
  const totalCant = rows.reduce((a, r) => a + (r.cantidad ?? 0), 0)
  rows.forEach(r => { r.porcentaje = pct(r.cantidad ?? 0, totalCant); r.total = undefined })

  return { rows: applySort(rows, sort), totals: buildTotals(rows) }
}

export async function q_primeras_compras(desglose: string, sort: string, fi: string, ff: string, suc: string): Promise<ReportResult> {
  const { data, error } = await supabase.rpc('get_primeras_compras', {
    p_fecha_inicio: fi,
    p_fecha_fin: ff,
    p_sucursal_id: suc === 'all' ? null : suc
  })
  if (error) throw error

  const keyFn = (t: any) => {
    if (desglose === 'sucursal') return t.sucursal_nombre || 'Sin sucursal'
    if (desglose === 'mes') return t.fecha.substring(0, 7)
    if (desglose === 'dia') return t.fecha
    return 'Total'
  }

  const rows = groupAndPct(data || [], keyFn, (t: any) => ({ cantidad: 1, total: t.total }))
  const totalMXN = rows.reduce((a, r) => a + (r.total ?? 0), 0)
  rows.forEach(r => { r.porcentaje = pct(r.total ?? 0, totalMXN) })

  return { rows: applySort(rows, sort), totals: buildTotals(rows) }
}

export async function q_como_conocio(sort: string, fi: string, ff: string): Promise<ReportResult> {
  const { data, error } = await supabase
    .from('clientes')
    .select('datos_extra, created_at')
    .gte('created_at', startOfDayIso(fi))
    .lte('created_at', endOfDayIso(ff))
  if (error) throw error

  const keyFn = (c: any) => c.datos_extra?.procedencia || 'No especificado'
  const rows = groupAndPct(data || [], keyFn, () => ({ cantidad: 1 }))
  const totalCant = rows.reduce((a, r) => a + (r.cantidad ?? 0), 0)
  rows.forEach(r => { r.porcentaje = pct(r.cantidad ?? 0, totalCant); r.total = undefined })

  return { rows: applySort(rows, sort), totals: buildTotals(rows) }
}

export async function q_clientes_por_tratamiento(desglose: string, sort: string, fi: string, ff: string, suc: string): Promise<ReportResult> {
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

export async function q_media_tratamientos(desglose: string, sort: string, fi: string, ff: string, suc: string): Promise<ReportResult> {
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

export async function q_retention_rate(fi: string, ff: string): Promise<ReportResult> {
  // Retención: Clientes que tuvieron al menos 2 citas en el periodo
  const { data, error } = await supabase
    .from('citas')
    .select('cliente_id')
    .gte('fecha', fi).lte('fecha', ff)
    .in('estado', ['Programada', 'En curso', 'Finalizada'])
  if (error) throw error

  const counts: Record<string, number> = {}
  data?.forEach(c => {
    if (c.cliente_id) {
      counts[c.cliente_id] = (counts[c.cliente_id] || 0) + 1
    }
  })

  let totalClients = 0
  let retainedClients = 0
  Object.values(counts).forEach(count => {
    totalClients++
    if (count >= 2) retainedClients++
  })

  const rate = totalClients > 0 ? (retainedClients / totalClients) * 100 : 0
  return {
    rows: [
      { nombre: 'Clientes Totales', cantidad: totalClients },
      { nombre: 'Clientes Recurrentes', cantidad: retainedClients },
      { nombre: 'Tasa de Retención', porcentaje: parseFloat(rate.toFixed(2)) }
    ],
    totals: { cantidad: totalClients }
  }
}
