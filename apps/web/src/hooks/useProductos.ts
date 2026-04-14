import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Producto } from '../types/database'

export function useProductos(searchQuery: string = '') {
  return useQuery({
    queryKey: ['productos', searchQuery],
    queryFn: async () => {
      // Usamos .select() explícito y ordenamos alfabéticamente
      let q = supabase
        .from('productos')
        .select('*')
        .order('nombre', { ascending: true })

      if (searchQuery.length >= 2) {
        q = q.or(`nombre.ilike.%${searchQuery}%,sku.ilike.%${searchQuery}%`)
      }

      const { data, error } = await q
      if (error) throw error
      return data as Producto[]
    },
  })
}
