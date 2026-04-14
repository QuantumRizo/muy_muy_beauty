import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Ticket, TicketItem, Pago } from '../types/database'
import { format } from 'date-fns'

/** Obtiene el siguiente folio, con reintentos en caso de colisión de clave duplicada */
async function getFolioConRetry(sucursalId: string, maxIntentos = 3): Promise<string> {
  for (let intento = 0; intento < maxIntentos; intento++) {
    if (intento > 0) {
      // Espera breve para evitar colisión concurrente
      await new Promise(r => setTimeout(r, 60 * intento))
    }
    const { data, error } = await supabase
      .rpc('siguiente_folio_ticket', { p_sucursal_id: sucursalId })
    if (error) throw error
    return `T-${String(data as number).padStart(5, '0')}`
  }
  throw new Error('No se pudo generar un folio único')
}

/** Inserta el ticket manejando colisiones de num_ticket con reintento automático */
async function insertTicketConRetry(
  ticket: any, fechaActual: string, horaActual: string, maxIntentos = 3
) {
  for (let intento = 0; intento < maxIntentos; intento++) {
    if (intento > 0) await new Promise(r => setTimeout(r, 80 * intento))
    const numTicket = await getFolioConRetry(ticket.sucursal_id)
    const { data, error } = await supabase
      .from('tickets')
      .insert({ ...ticket, num_ticket: numTicket, fecha: fechaActual, hora: horaActual })
      .select()
      .single()
    if (!error) return data
    // Si es colisión de clave, reintentamos; cualquier otro error lo lanzamos
    if ((error as any).code !== '23505') throw error
    console.warn(`Colisión de folio (intento ${intento + 1}), reintentando...`)
  }
  throw new Error('No se pudo guardar el ticket tras múltiples intentos')
}

export function useCrearTicket() {
  const qc = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ 
      ticket, 
      items, 
      pagos,
      citaId 
    }: { 
      ticket: Omit<Ticket, 'id' | 'created_at' | 'cliente' | 'sucursal' | 'vendedor' | 'items' | 'pagos' | 'hora'>, 
      items: Omit<TicketItem, 'id' | 'ticket_id'>[], 
      pagos: Omit<Pago, 'id' | 'ticket_id' | 'fecha' | 'hora'>[],
      citaId: string
    }) => {
      
      const now = new Date()
      const fechaActual = format(now, 'yyyy-MM-dd')
      const horaActual = format(now, 'HH:mm:ss')

      // 1. Crear el ticket (con retry en colisiones de folio)
      const tData = await insertTicketConRetry(
        {
          ...ticket,
          vendedor_id: ticket.vendedor_id ?? null,
          estado: ticket.estado
        },
        fechaActual,
        horaActual
      )

      // 3. Crear los items del ticket con el ID del ticket recién creado
      if (items.length > 0) {
        const { error: iError } = await supabase
          .from('ticket_items')
          .insert(items.map(item => ({ ...item, ticket_id: tData.id })))
        
        if (iError) throw iError

        // 3.5 Descontar stock de inventario para cada producto
        for (const item of items) {
          if (item.tipo === 'Producto') {
             const { error: rpcError } = await supabase.rpc('decrementar_stock_producto', {
               p_id: item.referencia_id,
               p_cantidad: item.cantidad
             });
             if (rpcError) console.error('Error descontando stock:', rpcError);
          }
        }
      }

      // 4. Crear los pagos
      if (pagos.length > 0) {
        const { error: pError } = await supabase
          .from('pagos')
          .insert(pagos.map(p => ({ 
            ...p, 
            ticket_id: tData.id,
            fecha: fechaActual,
            hora: horaActual
          })))
        
        if (pError) throw pError
      }

      // 5. Vincular el ticket a la cita y marcarla como Finalizada
      const { error: cError } = await supabase
        .from('citas')
        .update({ ticket_id: tData.id, estado: 'Finalizada' })
        .eq('id', citaId)
      
      if (cError) throw cError

      return tData
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['citas'] })
      qc.invalidateQueries({ queryKey: ['tickets'] })
    }
  })
}

// ─── Ticket para venta directa (sin cita) ─────────────────────
export function useCrearTicketDirecto() {
  const qc = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ 
      ticket, 
      items, 
      pagos,
    }: { 
      ticket: Omit<Ticket, 'id' | 'created_at' | 'cliente' | 'sucursal' | 'vendedor' | 'items' | 'pagos' | 'hora'>, 
      items: Omit<TicketItem, 'id' | 'ticket_id'>[], 
      pagos: Omit<Pago, 'id' | 'ticket_id' | 'fecha' | 'hora'>[],
    }) => {
      
      const now = new Date()
      const fechaActual = format(now, 'yyyy-MM-dd')
      const horaActual = format(now, 'HH:mm:ss')

      // Crear el ticket (con retry en colisiones de folio)
      const tData = await insertTicketConRetry(ticket, fechaActual, horaActual)

      // Crear items
      if (items.length > 0) {
        const { error: iError } = await supabase
          .from('ticket_items')
          .insert(items.map(item => ({ ...item, ticket_id: tData.id })))
        
        if (iError) throw iError

        // Descontar stock
        for (const item of items) {
          if (item.tipo === 'Producto') {
             const { error: rpcError } = await supabase.rpc('decrementar_stock_producto', {
               p_id: item.referencia_id,
               p_cantidad: item.cantidad
             });
             if (rpcError) console.error('Error descontando stock:', rpcError);
          }
        }
      }

      // Crear pagos
      if (pagos.length > 0) {
        const { error: pError } = await supabase
          .from('pagos')
          .insert(pagos.map(p => ({ 
            ...p, 
            ticket_id: tData.id,
            fecha: fechaActual,
            hora: horaActual
          })))
        
        if (pError) throw pError
      }

      return tData
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tickets'] })
    }
  })
}
