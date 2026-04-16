// ─── Database Types ────────────────────────────────────────────

export type SexoType = 'Mujer' | 'Hombre' | 'Otro'
export type CitaStatus = 'Programada' | 'En curso' | 'Finalizada' | 'Cancelada' | 'No asistió'
export type TicketStatus = 'Pendiente' | 'Pagado' | 'Anulado'
export type ItemTipo = 'Servicio' | 'Producto'
export type MetodoPago = 'Efectivo' | 'Tarjeta' | 'Transferencia' | 'Puntos' | 'Bono' | 'Anticipo' | 'Aplazado' | 'Otros'
export type EstadoCaja = 'Abierta' | 'Cerrada'
export type TipoMovimientoCaja = 'Ingreso Extra' | 'Gasto / Salida'
export type MarketingPlatform = 'meta' | 'google'
export type EstadoCampana = 'activa' | 'pausada' | 'finalizada'


export interface Sucursal {
  id: string
  nombre: string
  direccion: string | null
  telefono: string | null
  rfc: string | null
  num_cabinas: number   // Cabinas/slots extra configurables por sucursal
}

export interface Empleada {
  id: string
  nombre: string
  nombre_corto?: string // Deprecated
  activo: boolean
  sucursal_id: string | null  // Sucursal a la que pertenece
  fecha_contratacion?: string
  sueldo_diario?: number
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
  precio_costo?: number
  precio: number // Precio de venta
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
  notas_cliente: string | null
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
  hora: string
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
  vendedor_id?: string | null
  vendedor_nombre?: string | null
}

export interface Pago {
  id: string
  ticket_id: string
  metodo_pago: MetodoPago
  importe: number
  detalles: any
  fecha: string
  hora: string
}

export interface TurnoCaja {
  id: string
  sucursal_id: string
  empleada_abre_id: string | null
  empleada_cierra_id: string | null
  estado: EstadoCaja
  fecha_apertura: string
  hora_apertura: string
  fecha_cierre: string | null
  hora_cierre: string | null
  monto_apertura_efectivo: number
  monto_cierre_efectivo_real: number | null
  total_ventas_efectivo: number
  total_ventas_tarjeta: number
  total_ventas_otros: number
  total_gastos: number
  total_ingresos_extra: number
  diferencia_efectivo: number | null
  notas_cierre: string | null
  created_at: string
  // Joins
  empleada_abre?: Empleada
  empleada_cierra?: Empleada
}

export interface MovimientoCaja {
  id: string
  turno_caja_id: string
  empleada_id: string | null
  tipo: TipoMovimientoCaja
  monto: number
  concepto: string
  fecha: string
  hora: string
  // Joins
  empleada?: Empleada
}

export interface MarketingConfig {
  id: string
  sucursal_id: string | null
  platform: MarketingPlatform
  api_key: string
  account_id: string | null
  active: boolean
  created_at: string
  updated_at: string
}

export interface MarketingCampana {
  id: string
  config_id: string | null
  sucursal_id: string | null
  nombre: string
  platform: MarketingPlatform | 'otro'
  estado: EstadoCampana
  fecha_inicio: string | null
  fecha_fin: string | null
  presupuesto: number
  gasto: number
  impresiones: number
  clics: number
  leads: number
  platform_id: string | null
  created_at: string
  updated_at: string
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
      pagos: { Row: Pago; Insert: Omit<Pago, 'id'>; Update: Partial<Pago> }
      turnos_caja: { Row: TurnoCaja; Insert: Omit<TurnoCaja, 'id' | 'created_at' | 'empleada_abre' | 'empleada_cierra'>; Update: Partial<TurnoCaja> }
      movimientos_caja: { Row: MovimientoCaja; Insert: Omit<MovimientoCaja, 'id' | 'empleada'>; Update: Partial<MovimientoCaja> }
      marketing_configs: { Row: MarketingConfig; Insert: Omit<MarketingConfig, 'id' | 'created_at' | 'updated_at'>; Update: Partial<MarketingConfig> }
      marketing_campanas: { Row: MarketingCampana; Insert: Omit<MarketingCampana, 'id' | 'created_at' | 'updated_at'>; Update: Partial<MarketingCampana> }
    }
  }
}

