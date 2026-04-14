import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Cliente } from '../types/database'

// ─── Search clientes ──────────────────────────────────────────
export function useClientes(query: string) {
  return useQuery<Cliente[]>({
    queryKey: ['clientes', query],
    queryFn: async () => {
      if (!query.trim()) return []
      const isNumeric = /^\d+$/.test(query.trim())
      let supaQuery = supabase.from('clientes').select('*, sucursal:sucursales(nombre)').limit(10)
      if (isNumeric) {
        supaQuery = supaQuery.eq('num_cliente', parseInt(query))
      } else {
        supaQuery = supaQuery.or(
          `nombre_completo.ilike.%${query}%,telefono_cel.ilike.%${query}%`
        )
      }
      const { data, error } = await supaQuery
      if (error) throw error
      return data ?? []
    },
    enabled: query.trim().length >= 2,
  })
}

// ─── Create cliente ───────────────────────────────────────────
export function useCrearCliente() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (
      cliente: Omit<Cliente, 'id' | 'num_cliente' | 'created_at'>
    ) => {
      const { data, error } = await supabase
        .from('clientes')
        .insert(cliente)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clientes'] })
    },
  })
}
