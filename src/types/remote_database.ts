export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      bloqueos_agenda: {
        Row: {
          empleada_id: string | null
          fecha: string
          hora_fin: string
          hora_inicio: string
          id: string
          motivo: string | null
        }
        Insert: {
          empleada_id?: string | null
          fecha: string
          hora_fin: string
          hora_inicio: string
          id?: string
          motivo?: string | null
        }
        Update: {
          empleada_id?: string | null
          fecha?: string
          hora_fin?: string
          hora_inicio?: string
          id?: string
          motivo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bloqueos_agenda_empleada_id_fkey"
            columns: ["empleada_id"]
            isOneToOne: false
            referencedRelation: "perfiles_empleadas"
            referencedColumns: ["id"]
          },
        ]
      }
      cita_servicios: {
        Row: {
          cita_id: string | null
          id: string
          servicio_id: string | null
        }
        Insert: {
          cita_id?: string | null
          id?: string
          servicio_id?: string | null
        }
        Update: {
          cita_id?: string | null
          id?: string
          servicio_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cita_servicios_cita_id_fkey"
            columns: ["cita_id"]
            isOneToOne: false
            referencedRelation: "citas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cita_servicios_servicio_id_fkey"
            columns: ["servicio_id"]
            isOneToOne: false
            referencedRelation: "servicios"
            referencedColumns: ["id"]
          },
        ]
      }
      citas: {
        Row: {
          bloque_inicio: string
          cliente_id: string | null
          comentarios: string | null
          created_at: string | null
          duracion_manual_slots: number | null
          empleada_id: string | null
          estado: Database["public"]["Enums"]["cita_status"]
          fecha: string
          id: string
          sucursal_id: string | null
          ticket_id: string | null
        }
        Insert: {
          bloque_inicio: string
          cliente_id?: string | null
          comentarios?: string | null
          created_at?: string | null
          duracion_manual_slots?: number | null
          empleada_id?: string | null
          estado?: Database["public"]["Enums"]["cita_status"]
          fecha: string
          id?: string
          sucursal_id?: string | null
          ticket_id?: string | null
        }
        Update: {
          bloque_inicio?: string
          cliente_id?: string | null
          comentarios?: string | null
          created_at?: string | null
          duracion_manual_slots?: number | null
          empleada_id?: string | null
          estado?: Database["public"]["Enums"]["cita_status"]
          fecha?: string
          id?: string
          sucursal_id?: string | null
          ticket_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "citas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "citas_empleada_id_fkey"
            columns: ["empleada_id"]
            isOneToOne: false
            referencedRelation: "perfiles_empleadas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "citas_sucursal_id_fkey"
            columns: ["sucursal_id"]
            isOneToOne: false
            referencedRelation: "sucursales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "citas_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          created_at: string | null
          datos_extra: Json | null
          email: string | null
          id: string
          nombre_completo: string
          num_cliente: number
          sucursal_id: string | null
          telefono_cel: string | null
        }
        Insert: {
          created_at?: string | null
          datos_extra?: Json | null
          email?: string | null
          id?: string
          nombre_completo: string
          num_cliente?: number
          sucursal_id?: string | null
          telefono_cel?: string | null
        }
        Update: {
          created_at?: string | null
          datos_extra?: Json | null
          email?: string | null
          id?: string
          nombre_completo?: string
          num_cliente?: number
          sucursal_id?: string | null
          telefono_cel?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clientes_sucursal_id_fkey"
            columns: ["sucursal_id"]
            isOneToOne: false
            referencedRelation: "sucursales"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos: {
        Row: {
          archivo_url: string
          created_at: string
          descripcion: string | null
          id: string
          nombre: string
          peso_bytes: number | null
          tipo_mime: string | null
        }
        Insert: {
          archivo_url: string
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre: string
          peso_bytes?: number | null
          tipo_mime?: string | null
        }
        Update: {
          archivo_url?: string
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre?: string
          peso_bytes?: number | null
          tipo_mime?: string | null
        }
        Relationships: []
      }
      movimientos_caja: {
        Row: {
          concepto: string
          empleada_id: string | null
          fecha: string | null
          id: string
          monto: number
          tipo: Database["public"]["Enums"]["tipo_movimiento_caja"]
          turno_caja_id: string | null
        }
        Insert: {
          concepto: string
          empleada_id?: string | null
          fecha?: string | null
          id?: string
          monto: number
          tipo: Database["public"]["Enums"]["tipo_movimiento_caja"]
          turno_caja_id?: string | null
        }
        Update: {
          concepto?: string
          empleada_id?: string | null
          fecha?: string | null
          id?: string
          monto?: number
          tipo?: Database["public"]["Enums"]["tipo_movimiento_caja"]
          turno_caja_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "movimientos_caja_empleada_id_fkey"
            columns: ["empleada_id"]
            isOneToOne: false
            referencedRelation: "perfiles_empleadas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_caja_turno_caja_id_fkey"
            columns: ["turno_caja_id"]
            isOneToOne: false
            referencedRelation: "turnos_caja"
            referencedColumns: ["id"]
          },
        ]
      }
      pagos: {
        Row: {
          detalles: Json | null
          fecha: string | null
          id: string
          importe: number
          metodo_pago: Database["public"]["Enums"]["metodo_pago"]
          ticket_id: string | null
        }
        Insert: {
          detalles?: Json | null
          fecha?: string | null
          id?: string
          importe: number
          metodo_pago: Database["public"]["Enums"]["metodo_pago"]
          ticket_id?: string | null
        }
        Update: {
          detalles?: Json | null
          fecha?: string | null
          id?: string
          importe?: number
          metodo_pago?: Database["public"]["Enums"]["metodo_pago"]
          ticket_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pagos_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      perfiles_empleadas: {
        Row: {
          activo: boolean
          id: string
          nombre: string
        }
        Insert: {
          activo?: boolean
          id?: string
          nombre: string
        }
        Update: {
          activo?: boolean
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      productos: {
        Row: {
          activo: boolean | null
          created_at: string | null
          descripcion: string | null
          id: string
          nombre: string
          precio: number
          sku: string | null
          stock: number
        }
        Insert: {
          activo?: boolean | null
          created_at?: string | null
          descripcion?: string | null
          id?: string
          nombre: string
          precio?: number
          sku?: string | null
          stock?: number
        }
        Update: {
          activo?: boolean | null
          created_at?: string | null
          descripcion?: string | null
          id?: string
          nombre?: string
          precio?: number
          sku?: string | null
          stock?: number
        }
        Relationships: []
      }
      servicios: {
        Row: {
          activo: boolean | null
          duracion_slots: number
          familia: string | null
          id: string
          nombre: string
          precio: number
        }
        Insert: {
          activo?: boolean | null
          duracion_slots?: number
          familia?: string | null
          id?: string
          nombre: string
          precio?: number
        }
        Update: {
          activo?: boolean | null
          duracion_slots?: number
          familia?: string | null
          id?: string
          nombre?: string
          precio?: number
        }
        Relationships: []
      }
      sucursales: {
        Row: {
          direccion: string | null
          id: string
          nombre: string
          rfc: string | null
          telefono: string | null
        }
        Insert: {
          direccion?: string | null
          id?: string
          nombre: string
          rfc?: string | null
          telefono?: string | null
        }
        Update: {
          direccion?: string | null
          id?: string
          nombre?: string
          rfc?: string | null
          telefono?: string | null
        }
        Relationships: []
      }
      ticket_items: {
        Row: {
          cantidad: number
          descuento: number | null
          id: string
          iva_porcentaje: number | null
          nombre: string
          precio_unitario: number
          referencia_id: string
          ticket_id: string | null
          tipo: Database["public"]["Enums"]["item_tipo"]
          total: number
          vendedor_id: string | null
          vendedor_nombre: string | null
        }
        Insert: {
          cantidad?: number
          descuento?: number | null
          id?: string
          iva_porcentaje?: number | null
          nombre: string
          precio_unitario: number
          referencia_id: string
          ticket_id?: string | null
          tipo: Database["public"]["Enums"]["item_tipo"]
          total: number
          vendedor_id?: string | null
          vendedor_nombre?: string | null
        }
        Update: {
          cantidad?: number
          descuento?: number | null
          id?: string
          iva_porcentaje?: number | null
          nombre?: string
          precio_unitario?: number
          referencia_id?: string
          ticket_id?: string | null
          tipo?: Database["public"]["Enums"]["item_tipo"]
          total?: number
          vendedor_id?: string | null
          vendedor_nombre?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_items_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_items_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "perfiles_empleadas"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          base_imponible: number
          cliente_id: string | null
          created_at: string | null
          descuento: number | null
          estado: Database["public"]["Enums"]["ticket_status"]
          fecha: string | null
          id: string
          iva: number
          num_ticket: string
          propina: number | null
          sucursal_id: string | null
          total: number
          vendedor_id: string | null
        }
        Insert: {
          base_imponible?: number
          cliente_id?: string | null
          created_at?: string | null
          descuento?: number | null
          estado?: Database["public"]["Enums"]["ticket_status"]
          fecha?: string | null
          id?: string
          iva?: number
          num_ticket: string
          propina?: number | null
          sucursal_id?: string | null
          total?: number
          vendedor_id?: string | null
        }
        Update: {
          base_imponible?: number
          cliente_id?: string | null
          created_at?: string | null
          descuento?: number | null
          estado?: Database["public"]["Enums"]["ticket_status"]
          fecha?: string | null
          id?: string
          iva?: number
          num_ticket?: string
          propina?: number | null
          sucursal_id?: string | null
          total?: number
          vendedor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_sucursal_id_fkey"
            columns: ["sucursal_id"]
            isOneToOne: false
            referencedRelation: "sucursales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "perfiles_empleadas"
            referencedColumns: ["id"]
          },
        ]
      }
      turnos_caja: {
        Row: {
          created_at: string | null
          diferencia_efectivo: number | null
          empleada_abre_id: string | null
          empleada_cierra_id: string | null
          estado: Database["public"]["Enums"]["estado_caja"]
          fecha_apertura: string
          fecha_cierre: string | null
          id: string
          monto_apertura_efectivo: number
          monto_cierre_efectivo_real: number | null
          notas_cierre: string | null
          sucursal_id: string | null
          total_gastos: number | null
          total_ingresos_extra: number | null
          total_ventas_efectivo: number | null
          total_ventas_otros: number | null
          total_ventas_tarjeta: number | null
        }
        Insert: {
          created_at?: string | null
          diferencia_efectivo?: number | null
          empleada_abre_id?: string | null
          empleada_cierra_id?: string | null
          estado?: Database["public"]["Enums"]["estado_caja"]
          fecha_apertura?: string
          fecha_cierre?: string | null
          id?: string
          monto_apertura_efectivo?: number
          monto_cierre_efectivo_real?: number | null
          notas_cierre?: string | null
          sucursal_id?: string | null
          total_gastos?: number | null
          total_ingresos_extra?: number | null
          total_ventas_efectivo?: number | null
          total_ventas_otros?: number | null
          total_ventas_tarjeta?: number | null
        }
        Update: {
          created_at?: string | null
          diferencia_efectivo?: number | null
          empleada_abre_id?: string | null
          empleada_cierra_id?: string | null
          estado?: Database["public"]["Enums"]["estado_caja"]
          fecha_apertura?: string
          fecha_cierre?: string | null
          id?: string
          monto_apertura_efectivo?: number
          monto_cierre_efectivo_real?: number | null
          notas_cierre?: string | null
          sucursal_id?: string | null
          total_gastos?: number | null
          total_ingresos_extra?: number | null
          total_ventas_efectivo?: number | null
          total_ventas_otros?: number | null
          total_ventas_tarjeta?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "turnos_caja_empleada_abre_id_fkey"
            columns: ["empleada_abre_id"]
            isOneToOne: false
            referencedRelation: "perfiles_empleadas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turnos_caja_empleada_cierra_id_fkey"
            columns: ["empleada_cierra_id"]
            isOneToOne: false
            referencedRelation: "perfiles_empleadas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turnos_caja_sucursal_id_fkey"
            columns: ["sucursal_id"]
            isOneToOne: false
            referencedRelation: "sucursales"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      decrementar_stock_producto: {
        Args: { p_cantidad: number; p_id: string }
        Returns: undefined
      }
    }
    Enums: {
      cita_status:
        | "Programada"
        | "En curso"
        | "Finalizada"
        | "Cancelada"
        | "No asistió"
      estado_caja: "Abierta" | "Cerrada"
      item_tipo: "Servicio" | "Producto"
      metodo_pago:
        | "Efectivo"
        | "Tarjeta"
        | "Transferencia"
        | "Puntos"
        | "Bono"
        | "Anticipo"
        | "Aplazado"
        | "Otros"
      sexo_type: "Mujer" | "Hombre" | "Otro"
      ticket_status: "Pendiente" | "Pagado" | "Anulado"
      tipo_movimiento_caja: "Ingreso Extra" | "Gasto / Salida"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      cita_status: [
        "Programada",
        "En curso",
        "Finalizada",
        "Cancelada",
        "No asistió",
      ],
      estado_caja: ["Abierta", "Cerrada"],
      item_tipo: ["Servicio", "Producto"],
      metodo_pago: [
        "Efectivo",
        "Tarjeta",
        "Transferencia",
        "Puntos",
        "Bono",
        "Anticipo",
        "Aplazado",
        "Otros",
      ],
      sexo_type: ["Mujer", "Hombre", "Otro"],
      ticket_status: ["Pendiente", "Pagado", "Anulado"],
      tipo_movimiento_caja: ["Ingreso Extra", "Gasto / Salida"],
    },
  },
} as const
