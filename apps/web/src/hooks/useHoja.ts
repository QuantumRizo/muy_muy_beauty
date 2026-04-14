import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { calcularPorcentaje, getTramoStr } from '../lib/commissions'

export interface EvaluacionHoja {
  id?: string
  empleada_id: string
  sucursal_id: string
  mes: number
  anio: number
  cumplio_hoja: boolean
  notas?: string
}

export interface ResultadoComision {
  empleada_id: string
  nombre: string
  totalConIva: number      // ventas brutas del mes (con IVA), para encontrar tramo
  totalSinIva: number      // base para calcular la comisión
  cumplioHoja: boolean
  porcentaje: number       // % aplicado (0 si no llega al mínimo)
  comision: number         // totalSinIva * porcentaje / 100
  tramoStr: string         // texto legible del tramo, ej. "$36,000"
}

export function useEvaluacionesHoja(mes: number, anio: number) {
  return useQuery({
    queryKey: ['evaluaciones_hoja', mes, anio],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('evaluaciones_hoja')
        .select('*')
        .eq('mes', mes)
        .eq('anio', anio)
      if (error) throw error
      return data
    }
  })
}

/** Hook que calcula comisiones reales del mes cruzando ticket_items + evaluaciones_hoja */
export function useComisionesHoja(mes: number, anio: number) {
  return useQuery<ResultadoComision[]>({
    queryKey: ['comisiones_hoja', mes, anio],
    queryFn: async () => {
      // 1. Rango de fechas del mes
      const mesStr = String(mes).padStart(2, '0')
      const fechaInicio = `${anio}-${mesStr}-01`
      // Último día del mes
      const ultimoDia = new Date(anio, mes, 0).getDate()
      const fechaFin = `${anio}-${mesStr}-${ultimoDia}`

      // 2. Traer ticket_items del mes con tickets pagados
      const { data: items, error: itemsErr } = await supabase
        .from('ticket_items')
        .select(`
          vendedor_id,
          vendedor_nombre,
          total,
          iva_porcentaje,
          ticket:tickets!inner(fecha, estado)
        `)
        .eq('ticket.estado', 'Pagado')
        .gte('ticket.fecha', fechaInicio)
        .lte('ticket.fecha', fechaFin)

      if (itemsErr) throw itemsErr

      // 3. Traer evaluaciones_hoja del mes (sin filtro de sucursal — es global)
      const { data: evals, error: evalsErr } = await supabase
        .from('evaluaciones_hoja')
        .select('empleada_id, cumplio_hoja')
        .eq('mes', mes)
        .eq('anio', anio)

      if (evalsErr) throw evalsErr

      // 4. Traer nombres de empleadas
      const { data: emps, error: empsErr } = await supabase
        .from('perfiles_empleadas')
        .select('id, nombre')
        .eq('activo', true)

      if (empsErr) throw empsErr

      // 5. Agrupar items por vendedor_id
      const acum: Record<string, { totalConIva: number; nombre: string }> = {}

      ;(items as any[]).forEach(item => {
        const vid = item.vendedor_id
        if (!vid) return
        const totalItem = Number(item.total) || 0
        if (!acum[vid]) {
          acum[vid] = { totalConIva: 0, nombre: item.vendedor_nombre || 'Sin nombre' }
        }
        acum[vid].totalConIva += totalItem
      })

      // Completar nombres desde perfiles_empleadas
      emps?.forEach((e: any) => {
        if (acum[e.id]) acum[e.id].nombre = e.nombre
      })

      // Mapa de evaluaciones
      const evalMap: Record<string, boolean> = {}
      ;(evals as any[]).forEach(ev => {
        // Si hay múltiples registros (por sucursal), si alguno dice true, es true
        if (ev.cumplio_hoja) evalMap[ev.empleada_id] = true
        else if (!(ev.empleada_id in evalMap)) evalMap[ev.empleada_id] = false
      })

      // 6. Calcular comisiones
      const resultados: ResultadoComision[] = Object.entries(acum).map(([empId, datos]) => {
        const cumplioHoja = evalMap[empId] ?? false
        const totalConIva = datos.totalConIva
        // Quitar IVA (16%): base imponible = totalConIva / 1.16
        const totalSinIva = totalConIva / 1.16
        const porcentaje = calcularPorcentaje(totalConIva, cumplioHoja)
        const comision = (totalSinIva * porcentaje) / 100

        // Tramo legible
        let tramoStr = getTramoStr(totalConIva)

        return {
          empleada_id: empId,
          nombre: datos.nombre,
          totalConIva,
          totalSinIva,
          cumplioHoja,
          porcentaje,
          comision,
          tramoStr,
        }
      })

      // Ordenar por comisión descendente
      return resultados.sort((a, b) => b.comision - a.comision)
    }
  })
}

export function useGuardarEvaluacion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (ev: EvaluacionHoja) => {
      const { data, error } = await supabase
        .from('evaluaciones_hoja')
        .upsert({
          empleada_id: ev.empleada_id,
          sucursal_id: ev.sucursal_id,
          mes:         ev.mes,
          anio:        ev.anio,
          cumplio_hoja: ev.cumplio_hoja,
          notas:       ev.notas ?? null,
          evaluado_en: new Date().toISOString()
        }, { onConflict: 'empleada_id,mes,anio' })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['evaluaciones_hoja', vars.sucursal_id, vars.mes, vars.anio] })
      qc.invalidateQueries({ queryKey: ['comisiones_hoja'] })
    }
  })
}
