import { useQuery, useQueryClient } from '@tanstack/react-query'
import { runQuery } from '../lib/reportQueries'
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import { ahoraMX, fechaMX, hoyMX } from '../lib/dateUtils'
import type { ReportRow } from '../lib/reportQueries'

export type TimeRange = 'today' | 'week' | 'month'

// ─── Tipo de datos del Dashboard ─────────────────────────────────
export interface DashboardData {
  revenue: number
  appointments: number
  newClients: number
  attendanceRate: number
  inventoryMetrics: Record<string, number>
  salaryExpense: number
  cashDifference: number
  ticketPromedio: number
  ocupacion: number
  retentionRate: number
  nuevosVsRecurrentes: { nuevos: number; recurrentes: number }
  ingresosSucursal: ReportRow[]
  topEmpleados: ReportRow[]
  serviciosTendencia: ReportRow[]
  pagosPreferidos: ReportRow[]
}

export function invalidateDashboardCache(queryClient: any) {
  queryClient.invalidateQueries({ queryKey: ['dashboard'] })
}

// ─────────────────────────────────────────────────────────────────

async function loadDashboardData(sucursalId: string, range: TimeRange): Promise<DashboardData> {
  const now = ahoraMX()
  let sFi: string, sFf: string

  if (range === 'today') {
    sFi = hoyMX(); sFf = hoyMX()
  } else if (range === 'week') {
    sFi = fechaMX(startOfWeek(now, { weekStartsOn: 1 })); sFf = fechaMX(endOfWeek(now, { weekStartsOn: 1 }))
  } else {
    sFi = fechaMX(startOfMonth(now)); sFf = fechaMX(endOfMonth(now))
  }

  const [
    revenue, appointments, newClients, attendance,
    inventoryMetrics, salaryBase, cashDifference,
    ticketPromedio, retentionData,
    ingresosSucursal,
    topEmpleados, serviciosTendencia, pagosPreferidos
  ] = await Promise.all([
    runQuery('4.1.1', 'total', 'total_desc', sFi, sFf, sucursalId),
    runQuery('3.7',   'total', 'cantidad_desc', sFi, sFf, sucursalId),
    runQuery('1.1.1', 'total', 'cantidad_desc', sFi, sFf, sucursalId),
    runQuery('3.1',   'sucursal', 'porcentaje_desc', sFi, sFf, sucursalId),
    runQuery('5.1',   'total', 'total_desc', sFi, sFf, sucursalId),
    runQuery('5.2',   'total', 'total_desc', sFi, sFf, sucursalId),
    runQuery('5.3',   'total', 'total_desc', sFi, sFf, sucursalId),
    runQuery('A.1',   'total', 'total_desc', sFi, sFf, sucursalId),
    runQuery('A.2',   'total', 'total_desc', sFi, sFf, sucursalId),
    runQuery('A.3',   'total', 'total_desc', sFi, sFf, ''),
    runQuery('A.8',   'total', 'total_desc', sFi, sFf, sucursalId),
    runQuery('A.9',   'total', 'total_desc', sFi, sFf, sucursalId),
    runQuery('4.12.1', 'total', 'total_desc', sFi, sFf, sucursalId),
  ])

  const totalCitas = attendance.rows.reduce((s: number, r: any) => s + (r.total_citas ?? 0), 0)
  const totalNoAsistidas = attendance.rows.reduce((s: number, r: any) => s + (r.no_asistidas ?? 0), 0)
  const globalAbsencePct = totalCitas > 0 ? (totalNoAsistidas / totalCitas) * 100 : 0
  const finalizadas = totalCitas - totalNoAsistidas
  const ocupacion = totalCitas > 0 ? parseFloat(((finalizadas / totalCitas) * 100).toFixed(1)) : 0
  const days = range === 'today' ? 1 : range === 'week' ? 7 : 30

  return {
    revenue: revenue.totals.total || 0,
    appointments: appointments.totals.cantidad || 0,
    newClients: newClients.totals.cantidad || 0,
    attendanceRate: 100 - globalAbsencePct,
    inventoryMetrics: inventoryMetrics.totals,
    salaryExpense: (salaryBase.totals.total_diario || 0) * days,
    cashDifference: cashDifference.totals.total || 0,
    ticketPromedio: ticketPromedio.totals.total || 0,
    ocupacion,
    retentionRate: retentionData.totals.tasa || 0,
    nuevosVsRecurrentes: {
      nuevos: retentionData.totals.nuevos || 0,
      recurrentes: retentionData.totals.recurrentes || 0,
    },
    ingresosSucursal: ingresosSucursal.rows,
    topEmpleados: topEmpleados.rows,
    serviciosTendencia: serviciosTendencia.rows,
    pagosPreferidos: pagosPreferidos.rows,
  }
}

// ─────────────────────────────────────────────────────────────────

export function useDashboardData(sucursalId: string, range: TimeRange) {
  const queryClient = useQueryClient()

  const { data, isLoading, isError, error, isFetching, refetch } = useQuery<DashboardData>({
    queryKey: ['dashboard', sucursalId, range],
    queryFn: () => loadDashboardData(sucursalId, range),
    staleTime: 3 * 60 * 1000, // 3 minutes stale time to match previous TTL behavior
    refetchOnWindowFocus: false, // Prevent excessive refetching
  })

  return { 
    data: data ?? null, 
    loading: isLoading, 
    error: isError ? (error as any).message : null, 
    isRefreshing: isFetching, 
    refresh: () => {
      invalidateDashboardCache(queryClient)
      refetch()
    } 
  }
}
