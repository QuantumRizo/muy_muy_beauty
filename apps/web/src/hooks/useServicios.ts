import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Servicio } from '../types/database'

export function useServicios() {
  return useQuery<Servicio[]>({
    queryKey: ['servicios'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('servicios')
        .select(`
          *,
          categoria:categorias_servicio(nombre)
        `)
        .eq('activo', true)
        .order('nombre')
      if (error) throw error
      return data ?? []
    },
    staleTime: 1000 * 60 * 10,
  })
}
