import { supabase } from '../supabase'
import type { ReportResult, ReportRow } from './core'

export async function q_inventory_metrics(fi: string, ff: string, suc: string): Promise<ReportResult> {
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

export async function q_salary_metrics(): Promise<ReportResult> {
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

export async function q_cash_metrics(fi: string, ff: string, suc: string): Promise<ReportResult> {
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

export async function q_stock_semaforo(): Promise<ReportResult> {
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
