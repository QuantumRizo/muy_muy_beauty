import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Cita, BloqueoAgenda } from '../types/database'
import { timeToSlots } from '../utils/agenda'

// ─── Weekly citas (for agenda) ────────────────────────────────
export function useCitasSemana(inicioSemana: string, finSemana: string, sucursalId: string) {
  return useQuery<Cita[]>({
    queryKey: ['citas', inicioSemana, finSemana, sucursalId],
    queryFn: async () => {
      let query = supabase
        .from('citas')
        .select(`
          *,
          cliente:clientes(*),
          empleada:perfiles_empleadas(*),
          sucursal:sucursales(*),
          cita_servicios(servicio_id, servicios(*))
        `)
        .gte('fecha', inicioSemana)
        .lte('fecha', finSemana)

      if (sucursalId !== 'todas') {
        query = query.eq('sucursal_id', sucursalId)
      }

      const { data, error } = await query
      if (error) throw error
      return (data ?? []).map((c: any) => ({
        ...c,
        servicios: c.cita_servicios?.map((cs: any) => cs.servicios) ?? [],
      }))
    },
    enabled: !!inicioSemana && !!finSemana && !!sucursalId,
  })
}

// ─── Weekly bloqueos ──────────────────────────────────────────
export function useBloqueosSemana(inicioSemana: string, finSemana: string) {
  return useQuery<BloqueoAgenda[]>({
    queryKey: ['bloqueos', inicioSemana, finSemana],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bloqueos_agenda')
        .select('*')
        .gte('fecha', inicioSemana)
        .lte('fecha', finSemana)
      if (error) throw error
      return data ?? []
    },
    enabled: !!inicioSemana && !!finSemana,
  })
}

// ─── Create cita ──────────────────────────────────────────────
export function useCrearCita() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      cita,
      servicioIds,
    }: {
      cita: Omit<Cita, 'id' | 'created_at' | 'cliente' | 'empleada' | 'servicios'>
      servicioIds: string[]
    }) => {
      const { data, error } = await supabase.from('citas').insert(cita).select().single()
      if (error) throw error
      if (servicioIds.length) {
        const { error: e2 } = await supabase
          .from('cita_servicios')
          .insert(servicioIds.map((sid) => ({ cita_id: data.id, servicio_id: sid })))
        if (e2) throw e2
      }

      // Auto-assign sucursal de origen al cliente si aún no tiene una
      if (cita.cliente_id && cita.sucursal_id) {
        const { data: cliente } = await supabase
          .from('clientes')
          .select('sucursal_id')
          .eq('id', cita.cliente_id)
          .single()
        
        if (cliente && !cliente.sucursal_id) {
          await supabase
            .from('clientes')
            .update({ sucursal_id: cita.sucursal_id })
            .eq('id', cita.cliente_id)
        }
      }

      return data
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['citas'] }) },
  })
}


// ─── Update cita ──────────────────────────────────────────────
export function useActualizarCita() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, updates, servicioIds }: { id: string; updates: Partial<Cita>; servicioIds?: string[] }) => {
      const { data, error } = await supabase
        .from('citas').update(updates).eq('id', id).select().single()
      if (error) throw error

      if (servicioIds) {
        // Sync services
        await supabase.from('cita_servicios').delete().eq('cita_id', id)
        if (servicioIds.length) {
          const { error: e2 } = await supabase
            .from('cita_servicios')
            .insert(servicioIds.map((sid) => ({ cita_id: id, servicio_id: sid })))
          if (e2) throw e2
        }
      }
      return data
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['citas'] }) },
  })
}

// ─── Delete cita ──────────────────────────────────────────────
export function useEliminarCita() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('citas').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['citas'] }) },
  })
}

// ─── Create Multiple Bloqueos ─────────────────────────────────
export function useCrearBloqueos() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (bloqueos: Omit<BloqueoAgenda, 'id'>[]) => {
      const { data, error } = await supabase.from('bloqueos_agenda').insert(bloqueos).select()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bloqueos'] })
    },
  })
}

// ─── Delete Bloqueo ───────────────────────────────────────────
export function useEliminarBloqueo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('bloqueos_agenda').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bloqueos'] })
    },
  })
}

// ─── Delete Multiple Bloqueos ─────────────────────────────────
export function useEliminarBloqueosMasivo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      fechaInicio,
      fechaFin,
      empleadasIds
    }: {
      fechaInicio: string
      fechaFin: string
      empleadasIds: string[]
    }) => {
      if (!empleadasIds.length) return

      const { error } = await supabase
        .from('bloqueos_agenda')
        .delete()
        .gte('fecha', fechaInicio)
        .lte('fecha', fechaFin)
        .in('empleada_id', empleadasIds)

      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bloqueos'] })
    },
  })
}

// ─── Client history ───────────────────────────────────────────
export function useCitasCliente(clienteId: string) {
  return useQuery<Cita[]>({
    queryKey: ['citas', 'cliente', clienteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('citas')
        .select(`
          *,
          empleada:perfiles_empleadas(*),
          cita_servicios(servicio_id, servicios(*))
        `)
        .eq('cliente_id', clienteId)
        .order('fecha', { ascending: false })
        .limit(10)

      if (error) throw error
      return (data ?? []).map((c: any) => ({
        ...c,
        servicios: c.cita_servicios?.map((cs: any) => cs.servicios) ?? [],
      }))
    },
    enabled: !!clienteId,
  })
}


// ─── Check Disponibilidad ─────────────────────────────────────
export function useCheckDisponibilidad(fecha: string, empleadaId: string, excludeCitaId?: string) {
  return useQuery({
    queryKey: ['citas', 'check', fecha, empleadaId, excludeCitaId],
    queryFn: async () => {
      if (!fecha || !empleadaId) return []
      let query = supabase
        .from('citas')
        .select('id, bloque_inicio, duracion_manual_slots, cita_servicios(servicios(duracion_slots))')
        .eq('fecha', fecha)
        .eq('empleada_id', empleadaId)
        .neq('estado', 'Cancelada')
      
      if (excludeCitaId) {
        query = query.neq('id', excludeCitaId)
      }

      const { data, error } = await query
      
      if (error) throw error
      
      return (data || []).map((c: any) => {
        const start = timeToSlots(c.bloque_inicio)
        const duration = c.duracion_manual_slots ?? (c.cita_servicios?.reduce((acc: number, item: any) => acc + (item.servicios?.duracion_slots || 0), 0) || 4)
        return { start, end: start + duration }
      })
    },
    enabled: !!fecha && !!empleadaId
  })
}
