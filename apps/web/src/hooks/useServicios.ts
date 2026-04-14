import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Servicio } from '../types/database'

export function useServicios() {
  return useQuery<Servicio[]>({
    queryKey: ['servicios'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('servicios')
        .select('*')
        .eq('activo', true)
        .order('familia')
        .order('nombre')
      if (error) throw error
      return data ?? []
    },
    staleTime: 1000 * 60 * 10,
  })
}
