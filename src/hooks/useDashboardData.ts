import { useState, useEffect } from 'react'
import { runQuery } from '../lib/reportQueries'
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } from 'date-fns'

export type TimeRange = 'today' | 'week' | 'month'

export function useDashboardData(sucursalId: string, range: TimeRange) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      setError(null)
      try {
        const now = new Date()
        let fi: Date, ff: Date

        if (range === 'today') {
          fi = startOfDay(now)
          ff = endOfDay(now)
        } else if (range === 'week') {
          fi = startOfWeek(now, { weekStartsOn: 1 })
          ff = endOfWeek(now, { weekStartsOn: 1 })
        } else {
          fi = startOfMonth(now)
          ff = endOfMonth(now)
        }

        const sFi = format(fi, 'yyyy-MM-dd')
        const sFf = format(ff, 'yyyy-MM-dd')

        // Fetch all metrics in parallel
        const [
          revenue, appointments, newClients, attendance,
          inventoryMetrics, salaryBase, cashDifference,
          ticketPromedio, retentionData,
          ingresosSucursal, serviceMix,
          citasTrend, heatmapData, stockSemaforo
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
          runQuery('A.4',   'total', 'total_desc', sFi, sFf, sucursalId),
          runQuery('A.5',   'total', 'total_desc', sFi, sFf, sucursalId),
          runQuery('A.6',   'total', 'total_desc', sFi, sFf, sucursalId),
          runQuery('A.7',   'total', 'total_desc', sFi, sFf, sucursalId),
        ])

        // Attendance rate
        const totalCitas = attendance.rows.reduce((s: number, r: any) => s + (r.total_citas ?? 0), 0)
        const totalNoAsistidas = attendance.rows.reduce((s: number, r: any) => s + (r.no_asistidas ?? 0), 0)
        const globalAbsencePct = totalCitas > 0 ? (totalNoAsistidas / totalCitas) * 100 : 0

        // Occupancy: (attended / total scheduled) × 100
        const finalizadas = totalCitas - totalNoAsistidas
        const ocupacion = totalCitas > 0 ? parseFloat(((finalizadas / totalCitas) * 100).toFixed(1)) : 0

        // Salary scaling
        const days = range === 'today' ? 1 : range === 'week' ? 7 : 30

        setData({
          // Core KPIs
          revenue: revenue.totals.total || 0,
          appointments: appointments.totals.cantidad || 0,
          newClients: newClients.totals.cantidad || 0,
          attendanceRate: 100 - globalAbsencePct,
          // Financial KPIs
          inventoryMetrics: inventoryMetrics.totals,
          salaryExpense: (salaryBase.totals.total_diario || 0) * days,
          cashDifference: cashDifference.totals.total || 0,
          // New business KPIs
          ticketPromedio: ticketPromedio.totals.total || 0,
          ocupacion,
          retentionRate: retentionData.totals.tasa || 0,
          nuevosVsRecurrentes: {
            nuevos: retentionData.totals.nuevos || 0,
            recurrentes: retentionData.totals.recurrentes || 0,
          },
          // Chart data
          ingresosSucursal: ingresosSucursal.rows,
          serviceMix: serviceMix.rows,
          citasTrend: citasTrend.rows,
          heatmapData: heatmapData.rows,
          stockSemaforo: stockSemaforo.rows,
        })
      } catch (err: any) {
        console.error('Error fetching dashboard data:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [sucursalId, range])

  return { data, loading, error }
}
