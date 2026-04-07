import { supabase } from './supabase'
export async function downloadComisionesCSV(fechaInicio: string, fechaFin: string, sucursalId: string) {
  // 1. Fetch tickets and their items
  let query = supabase
    .from('ticket_items')
    .select(`
      nombre, 
      cantidad, 
      vendedor_nombre,
      ticket:tickets!inner(fecha, estado, sucursal_id)
    `)
    .eq('ticket.estado', 'Pagado')
    .gte('ticket.fecha', fechaInicio)
    .lte('ticket.fecha', fechaFin)

  if (sucursalId !== 'all') {
    query = query.eq('ticket.sucursal_id', sucursalId)
  }

  const { data, error } = await query
  if (error) throw error

  // 2. Fetch servicios to get "familia" mappings
  const { data: serviciosData } = await supabase.from('servicios').select('nombre, familia')
  const familiaMap: Record<string, string> = {}
  serviciosData?.forEach(s => {
    familiaMap[s.nombre] = s.familia || '(Sin familia)'
  })

  // 3. Process data into Pivot matrix
  // rows: record of Tratamiento -> { familia, [vendedor_nombre]: cantidad }
  const rows: Record<string, any> = {}
  const vendedores = new Set<string>()

  data.forEach((item: any) => {
    const trat = item.nombre
    const vend = item.vendedor_nombre || 'Sin Asignar'
    const fam = familiaMap[trat] || '(Sin familia)'
    const cant = item.cantidad || 1

    vendedores.add(vend)

    if (!rows[trat]) {
      rows[trat] = { familia: fam, tratamiento: trat }
    }
    rows[trat][vend] = (rows[trat][vend] || 0) + cant
  })

  const vendedorasArray = Array.from(vendedores).sort()
  const rowsArray = Object.values(rows)

  // Sort rows first by familia, then by tratamiento
  rowsArray.sort((a, b) => {
    if (a.familia === b.familia) {
      return a.tratamiento.localeCompare(b.tratamiento)
    }
    return a.familia.localeCompare(b.familia)
  })

  // 4. Build CSV
  const headers = ['Familia', 'Tratamiento', ...vendedorasArray]
  
  let csvRows = rowsArray.map(r => {
    const rowT = [r.familia, r.tratamiento]
    vendedorasArray.forEach(v => {
      rowT.push((r[v] || 0).toString())
    })
    return rowT.map(c => `"${c.replace(/"/g, '""')}"`).join(',')
  })

  // Prepend headers
  const csvContent = [
    headers.map(h => `"${h}"`).join(','),
    ...csvRows
  ].join('\n')

  downloadBlob(csvContent, `Comisiones_${fechaInicio}_al_${fechaFin}.csv`)
}


export async function downloadResumenVentasCSV(fechaInicio: string, fechaFin: string, sucursalesIds: string[]) {
  // Fetch tickets
  const { data, error } = await supabase
    .from('tickets')
    .select(`
      total,
      fecha,
      estado,
      sucursal_id,
      sucursal:sucursales(nombre)
    `)
    .gte('fecha', fechaInicio)
    .lte('fecha', fechaFin)
  if (error) throw error

  // Calculate new clients in this period
  // To keep it simple, we just count the distinct tickets that belong to new clients (created in this period)
  // or we can fetch clients directly. Let's fetch clients created in this location
  const { data: clientesData } = await supabase
    .from('clientes')
    .select('id, sucursal_id')
    .gte('created_at', new Date(fechaInicio).toISOString())
    .lte('created_at', new Date(fechaFin + 'T23:59:59.999Z').toISOString())

  const newClientsBySucursal: Record<string, number> = {}
  clientesData?.forEach((c: any) => {
    const sId = c.sucursal_id || 'unassigned'
    newClientsBySucursal[sId] = (newClientsBySucursal[sId] || 0) + 1
  })

  // Aggregate by Sucursal
  const stats: Record<string, { nombre: string, ventas: number, tickets: number, n_clientes: number }> = {}

  data.forEach((t: any) => {
    if (t.estado !== 'Pagado') return
    const sId = t.sucursal_id || 'unassigned'
    const sName = t.sucursal?.nombre || 'Sin sucursal'
    
    if (!stats[sId]) {
      stats[sId] = { nombre: sName, ventas: 0, tickets: 0, n_clientes: newClientsBySucursal[sId] || 0 }
    }
    stats[sId].ventas += Number(t.total)
    stats[sId].tickets += 1
  })

  const rows = Object.entries(stats)
    .filter(([sId]) => sucursalesIds.includes(sId))
    .map(([_, r]) => r)
  // Re-filter if sucursalesIds length > 0
  
  const headers = ['Centro', 'Ventas ($)', 'No. de Tickets', 'Ticket Medio ($)', 'Clientes Nuevos']
  const csvRows = rows.map(r => {
    const ticketMedio = r.tickets > 0 ? (r.ventas / r.tickets).toFixed(2) : '0.00'
    const line = [
      r.nombre,
      r.ventas.toFixed(2),
      r.tickets.toString(),
      ticketMedio,
      r.n_clientes.toString()
    ]
    return line.map(c => `"${c.replace(/"/g, '""')}"`).join(',')
  })

  const csvContent = [
    headers.map(h => `"${h}"`).join(','),
    ...csvRows
  ].join('\n')

  downloadBlob(csvContent, `Resumen_Ventas_${fechaInicio}_al_${fechaFin}.csv`)
}


function downloadBlob(csvContent: string, fileName: string) {
  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', fileName)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
