import { supabase } from '../supabase'
import { applySort } from '../reportConfig'
import type { ReportResult, ReportRow } from './core'
import { groupAndPct, pct, buildTotals } from './core'

export async function q_duracion_media(sort: string): Promise<ReportResult> {
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

export async function q_sesiones_asistidas(desglose: string, sort: string, fi: string, ff: string, suc: string): Promise<ReportResult> {
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

export async function q_sesiones_profesional_tratamiento(sort: string, fi: string, ff: string, suc: string): Promise<ReportResult> {
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

export async function q_no_asistidas_pct(desglose: string, sort: string, fi: string, ff: string, suc: string): Promise<ReportResult> {
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

export async function q_desglose_no_asistidas(desglose: string, sort: string, fi: string, ff: string, suc: string): Promise<ReportResult> {
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

  const rows = groupAndPct(data || [], keyFn, () => ({ cantidad: 1 }))
  const totalCant = rows.reduce((a, r) => a + (r.cantidad ?? 0), 0)
  rows.forEach(r => { r.porcentaje = pct(r.cantidad ?? 0, totalCant); r.total = undefined })
  return { rows: applySort(rows, sort), totals: buildTotals(rows) }
}

export async function q_citas_agenda(desglose: string, sort: string, fi: string, ff: string, suc: string): Promise<ReportResult> {
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

  const rows = groupAndPct(data || [], keyFn, () => ({ cantidad: 1 }))
  const totalCant = rows.reduce((a, r) => a + (r.cantidad ?? 0), 0)
  rows.forEach(r => { r.porcentaje = pct(r.cantidad ?? 0, totalCant); r.total = undefined })
  return { rows: applySort(rows, sort), totals: buildTotals(rows) }
}

export async function q_citas_tendencia(fi: string, ff: string, suc: string): Promise<ReportResult> {
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

export async function q_heatmap_afluencia(fi: string, ff: string, suc: string): Promise<ReportResult> {
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
