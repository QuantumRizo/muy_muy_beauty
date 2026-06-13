import { supabase } from '../supabase'
import { applySort } from '../reportConfig'
import { calcularPorcentaje, type CommissionThreshold } from '../commissions'
import { fechaMX } from '../dateUtils'
import type { ReportResult, ReportRow } from './core'
import { groupAndPct, pct, buildTotals } from './core'

export async function q_facturacion_neta(desglose: string, sort: string, fi: string, ff: string, suc: string): Promise<ReportResult> {
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
    const { data: servicios } = await supabase.from('servicios').select('nombre, categoria:categorias_servicio(nombre)')
    const familiaMap: Record<string, string> = {}
    servicios?.forEach(s => { familiaMap[s.nombre] = (s.categoria as any)?.nombre || 'Otros' })
    
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
    diasPorEmpleada[empId].add(fechaMX(new Date(a.created_at)))
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

export async function q_facturacion(desglose: string, sort: string, fi: string, ff: string, suc: string, includeAll: boolean): Promise<ReportResult> {
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

export async function q_facturacion_tratamiento(desglose: string, sort: string, fi: string, ff: string, suc: string): Promise<ReportResult> {
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

export async function q_facturacion_profesional(desglose: string, sort: string, fi: string, ff: string, suc: string): Promise<ReportResult> {
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

export async function q_facturacion_familia(desglose: string, sort: string, fi: string, ff: string, suc: string): Promise<ReportResult> {
  let query = supabase
    .from('ticket_items')
    .select('nombre, total, tipo, ticket:tickets!inner(fecha, estado, sucursal_id, sucursal:sucursales(nombre))')
    .eq('ticket.estado', 'Pagado')
    .gte('ticket.fecha', fi).lte('ticket.fecha', ff)

  if (suc !== 'all') query = query.eq('ticket.sucursal_id', suc)

  const { data, error } = await query
  if (error) throw error

  // We need to join with servicios to get familia. Build a fast lookup.
  const { data: servicios } = await supabase.from('servicios').select('nombre, categoria:categorias_servicio(nombre)')
  const familiaByNombre: Record<string, string> = {}
  servicios?.forEach(s => { familiaByNombre[s.nombre] = (s.categoria as any)?.nombre || 'Sin familia' })

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

export async function q_facturacion_vendedor(desglose: string, sort: string, fi: string, ff: string, suc: string): Promise<ReportResult> {
  return q_facturacion_profesional(desglose, sort, fi, ff, suc)
}

// ─── 4.9.1 Facturación por producto ──────────────────────────

export async function q_facturacion_producto(desglose: string, sort: string, fi: string, ff: string, suc: string): Promise<ReportResult> {
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

export async function q_facturacion_estimada(desglose: string, sort: string, fi: string, ff: string, suc: string): Promise<ReportResult> {
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

export async function q_por_forma_pago(sort: string, fi: string, ff: string, suc: string): Promise<ReportResult> {
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

export async function q_tratamientos_unidades(desglose: string, sort: string, fi: string, ff: string, suc: string): Promise<ReportResult> {
  return q_facturacion_tratamiento(desglose, sort === 'cantidad_desc' ? 'cantidad_desc' : sort, fi, ff, suc)
}

// ─── 4.17.1 Facturación por hora ─────────────────────────────

export async function q_facturacion_por_hora(sort: string, fi: string, ff: string, suc: string): Promise<ReportResult> {
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

export async function q_ingresos_servicios(desglose: string, sort: string, fi: string, ff: string, suc: string): Promise<ReportResult> {
  return q_facturacion_tratamiento(desglose, sort, fi, ff, suc)
}

// ─── 5.1 Métricas de Inventario (Ingreso vs Costo) ─────────────

export async function q_ticket_promedio(fi: string, ff: string, suc: string): Promise<ReportResult> {
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

export async function q_ingresos_sucursal_stacked(fi: string, ff: string): Promise<ReportResult> {
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

export async function q_service_mix(fi: string, ff: string, suc: string): Promise<ReportResult> {
  let query = supabase
    .from('ticket_items')
    .select('nombre, total, ticket:tickets!inner(fecha, estado, sucursal_id)')
    .eq('tipo', 'Servicio')
    .eq('ticket.estado', 'Pagado')
    .gte('ticket.fecha', fi).lte('ticket.fecha', ff)
  if (suc !== 'all') query = query.eq('ticket.sucursal_id', suc)
  const { data, error } = await query
  if (error) throw error

  const { data: servicios } = await supabase.from('servicios').select('nombre, categoria:categorias_servicio(nombre)')
  const familiaMap: Record<string, string> = {}
  servicios?.forEach(s => { familiaMap[s.nombre] = (s.categoria as any)?.nombre || 'Otros' })

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

export async function q_top_empleados(fi: string, ff: string, suc: string): Promise<ReportResult> {
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

export async function q_servicios_familia_tendencia(fi: string, ff: string, suc: string): Promise<ReportResult> {
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
