/**
 * @muymuy/types
 *
 * Tipos TypeScript compartidos entre la web app y la app móvil.
 * Refleja el esquema exacto de la base de datos Supabase.
 *
 * Uso: import type { Cita, Cliente, Ticket } from '@muymuy/types'
 *
 * ⚠️  Este archivo es la fuente de verdad.
 *     Si cambias el esquema en Supabase, actualiza aquí primero.
 */

// ─── Enums ─────────────────────────────────────────────────────
export type SexoType = 'Mujer' | 'Hombre' | 'Otro'
export type CitaStatus = 'Programada' | 'En curso' | 'Finalizada' | 'Cancelada' | 'No asistió'
export type TicketStatus = 'Pendiente' | 'Pagado' | 'Anulado'
export type ItemTipo = 'Servicio' | 'Producto'
export type MetodoPago = 'Efectivo' | 'Tarjeta' | 'Transferencia' | 'Puntos' | 'Bono' | 'Anticipo' | 'Aplazado' | 'Otros'
export type EstadoCaja = 'Abierta' | 'Cerrada'
export type TipoMovimientoCaja = 'Ingreso Extra' | 'Gasto / Salida'
export type MarketingPlatform = 'meta' | 'google'
export type EstadoCampana = 'activa' | 'pausada' | 'finalizada'

// ─── Entidades principales ──────────────────────────────────────
export interface Sucursal {
  id: string
  nombre: string
  direccion: string | null
  telefono: string | null
  rfc: string | null
  num_cabinas: number
}

export interface Empleada {
  id: string
  nombre: string
  nombre_corto?: string
  activo: boolean
  sucursal_id: string | null
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
  sucursal_id: string | null
  datos_extra: DatosExtra
  created_at: string
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
  precio: number
  stock: number
  sku: string | null
  activo: boolean
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
  reagendada_por?: string | null
  reagendada_fecha?: string | null
  cliente?: Cliente
  empleada?: Empleada
  sucursal?: Sucursal
  servicios?: Servicio[]
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
  empleada_abre?: Empleada
  empleada_cierra?: Empleada
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
