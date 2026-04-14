import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Empleada } from '../types/database'

// Employees filtered by sucursal (for agenda and most views)
export function useEmpleadas(sucursalId?: string) {
  return useQuery<Empleada[]>({
    queryKey: ['empleadas', sucursalId ?? 'all-active'],
    queryFn: async () => {
      let query = supabase
        .from('perfiles_empleadas')
        .select('*')
        .eq('activo', true)
        .order('nombre')
      if (sucursalId) {
        query = query.eq('sucursal_id', sucursalId)
      }
      const { data, error } = await query
      if (error) throw error
      return data ?? []
    },
  })
}

// All empleadas including inactive (for config / profesionales page)
export function useTodasEmpleadas() {
  return useQuery<Empleada[]>({
    queryKey: ['empleadas', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('perfiles_empleadas')
        .select('*')
        .order('nombre')
      if (error) throw error
      return data ?? []
    },
  })
}
