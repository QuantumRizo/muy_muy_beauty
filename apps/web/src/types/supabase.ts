export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      asistencia: {
        Row: {
          created_at: string | null
          empleada_id: string
          id: string
          sucursal_id: string
          tipo: Database["public"]["Enums"]["tipo_asistencia"]
        }
        Insert: {
          created_at?: string | null
          empleada_id: string
          id?: string
          sucursal_id: string
          tipo?: Database["public"]["Enums"]["tipo_asistencia"]
        }
        Update: {
          created_at?: string | null
          empleada_id?: string
          id?: string
          sucursal_id?: string
          tipo?: Database["public"]["Enums"]["tipo_asistencia"]
        }
        Relationships: [
          {
            foreignKeyName: "asistencia_empleada_id_fkey"
            columns: ["empleada_id"]
            isOneToOne: false
            referencedRelation: "perfiles_empleadas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asistencia_sucursal_id_fkey"
            columns: ["sucursal_id"]
            isOneToOne: false
            referencedRelation: "sucursales"
            referencedColumns: ["id"]
          },
        ]
      }
      bloqueos_agenda: {
        Row: {
          empleada_id: string | null
          fecha: string
          hora_fin: string
          hora_inicio: string
          id: string
          motivo: string | null
          origen: string
        }
        Insert: {
          empleada_id?: string | null
          fecha: string
          hora_fin: string
          hora_inicio: string
          id?: string
          motivo?: string | null
          origen?: string
        }
        Update: {
          empleada_id?: string | null
          fecha?: string
          hora_fin?: string
          hora_inicio?: string
          id?: string
          motivo?: string | null
          origen?: string
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
      categorias_servicio: {
        Row: {
          activo: boolean | null
          created_at: string | null
          descripcion: string | null
          id: string
          imagen_url: string | null
          nombre: string
          orden: number | null
        }
        Insert: {
          activo?: boolean | null
          created_at?: string | null
          descripcion?: string | null
          id?: string
          imagen_url?: string | null
          nombre: string
          orden?: number | null
        }
        Update: {
          activo?: boolean | null
          created_at?: string | null
          descripcion?: string | null
          id?: string
          imagen_url?: string | null
          nombre?: string
          orden?: number | null
        }
        Relationships: []
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
          notas_cliente: string | null
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
          notas_cliente?: string | null
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
          notas_cliente?: string | null
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
            referencedRelation: "mv_tickets_diarios"
            referencedColumns: ["ticket_id"]
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
          auth_user_id: string | null
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
          auth_user_id?: string | null
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
          auth_user_id?: string | null
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
      config_comisiones: {
        Row: {
          created_at: string | null
          id: string
          porcentaje_con_hoja: number
          porcentaje_sin_hoja: number
          umbral: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          porcentaje_con_hoja: number
          porcentaje_sin_hoja: number
          umbral: number
        }
        Update: {
          created_at?: string | null
          id?: string
          porcentaje_con_hoja?: number
          porcentaje_sin_hoja?: number
          umbral?: number
        }
        Relationships: []
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
      evaluaciones_hoja: {
        Row: {
          anio: number
          cumplio_hoja: boolean
          empleada_id: string
          evaluado_en: string | null
          id: string
          mes: number
          notas: string | null
          sucursal_id: string
        }
        Insert: {
          anio: number
          cumplio_hoja?: boolean
          empleada_id: string
          evaluado_en?: string | null
          id?: string
          mes: number
          notas?: string | null
          sucursal_id: string
        }
        Update: {
          anio?: number
          cumplio_hoja?: boolean
          empleada_id?: string
          evaluado_en?: string | null
          id?: string
          mes?: number
          notas?: string | null
          sucursal_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "evaluaciones_hoja_empleada_id_fkey"
            columns: ["empleada_id"]
            isOneToOne: false
            referencedRelation: "perfiles_empleadas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluaciones_hoja_sucursal_id_fkey"
            columns: ["sucursal_id"]
            isOneToOne: false
            referencedRelation: "sucursales"
            referencedColumns: ["id"]
          },
        ]
      }
      folios_ticket: {
        Row: {
          sucursal_id: string
          ultimo_numero: number
        }
        Insert: {
          sucursal_id: string
          ultimo_numero?: number
        }
        Update: {
          sucursal_id?: string
          ultimo_numero?: number
        }
        Relationships: [
          {
            foreignKeyName: "folios_ticket_sucursal_id_fkey"
            columns: ["sucursal_id"]
            isOneToOne: true
            referencedRelation: "sucursales"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_campanas: {
        Row: {
          clics: number | null
          config_id: string | null
          created_at: string | null
          estado: string
          fecha_fin: string | null
          fecha_inicio: string | null
          gasto: number | null
          id: string
          impresiones: number | null
          leads: number | null
          nombre: string
          platform: string
          platform_id: string | null
          presupuesto: number | null
          sucursal_id: string | null
          updated_at: string | null
        }
        Insert: {
          clics?: number | null
          config_id?: string | null
          created_at?: string | null
          estado?: string
          fecha_fin?: string | null
          fecha_inicio?: string | null
          gasto?: number | null
          id?: string
          impresiones?: number | null
          leads?: number | null
          nombre: string
          platform: string
          platform_id?: string | null
          presupuesto?: number | null
          sucursal_id?: string | null
          updated_at?: string | null
        }
        Update: {
          clics?: number | null
          config_id?: string | null
          created_at?: string | null
          estado?: string
          fecha_fin?: string | null
          fecha_inicio?: string | null
          gasto?: number | null
          id?: string
          impresiones?: number | null
          leads?: number | null
          nombre?: string
          platform?: string
          platform_id?: string | null
          presupuesto?: number | null
          sucursal_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketing_campanas_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "marketing_configs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_campanas_sucursal_id_fkey"
            columns: ["sucursal_id"]
            isOneToOne: false
            referencedRelation: "sucursales"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_configs: {
        Row: {
          account_id: string | null
          active: boolean | null
          api_key: string
          created_at: string | null
          id: string
          platform: string
          sucursal_id: string | null
          updated_at: string | null
        }
        Insert: {
          account_id?: string | null
          active?: boolean | null
          api_key: string
          created_at?: string | null
          id?: string
          platform: string
          sucursal_id?: string | null
          updated_at?: string | null
        }
        Update: {
          account_id?: string | null
          active?: boolean | null
          api_key?: string
          created_at?: string | null
          id?: string
          platform?: string
          sucursal_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketing_configs_sucursal_id_fkey"
            columns: ["sucursal_id"]
            isOneToOne: false
            referencedRelation: "sucursales"
            referencedColumns: ["id"]
          },
        ]
      }
      movimientos_caja: {
        Row: {
          concepto: string
          empleada_id: string | null
          fecha: string
          hora: string
          id: string
          monto: number
          tipo: Database["public"]["Enums"]["tipo_movimiento_caja"]
          turno_caja_id: string | null
        }
        Insert: {
          concepto: string
          empleada_id?: string | null
          fecha: string
          hora: string
          id?: string
          monto: number
          tipo: Database["public"]["Enums"]["tipo_movimiento_caja"]
          turno_caja_id?: string | null
        }
        Update: {
          concepto?: string
          empleada_id?: string | null
          fecha?: string
          hora?: string
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
          fecha: string
          hora: string
          id: string
          importe: number
          metodo_pago: Database["public"]["Enums"]["metodo_pago"]
          ticket_id: string | null
        }
        Insert: {
          detalles?: Json | null
          fecha: string
          hora: string
          id?: string
          importe: number
          metodo_pago: Database["public"]["Enums"]["metodo_pago"]
          ticket_id?: string | null
        }
        Update: {
          detalles?: Json | null
          fecha?: string
          hora?: string
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
            referencedRelation: "mv_tickets_diarios"
            referencedColumns: ["ticket_id"]
          },
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
          fecha_contratacion: string | null
          id: string
          nombre: string
          pin_hash: string | null
          sucursal_id: string | null
          sueldo_diario: number | null
        }
        Insert: {
          activo?: boolean
          fecha_contratacion?: string | null
          id?: string
          nombre: string
          pin_hash?: string | null
          sucursal_id?: string | null
          sueldo_diario?: number | null
        }
        Update: {
          activo?: boolean
          fecha_contratacion?: string | null
          id?: string
          nombre?: string
          pin_hash?: string | null
          sucursal_id?: string | null
          sueldo_diario?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "perfiles_empleadas_sucursal_id_fkey"
            columns: ["sucursal_id"]
            isOneToOne: false
            referencedRelation: "sucursales"
            referencedColumns: ["id"]
          },
        ]
      }
      perfiles_usuario: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          id: string
          nombre: string | null
          rol: string | null
          sucursal_id: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          id: string
          nombre?: string | null
          rol?: string | null
          sucursal_id?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          id?: string
          nombre?: string | null
          rol?: string | null
          sucursal_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "perfiles_usuario_sucursal_id_fkey"
            columns: ["sucursal_id"]
            isOneToOne: false
            referencedRelation: "sucursales"
            referencedColumns: ["id"]
          },
        ]
      }
      productos: {
        Row: {
          activo: boolean | null
          created_at: string | null
          descripcion: string | null
          id: string
          nombre: string
          precio: number
          precio_costo: number | null
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
          precio_costo?: number | null
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
          precio_costo?: number | null
          sku?: string | null
          stock?: number
        }
        Relationships: []
      }
      servicios: {
        Row: {
          activo: boolean | null
          categoria_id: string | null
          duracion_slots: number
          id: string
          nombre: string
          precio: number
        }
        Insert: {
          activo?: boolean | null
          categoria_id?: string | null
          duracion_slots?: number
          id?: string
          nombre: string
          precio?: number
        }
        Update: {
          activo?: boolean | null
          categoria_id?: string | null
          duracion_slots?: number
          id?: string
          nombre?: string
          precio?: number
        }
        Relationships: [
          {
            foreignKeyName: "servicios_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_servicio"
            referencedColumns: ["id"]
          },
        ]
      }
      solicitudes_vacaciones: {
        Row: {
          created_at: string
          empleada_id: string
          estado: string
          fecha_fin: string
          fecha_inicio: string
          id: string
          notas_admin: string | null
          notas_empleada: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          solicitud_padre_id: string | null
          sucursal_id: string
          tipo: string
        }
        Insert: {
          created_at?: string
          empleada_id: string
          estado?: string
          fecha_fin: string
          fecha_inicio: string
          id?: string
          notas_admin?: string | null
          notas_empleada?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          solicitud_padre_id?: string | null
          sucursal_id: string
          tipo?: string
        }
        Update: {
          created_at?: string
          empleada_id?: string
          estado?: string
          fecha_fin?: string
          fecha_inicio?: string
          id?: string
          notas_admin?: string | null
          notas_empleada?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          solicitud_padre_id?: string | null
          sucursal_id?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "solicitudes_vacaciones_empleada_id_fkey"
            columns: ["empleada_id"]
            isOneToOne: false
            referencedRelation: "perfiles_empleadas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitudes_vacaciones_solicitud_padre_id_fkey"
            columns: ["solicitud_padre_id"]
            isOneToOne: false
            referencedRelation: "solicitudes_vacaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitudes_vacaciones_sucursal_id_fkey"
            columns: ["sucursal_id"]
            isOneToOne: false
            referencedRelation: "sucursales"
            referencedColumns: ["id"]
          },
        ]
      }
      sucursales: {
        Row: {
          direccion: string | null
          hora_apertura: string
          hora_apertura_finde: string | null
          hora_cierre: string
          hora_cierre_finde: string | null
          horarios_por_dia: Json | null
          id: string
          nombre: string
          num_cabinas: number
          rfc: string | null
          telefono: string | null
        }
        Insert: {
          direccion?: string | null
          hora_apertura?: string
          hora_apertura_finde?: string | null
          hora_cierre?: string
          hora_cierre_finde?: string | null
          horarios_por_dia?: Json | null
          id?: string
          nombre: string
          num_cabinas?: number
          rfc?: string | null
          telefono?: string | null
        }
        Update: {
          direccion?: string | null
          hora_apertura?: string
          hora_apertura_finde?: string | null
          hora_cierre?: string
          hora_cierre_finde?: string | null
          horarios_por_dia?: Json | null
          id?: string
          nombre?: string
          num_cabinas?: number
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
            referencedRelation: "mv_tickets_diarios"
            referencedColumns: ["ticket_id"]
          },
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
          fecha: string
          hora: string
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
          fecha: string
          hora: string
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
          fecha?: string
          hora?: string
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
          hora_apertura: string
          hora_cierre: string | null
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
          fecha_apertura: string
          fecha_cierre?: string | null
          hora_apertura: string
          hora_cierre?: string | null
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
          hora_apertura?: string
          hora_cierre?: string | null
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
      mv_asistencias_diarias: {
        Row: {
          empleada_id: string | null
          fecha: string | null
          sucursal_id: string | null
          sueldo_diario: number | null
        }
        Relationships: [
          {
            foreignKeyName: "asistencia_empleada_id_fkey"
            columns: ["empleada_id"]
            isOneToOne: false
            referencedRelation: "perfiles_empleadas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asistencia_sucursal_id_fkey"
            columns: ["sucursal_id"]
            isOneToOne: false
            referencedRelation: "sucursales"
            referencedColumns: ["id"]
          },
        ]
      }
      mv_pagos_diarios: {
        Row: {
          cantidad: number | null
          fecha: string | null
          metodo_pago: string | null
          sucursal_id: string | null
          total: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_sucursal_id_fkey"
            columns: ["sucursal_id"]
            isOneToOne: false
            referencedRelation: "sucursales"
            referencedColumns: ["id"]
          },
        ]
      }
      mv_servicios_familia_diarios: {
        Row: {
          cantidad: number | null
          familia: string | null
          fecha: string | null
          sucursal_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_sucursal_id_fkey"
            columns: ["sucursal_id"]
            isOneToOne: false
            referencedRelation: "sucursales"
            referencedColumns: ["id"]
          },
        ]
      }
      mv_tickets_diarios: {
        Row: {
          fecha: string | null
          sucursal_id: string | null
          sucursal_nombre: string | null
          sueldo_diario: number | null
          ticket_id: string | null
          total: number | null
          vendedor_id: string | null
          vendedor_nombre: string | null
        }
        Relationships: [
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
      mv_ventas_empleado_diarias: {
        Row: {
          fecha: string | null
          sucursal_id: string | null
          sucursal_nombre: string | null
          total_ventas: number | null
          vendedor_id: string | null
          vendedor_nombre: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_items_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "perfiles_empleadas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_sucursal_id_fkey"
            columns: ["sucursal_id"]
            isOneToOne: false
            referencedRelation: "sucursales"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      actualizar_perfil_cliente: {
        Args: {
          p_cliente_id: string
          p_email: string
          p_nombre_completo: string
        }
        Returns: Json
      }
      aprobar_vacaciones: {
        Args: { p_admin_id: string; p_notas?: string; p_solicitud_id: string }
        Returns: undefined
      }
      asignar_pin_empleada: {
        Args: { p_empleada_id: string; p_pin: string }
        Returns: undefined
      }
      cancelar_cita_cliente: {
        Args: { p_cita_id: string; p_cliente_id: string }
        Returns: Json
      }
      crear_reserva_publica: {
        Args: {
          p_bloque_inicio: string
          p_email: string
          p_empleada_id?: string
          p_fecha: string
          p_nombre: string
          p_notas?: string
          p_servicio_ids: string[]
          p_sucursal_id: string
          p_telefono: string
        }
        Returns: Json
      }
      decrementar_stock_producto: {
        Args: { p_cantidad: number; p_id: string }
        Returns: undefined
      }
      get_primeras_compras: {
        Args: {
          p_fecha_fin: string
          p_fecha_inicio: string
          p_sucursal_id?: string
        }
        Returns: {
          cliente_id: string
          fecha: string
          sucursal_id: string
          sucursal_nombre: string
          total: number
        }[]
      }
      get_primeras_sesiones: {
        Args: {
          p_fecha_fin: string
          p_fecha_inicio: string
          p_sucursal_id?: string
        }
        Returns: {
          cliente_id: string
          fecha: string
          sucursal_id: string
          sucursal_nombre: string
        }[]
      }
      obtener_perfil_cliente: { Args: { p_cliente_id: string }; Returns: Json }
      rechazar_vacaciones: {
        Args: { p_admin_id: string; p_notas?: string; p_solicitud_id: string }
        Returns: undefined
      }
      refresh_dashboard_views: { Args: never; Returns: undefined }
      siguiente_folio_ticket: {
        Args: { p_sucursal_id: string }
        Returns: number
      }
      validar_disponibilidad_cita: {
        Args: {
          p_empleada_id: string
          p_excluir_cita_id?: string
          p_fecha: string
          p_hora_fin: string
          p_hora_inicio: string
        }
        Returns: boolean
      }
      verificar_cliente_por_telefono: {
        Args: { p_telefono: string }
        Returns: Json
      }
      verificar_pin_empleada: {
        Args: { p_empleada_id: string; p_pin: string }
        Returns: boolean
      }
      vincular_cliente_auth: {
        Args: { p_email?: string; p_nombre?: string }
        Returns: Json
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
      tipo_asistencia: "Entrada" | "Salida Comida" | "Regreso Comida" | "Salida"
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
  graphql_public: {
    Enums: {},
  },
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
      tipo_asistencia: ["Entrada", "Salida Comida", "Regreso Comida", "Salida"],
      tipo_movimiento_caja: ["Ingreso Extra", "Gasto / Salida"],
    },
  },
} as const

