import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Sucursal } from '../types/database'

export function useSucursales() {
  return useQuery<Sucursal[]>({
    queryKey: ['sucursales'],
    queryFn: async () => {
      const { data, error } = await supabase.from('sucursales').select('*').order('nombre')
      if (error) throw error
      return data ?? []
    },
    staleTime: Infinity,
  })
}
