import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { TurnoCaja, MovimientoCaja, Pago } from '../types/database'

export function useCajaActiva(sucursalId: string) {
  return useQuery({
    queryKey: ['caja_activa', sucursalId],
    queryFn: async () => {
      if (!sucursalId) return null

      // Buscar si hay turno abierto para esta sucursal
      const { data: turno, error: turnoErr } = await supabase
        .from('turnos_caja')
        .select(`
          *,
          empleada_abre:empleada_abre_id(*)
        `)
        .eq('sucursal_id', sucursalId)
        .eq('estado', 'Abierta')
        .order('fecha_apertura', { ascending: false })
        .limit(1)
        .single()

      if (turnoErr && turnoErr.code !== 'PGRST116') throw turnoErr
      if (!turno) return null

      // Si hay turno abierto, traemos los pagos generados desde la hora de apertura
      const { data: pagos, error: pagosErr } = await supabase
        .from('pagos')
        .select(`
          *,
          ticket:tickets!inner(sucursal_id)
        `)
        .eq('ticket.sucursal_id', sucursalId)
        .gte('fecha', turno.fecha_apertura)

      if (pagosErr) throw pagosErr

      // Traer los movimientos extra
      const { data: movimientos, error: movErr } = await supabase
        .from('movimientos_caja')
        .select(`
          *,
          empleada:empleada_id(*)
        `)
        .eq('turno_caja_id', turno.id)

      if (movErr) throw movErr

      // Calcular sumatorias en vivo
      let ventasEfectivo = 0
      let ventasTarjeta = 0
      let ventasOtros = 0
      
      pagos.forEach((p: any) => {
        if (p.metodo_pago === 'Efectivo') ventasEfectivo += p.importe
        else if (p.metodo_pago === 'Tarjeta') ventasTarjeta += p.importe
        else ventasOtros += p.importe
      })

      let ingresosExtra = 0
      let gastos = 0
      movimientos.forEach((m: any) => {
        if (m.tipo === 'Ingreso Extra') ingresosExtra += m.monto
        else if (m.tipo === 'Gasto / Salida') gastos += m.monto
      })

      const fondoInicial = turno.monto_apertura_efectivo
      const efectivoEsperado = fondoInicial + ventasEfectivo + ingresosExtra - gastos

      return {
        turno: turno as TurnoCaja,
        pagos: pagos as Pago[],
        movimientos: movimientos as MovimientoCaja[],
        resumen: {
          ventasEfectivo,
          ventasTarjeta,
          ventasOtros,
          ingresosExtra,
          gastos,
          fondoInicial,
          efectivoEsperado
        }
      }
    },
    enabled: !!sucursalId
  })
}

import { format } from 'date-fns'

export function useAbrirCaja() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ sucursalId, montoEfectivo, empleadaId }: { sucursalId: string, montoEfectivo: number, empleadaId?: string }) => {
      
      const now = new Date()
      const { data, error } = await supabase
        .from('turnos_caja')
        .insert({
          sucursal_id: sucursalId,
          empleada_abre_id: empleadaId || null,
          monto_apertura_efectivo: montoEfectivo,
          fecha_apertura: format(now, 'yyyy-MM-dd'),
          hora_apertura: format(now, 'HH:mm:ss'),
          estado: 'Abierta'
        })
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['caja_activa'] })
  })
}

export function useCerrarCaja() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ turnoId, resumen, montoReal, notas }: { turnoId: string, resumen: any, montoReal: number, notas: string }) => {
      const diferencia = montoReal - resumen.efectivoEsperado
      const now = new Date()

      const { data, error } = await supabase
        .from('turnos_caja')
        .update({
          estado: 'Cerrada',
          fecha_cierre: format(now, 'yyyy-MM-dd'),
          hora_cierre: format(now, 'HH:mm:ss'),
          monto_cierre_efectivo_real: montoReal,
          total_ventas_efectivo: resumen.ventasEfectivo,
          total_ventas_tarjeta: resumen.ventasTarjeta,
          total_ventas_otros: resumen.ventasOtros,
          total_gastos: resumen.gastos,
          total_ingresos_extra: resumen.ingresosExtra,
          diferencia_efectivo: diferencia,
          notas_cierre: notas
        })
        .eq('id', turnoId)
      
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['caja_activa'] })
  })
}

export function useCrearMovimientoCaja() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (movimiento: Omit<MovimientoCaja, 'id' | 'empleada' | 'fecha' | 'hora'>) => {
      const now = new Date()
      const { data, error } = await supabase
        .from('movimientos_caja')
        .insert({
          ...movimiento,
          fecha: format(now, 'yyyy-MM-dd'),
          hora: format(now, 'HH:mm:ss')
        })
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['caja_activa'] })
  })
}
