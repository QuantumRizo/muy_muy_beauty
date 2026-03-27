// ─── Database Types ────────────────────────────────────────────

export type SexoType = 'Mujer' | 'Hombre' | 'Otro'
export type CitaStatus = 'Programada' | 'En curso' | 'Finalizada' | 'Cancelada' | 'No asistió'
export type TicketStatus = 'Pendiente' | 'Pagado' | 'Anulado'
export type ItemTipo = 'Servicio' | 'Producto'
export type MetodoPago = 'Efectivo' | 'Tarjeta' | 'Transferencia' | 'Puntos' | 'Bono' | 'Anticipo' | 'Aplazado' | 'Otros'


export interface Sucursal {
  id: string
  nombre: string
}

export interface Empleada {
  id: string
  nombre: string
  nombre_corto?: string // Deprecated
  activo: boolean
}


export interface DatosExtra {
  rfc?: string
  procedencia?: string
  sexo?: SexoType
  fecha_nacimiento?: string
  pais?: string
  notas?: string
}

export interface Cliente {
  id: string
  num_cliente: number
  nombre_completo: string
  telefono_cel: string | null
  email: string | null
  sucursal_id: string | null  // Sucursal de origen/captación
  datos_extra: DatosExtra
  created_at: string
  // Joined fields
  sucursal?: Sucursal
}


export interface Servicio {
  id: string
  nombre: string
  duracion_slots: number
  precio: number
  familia: string | null
  activo: boolean
}

export interface Producto {
  id: string
  nombre: string
  descripcion: string | null
  precio: number
  stock: number
  sku: string | null
  activo: boolean
  created_at: string
}

export interface Documento {
  id: string
  nombre: string
  descripcion: string | null
  archivo_url: string
  peso_bytes: number | null
  tipo_mime: string | null
  created_at: string
}


export interface Cita {
  id: string
  cliente_id: string
  empleada_id: string | null
  sucursal_id: string
  fecha: string
  bloque_inicio: string
  estado: CitaStatus
  duracion_manual_slots: number | null
  comentarios: string | null
  ticket_id: string | null
  created_at: string

  // Rescheduling info
  reagendada_por?: string | null
  reagendada_fecha?: string | null

  // Joined fields
  cliente?: Cliente
  empleada?: Empleada
  sucursal?: Sucursal
  servicios?: Servicio[]
}

export interface CitaServicio {
  id: string
  cita_id: string
  servicio_id: string
}

export interface BloqueoAgenda {
  id: string
  empleada_id: string
  fecha: string
  hora_inicio: string
  hora_fin: string
  motivo: string
}

export interface Ticket {
  id: string
  sucursal_id: string
  cliente_id: string | null
  vendedor_id: string | null
  num_ticket: string
  fecha: string
  base_imponible: number
  iva: number
  total: number
  descuento: number
  propina: number
  estado: TicketStatus
  created_at: string
  // Joined fields
  cliente?: Cliente
  sucursal?: Sucursal
  vendedor?: Empleada
  items?: TicketItem[]
  pagos?: Pago[]
}

export interface TicketItem {
  id: string
  ticket_id: string
  tipo: ItemTipo
  referencia_id: string
  nombre: string
  cantidad: number
  precio_unitario: number
  iva_porcentaje: number
  descuento: number
  total: number
}

export interface Pago {
  id: string
  ticket_id: string
  metodo_pago: MetodoPago
  importe: number
  detalles: any
  fecha: string
}


// ─── UI / App Types ────────────────────────────────────────────

export interface SlotInfo {
  empleadaId: string
  hora: string // "09:00", "09:15", etc.
  fecha: string
}

// ─── Stub for Supabase typed client ───────────────────────────
export interface Database {
  public: {
    Tables: {
      sucursales: { Row: Sucursal; Insert: Omit<Sucursal, 'id'>; Update: Partial<Sucursal> }
      perfiles_empleadas: { Row: Empleada; Insert: Omit<Empleada, 'id'>; Update: Partial<Empleada> }
      clientes: { Row: Cliente; Insert: Omit<Cliente, 'id' | 'num_cliente' | 'created_at' | 'sucursal'>; Update: Partial<Cliente> }

      servicios: { Row: Servicio; Insert: Omit<Servicio, 'id'>; Update: Partial<Servicio> }
      citas: { Row: Cita; Insert: Omit<Cita, 'id' | 'created_at' | 'cliente' | 'empleada' | 'sucursal' | 'servicios'>; Update: Partial<Cita> }
      cita_servicios: { Row: CitaServicio; Insert: Omit<CitaServicio, 'id'>; Update: Partial<CitaServicio> }
      bloqueos_agenda: { Row: BloqueoAgenda; Insert: Omit<BloqueoAgenda, 'id'>; Update: Partial<BloqueoAgenda> }
      productos: { Row: Producto; Insert: Omit<Producto, 'id' | 'created_at'>; Update: Partial<Producto> }
      tickets: { Row: Ticket; Insert: Omit<Ticket, 'id' | 'created_at' | 'cliente' | 'sucursal' | 'vendedor' | 'items' | 'pagos'>; Update: Partial<Ticket> }
      ticket_items: { Row: TicketItem; Insert: Omit<TicketItem, 'id'>; Update: Partial<TicketItem> }
      pagos: { Row: Pago; Insert: Omit<Pago, 'id' | 'fecha'>; Update: Partial<Pago> }
    }
  }
}

