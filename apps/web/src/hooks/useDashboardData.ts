import { useState, useEffect, useCallback } from 'react'
import { runQuery } from '../lib/reportQueries'
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } from 'date-fns'

export type TimeRange = 'today' | 'week' | 'month'

// ─── Module-level cache (survives re-renders and navigation) ─────
const TTL_MS = 3 * 60 * 1000 // 3 minutes

interface CacheEntry { data: any; timestamp: number }
const cache = new Map<string, CacheEntry>()

export function invalidateDashboardCache() {
  cache.clear()
}

// ─────────────────────────────────────────────────────────────────

async function loadDashboardData(sucursalId: string, range: TimeRange): Promise<any> {
  const now = new Date()
  let fi: Date, ff: Date

  if (range === 'today') {
    fi = startOfDay(now); ff = endOfDay(now)
  } else if (range === 'week') {
    fi = startOfWeek(now, { weekStartsOn: 1 }); ff = endOfWeek(now, { weekStartsOn: 1 })
  } else {
    fi = startOfMonth(now); ff = endOfMonth(now)
  }

  const sFi = format(fi, 'yyyy-MM-dd')
  const sFf = format(ff, 'yyyy-MM-dd')

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
  const cacheKey = `${sucursalId}__${range}`
  const cached = cache.get(cacheKey)

  // Start with cached data (shows instantly if available)
  const [data, setData] = useState<any>(cached?.data ?? null)
  const [loading, setLoading] = useState(!cached)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const refresh = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setIsRefreshing(true)
    setError(null)
    try {
      const result = await loadDashboardData(sucursalId, range)
      cache.set(cacheKey, { data: result, timestamp: Date.now() })
      setData(result)
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err)
      setError(err.message)
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [sucursalId, range, cacheKey])

  useEffect(() => {
    const entry = cache.get(cacheKey)
    const isStale = !entry || (Date.now() - entry.timestamp) > TTL_MS

    if (entry && !isStale) {
      // Cache hit and fresh — show immediately, no network call
      setData(entry.data)
      setLoading(false)
    } else if (entry && isStale) {
      // Stale cache — show old data instantly, refresh in background
      setData(entry.data)
      setLoading(false)
      refresh(true) // silent background refresh
    } else {
      // No cache — full load
      refresh(false)
    }
  }, [cacheKey])

  return { data, loading, error, isRefreshing, refresh: () => refresh(false) }
}
