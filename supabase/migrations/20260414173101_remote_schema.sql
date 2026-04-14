create type "public"."cita_status" as enum ('Programada', 'En curso', 'Finalizada', 'Cancelada', 'No asistió');

create type "public"."estado_caja" as enum ('Abierta', 'Cerrada');

create type "public"."item_tipo" as enum ('Servicio', 'Producto');

create type "public"."metodo_pago" as enum ('Efectivo', 'Tarjeta', 'Transferencia', 'Puntos', 'Bono', 'Anticipo', 'Aplazado', 'Otros');

create type "public"."sexo_type" as enum ('Mujer', 'Hombre', 'Otro');

create type "public"."ticket_status" as enum ('Pendiente', 'Pagado', 'Anulado');

create type "public"."tipo_movimiento_caja" as enum ('Ingreso Extra', 'Gasto / Salida');

create sequence "public"."clientes_num_cliente_seq";


  create table "public"."asistencia" (
    "id" uuid not null default gen_random_uuid(),
    "sucursal_id" uuid not null,
    "empleada_id" uuid not null,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."asistencia" enable row level security;


  create table "public"."bloqueos_agenda" (
    "id" uuid not null default gen_random_uuid(),
    "empleada_id" uuid,
    "fecha" date not null,
    "hora_inicio" time without time zone not null,
    "hora_fin" time without time zone not null,
    "motivo" text default 'Comida'::text
      );


alter table "public"."bloqueos_agenda" enable row level security;


  create table "public"."cita_servicios" (
    "id" uuid not null default gen_random_uuid(),
    "cita_id" uuid,
    "servicio_id" uuid
      );


alter table "public"."cita_servicios" enable row level security;


  create table "public"."citas" (
    "id" uuid not null default gen_random_uuid(),
    "cliente_id" uuid,
    "empleada_id" uuid,
    "sucursal_id" uuid,
    "fecha" date not null,
    "bloque_inicio" time without time zone not null,
    "estado" public.cita_status not null default 'Programada'::public.cita_status,
    "comentarios" text,
    "created_at" timestamp with time zone default now(),
    "duracion_manual_slots" integer,
    "ticket_id" uuid
      );


alter table "public"."citas" enable row level security;


  create table "public"."clientes" (
    "id" uuid not null default gen_random_uuid(),
    "num_cliente" integer not null default nextval('public.clientes_num_cliente_seq'::regclass),
    "nombre_completo" text not null,
    "telefono_cel" text,
    "email" text,
    "datos_extra" jsonb default '{}'::jsonb,
    "created_at" timestamp with time zone default now(),
    "sucursal_id" uuid
      );


alter table "public"."clientes" enable row level security;


  create table "public"."documentos" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "nombre" text not null,
    "descripcion" text,
    "archivo_url" text not null,
    "peso_bytes" bigint,
    "tipo_mime" text,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now())
      );


alter table "public"."documentos" enable row level security;


  create table "public"."evaluaciones_hoja" (
    "id" uuid not null default gen_random_uuid(),
    "empleada_id" uuid not null,
    "sucursal_id" uuid not null,
    "mes" smallint not null,
    "anio" smallint not null,
    "cumplio_hoja" boolean not null default false,
    "notas" text,
    "evaluado_en" timestamp with time zone default now()
      );


alter table "public"."evaluaciones_hoja" enable row level security;


  create table "public"."folios_ticket" (
    "sucursal_id" uuid not null,
    "ultimo_numero" integer not null default 0
      );


alter table "public"."folios_ticket" enable row level security;


  create table "public"."marketing_campanas" (
    "id" uuid not null default gen_random_uuid(),
    "config_id" uuid,
    "sucursal_id" uuid,
    "nombre" text not null,
    "platform" text not null,
    "estado" text not null default 'activa'::text,
    "fecha_inicio" date,
    "fecha_fin" date,
    "presupuesto" numeric(12,2) default 0,
    "gasto" numeric(12,2) default 0,
    "impresiones" bigint default 0,
    "clics" bigint default 0,
    "leads" integer default 0,
    "platform_id" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."marketing_campanas" enable row level security;


  create table "public"."marketing_configs" (
    "id" uuid not null default gen_random_uuid(),
    "sucursal_id" uuid,
    "platform" text not null,
    "api_key" text not null,
    "account_id" text,
    "active" boolean default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."marketing_configs" enable row level security;


  create table "public"."movimientos_caja" (
    "id" uuid not null default gen_random_uuid(),
    "turno_caja_id" uuid,
    "empleada_id" uuid,
    "tipo" public.tipo_movimiento_caja not null,
    "monto" numeric(10,2) not null,
    "concepto" text not null,
    "fecha" date not null,
    "hora" time without time zone not null
      );


alter table "public"."movimientos_caja" enable row level security;


  create table "public"."pagos" (
    "id" uuid not null default gen_random_uuid(),
    "ticket_id" uuid,
    "metodo_pago" public.metodo_pago not null,
    "importe" numeric(10,2) not null,
    "detalles" jsonb default '{}'::jsonb,
    "fecha" date not null,
    "hora" time without time zone not null
      );


alter table "public"."pagos" enable row level security;


  create table "public"."perfiles_empleadas" (
    "id" uuid not null default gen_random_uuid(),
    "nombre" text not null,
    "activo" boolean not null default true,
    "fecha_contratacion" date,
    "sueldo_diario" numeric(10,2) default 0
      );


alter table "public"."perfiles_empleadas" enable row level security;


  create table "public"."perfiles_usuario" (
    "id" uuid not null,
    "email" text not null,
    "nombre" text,
    "avatar_url" text,
    "rol" text default 'admin'::text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."perfiles_usuario" enable row level security;


  create table "public"."productos" (
    "id" uuid not null default gen_random_uuid(),
    "nombre" text not null,
    "descripcion" text,
    "precio" numeric(10,2) not null default 0,
    "stock" integer not null default 0,
    "sku" text,
    "activo" boolean default true,
    "created_at" timestamp with time zone default now(),
    "precio_costo" numeric(10,2) default 0
      );


alter table "public"."productos" enable row level security;


  create table "public"."servicios" (
    "id" uuid not null default gen_random_uuid(),
    "nombre" text not null,
    "duracion_slots" integer not null default 4,
    "precio" numeric(10,2) not null default 0,
    "familia" text,
    "activo" boolean default true
      );


alter table "public"."servicios" enable row level security;


  create table "public"."sucursales" (
    "id" uuid not null default gen_random_uuid(),
    "nombre" text not null,
    "direccion" text,
    "telefono" text,
    "rfc" text
      );


alter table "public"."sucursales" enable row level security;


  create table "public"."ticket_items" (
    "id" uuid not null default gen_random_uuid(),
    "ticket_id" uuid,
    "tipo" public.item_tipo not null,
    "referencia_id" uuid not null,
    "nombre" text not null,
    "cantidad" integer not null default 1,
    "precio_unitario" numeric(10,2) not null,
    "iva_porcentaje" numeric(5,2) default 16.00,
    "descuento" numeric(10,2) default 0,
    "total" numeric(10,2) not null,
    "vendedor_id" uuid,
    "vendedor_nombre" text
      );


alter table "public"."ticket_items" enable row level security;


  create table "public"."tickets" (
    "id" uuid not null default gen_random_uuid(),
    "sucursal_id" uuid,
    "cliente_id" uuid,
    "vendedor_id" uuid,
    "num_ticket" text not null,
    "base_imponible" numeric(10,2) not null default 0,
    "iva" numeric(10,2) not null default 0,
    "total" numeric(10,2) not null default 0,
    "descuento" numeric(10,2) default 0,
    "propina" numeric(10,2) default 0,
    "estado" public.ticket_status not null default 'Pendiente'::public.ticket_status,
    "created_at" timestamp with time zone default now(),
    "fecha" date not null,
    "hora" time without time zone not null
      );


alter table "public"."tickets" enable row level security;


  create table "public"."turnos_caja" (
    "id" uuid not null default gen_random_uuid(),
    "sucursal_id" uuid,
    "empleada_abre_id" uuid,
    "empleada_cierra_id" uuid,
    "estado" public.estado_caja not null default 'Abierta'::public.estado_caja,
    "monto_apertura_efectivo" numeric(10,2) not null default 0,
    "monto_cierre_efectivo_real" numeric(10,2),
    "total_ventas_efectivo" numeric(10,2) default 0,
    "total_ventas_tarjeta" numeric(10,2) default 0,
    "total_ventas_otros" numeric(10,2) default 0,
    "total_gastos" numeric(10,2) default 0,
    "total_ingresos_extra" numeric(10,2) default 0,
    "diferencia_efectivo" numeric(10,2),
    "notas_cierre" text,
    "created_at" timestamp with time zone default now(),
    "fecha_apertura" date not null,
    "hora_apertura" time without time zone not null,
    "fecha_cierre" date,
    "hora_cierre" time without time zone
      );


alter table "public"."turnos_caja" enable row level security;

alter sequence "public"."clientes_num_cliente_seq" owned by "public"."clientes"."num_cliente";

CREATE UNIQUE INDEX asistencia_pkey ON public.asistencia USING btree (id);

CREATE UNIQUE INDEX bloqueos_agenda_pkey ON public.bloqueos_agenda USING btree (id);

CREATE UNIQUE INDEX cita_servicios_pkey ON public.cita_servicios USING btree (id);

CREATE UNIQUE INDEX citas_pkey ON public.citas USING btree (id);

CREATE UNIQUE INDEX clientes_num_cliente_key ON public.clientes USING btree (num_cliente);

CREATE UNIQUE INDEX clientes_pkey ON public.clientes USING btree (id);

CREATE UNIQUE INDEX documentos_pkey ON public.documentos USING btree (id);

CREATE UNIQUE INDEX evaluaciones_hoja_empleada_id_mes_anio_key ON public.evaluaciones_hoja USING btree (empleada_id, mes, anio);

CREATE UNIQUE INDEX evaluaciones_hoja_pkey ON public.evaluaciones_hoja USING btree (id);

CREATE UNIQUE INDEX folios_ticket_pkey ON public.folios_ticket USING btree (sucursal_id);

CREATE INDEX idx_asistencia_sucursal_fecha ON public.asistencia USING btree (sucursal_id, created_at);

CREATE INDEX idx_bloqueos_fecha ON public.bloqueos_agenda USING btree (fecha);

CREATE INDEX idx_citas_empleada ON public.citas USING btree (empleada_id);

CREATE INDEX idx_citas_fecha ON public.citas USING btree (fecha);

CREATE INDEX idx_citas_sucursal ON public.citas USING btree (sucursal_id);

CREATE INDEX idx_clientes_telefono ON public.clientes USING btree (telefono_cel);

CREATE INDEX idx_evaluaciones_hoja_periodo ON public.evaluaciones_hoja USING btree (anio, mes, sucursal_id);

CREATE INDEX idx_items_ticket ON public.ticket_items USING btree (ticket_id);

CREATE INDEX idx_movimientos_turno ON public.movimientos_caja USING btree (turno_caja_id);

CREATE INDEX idx_pagos_ticket ON public.pagos USING btree (ticket_id);

CREATE INDEX idx_tickets_cliente ON public.tickets USING btree (cliente_id);

CREATE INDEX idx_tickets_sucursal ON public.tickets USING btree (sucursal_id);

CREATE INDEX idx_turnos_estado ON public.turnos_caja USING btree (estado);

CREATE INDEX idx_turnos_sucursal ON public.turnos_caja USING btree (sucursal_id);

CREATE UNIQUE INDEX idx_un_turno_abierto_por_sucursal ON public.turnos_caja USING btree (sucursal_id) WHERE (estado = 'Abierta'::public.estado_caja);

CREATE UNIQUE INDEX marketing_campanas_pkey ON public.marketing_campanas USING btree (id);

CREATE UNIQUE INDEX marketing_configs_pkey ON public.marketing_configs USING btree (id);

CREATE UNIQUE INDEX marketing_configs_sucursal_platform_idx ON public.marketing_configs USING btree (sucursal_id, platform) WHERE (active = true);

CREATE UNIQUE INDEX movimientos_caja_pkey ON public.movimientos_caja USING btree (id);

CREATE UNIQUE INDEX pagos_pkey ON public.pagos USING btree (id);

CREATE UNIQUE INDEX perfiles_empleadas_pkey ON public.perfiles_empleadas USING btree (id);

CREATE UNIQUE INDEX perfiles_usuario_pkey ON public.perfiles_usuario USING btree (id);

CREATE UNIQUE INDEX productos_pkey ON public.productos USING btree (id);

CREATE UNIQUE INDEX productos_sku_key ON public.productos USING btree (sku);

CREATE UNIQUE INDEX servicios_pkey ON public.servicios USING btree (id);

CREATE UNIQUE INDEX sucursales_pkey ON public.sucursales USING btree (id);

CREATE UNIQUE INDEX ticket_items_pkey ON public.ticket_items USING btree (id);

CREATE UNIQUE INDEX tickets_num_ticket_key ON public.tickets USING btree (num_ticket);

CREATE UNIQUE INDEX tickets_pkey ON public.tickets USING btree (id);

CREATE UNIQUE INDEX turnos_caja_pkey ON public.turnos_caja USING btree (id);

alter table "public"."asistencia" add constraint "asistencia_pkey" PRIMARY KEY using index "asistencia_pkey";

alter table "public"."bloqueos_agenda" add constraint "bloqueos_agenda_pkey" PRIMARY KEY using index "bloqueos_agenda_pkey";

alter table "public"."cita_servicios" add constraint "cita_servicios_pkey" PRIMARY KEY using index "cita_servicios_pkey";

alter table "public"."citas" add constraint "citas_pkey" PRIMARY KEY using index "citas_pkey";

alter table "public"."clientes" add constraint "clientes_pkey" PRIMARY KEY using index "clientes_pkey";

alter table "public"."documentos" add constraint "documentos_pkey" PRIMARY KEY using index "documentos_pkey";

alter table "public"."evaluaciones_hoja" add constraint "evaluaciones_hoja_pkey" PRIMARY KEY using index "evaluaciones_hoja_pkey";

alter table "public"."folios_ticket" add constraint "folios_ticket_pkey" PRIMARY KEY using index "folios_ticket_pkey";

alter table "public"."marketing_campanas" add constraint "marketing_campanas_pkey" PRIMARY KEY using index "marketing_campanas_pkey";

alter table "public"."marketing_configs" add constraint "marketing_configs_pkey" PRIMARY KEY using index "marketing_configs_pkey";

alter table "public"."movimientos_caja" add constraint "movimientos_caja_pkey" PRIMARY KEY using index "movimientos_caja_pkey";

alter table "public"."pagos" add constraint "pagos_pkey" PRIMARY KEY using index "pagos_pkey";

alter table "public"."perfiles_empleadas" add constraint "perfiles_empleadas_pkey" PRIMARY KEY using index "perfiles_empleadas_pkey";

alter table "public"."perfiles_usuario" add constraint "perfiles_usuario_pkey" PRIMARY KEY using index "perfiles_usuario_pkey";

alter table "public"."productos" add constraint "productos_pkey" PRIMARY KEY using index "productos_pkey";

alter table "public"."servicios" add constraint "servicios_pkey" PRIMARY KEY using index "servicios_pkey";

alter table "public"."sucursales" add constraint "sucursales_pkey" PRIMARY KEY using index "sucursales_pkey";

alter table "public"."ticket_items" add constraint "ticket_items_pkey" PRIMARY KEY using index "ticket_items_pkey";

alter table "public"."tickets" add constraint "tickets_pkey" PRIMARY KEY using index "tickets_pkey";

alter table "public"."turnos_caja" add constraint "turnos_caja_pkey" PRIMARY KEY using index "turnos_caja_pkey";

alter table "public"."asistencia" add constraint "asistencia_empleada_id_fkey" FOREIGN KEY (empleada_id) REFERENCES public.perfiles_empleadas(id) ON DELETE CASCADE not valid;

alter table "public"."asistencia" validate constraint "asistencia_empleada_id_fkey";

alter table "public"."asistencia" add constraint "asistencia_sucursal_id_fkey" FOREIGN KEY (sucursal_id) REFERENCES public.sucursales(id) ON DELETE CASCADE not valid;

alter table "public"."asistencia" validate constraint "asistencia_sucursal_id_fkey";

alter table "public"."bloqueos_agenda" add constraint "bloqueos_agenda_empleada_id_fkey" FOREIGN KEY (empleada_id) REFERENCES public.perfiles_empleadas(id) ON DELETE CASCADE not valid;

alter table "public"."bloqueos_agenda" validate constraint "bloqueos_agenda_empleada_id_fkey";

alter table "public"."cita_servicios" add constraint "cita_servicios_cita_id_fkey" FOREIGN KEY (cita_id) REFERENCES public.citas(id) ON DELETE CASCADE not valid;

alter table "public"."cita_servicios" validate constraint "cita_servicios_cita_id_fkey";

alter table "public"."cita_servicios" add constraint "cita_servicios_servicio_id_fkey" FOREIGN KEY (servicio_id) REFERENCES public.servicios(id) ON DELETE CASCADE not valid;

alter table "public"."cita_servicios" validate constraint "cita_servicios_servicio_id_fkey";

alter table "public"."citas" add constraint "citas_cliente_id_fkey" FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON DELETE CASCADE not valid;

alter table "public"."citas" validate constraint "citas_cliente_id_fkey";

alter table "public"."citas" add constraint "citas_empleada_id_fkey" FOREIGN KEY (empleada_id) REFERENCES public.perfiles_empleadas(id) ON DELETE SET NULL not valid;

alter table "public"."citas" validate constraint "citas_empleada_id_fkey";

alter table "public"."citas" add constraint "citas_sucursal_id_fkey" FOREIGN KEY (sucursal_id) REFERENCES public.sucursales(id) ON DELETE CASCADE not valid;

alter table "public"."citas" validate constraint "citas_sucursal_id_fkey";

alter table "public"."citas" add constraint "citas_ticket_id_fkey" FOREIGN KEY (ticket_id) REFERENCES public.tickets(id) ON DELETE SET NULL not valid;

alter table "public"."citas" validate constraint "citas_ticket_id_fkey";

alter table "public"."clientes" add constraint "clientes_num_cliente_key" UNIQUE using index "clientes_num_cliente_key";

alter table "public"."clientes" add constraint "clientes_sucursal_id_fkey" FOREIGN KEY (sucursal_id) REFERENCES public.sucursales(id) ON DELETE SET NULL not valid;

alter table "public"."clientes" validate constraint "clientes_sucursal_id_fkey";

alter table "public"."evaluaciones_hoja" add constraint "evaluaciones_hoja_empleada_id_fkey" FOREIGN KEY (empleada_id) REFERENCES public.perfiles_empleadas(id) ON DELETE CASCADE not valid;

alter table "public"."evaluaciones_hoja" validate constraint "evaluaciones_hoja_empleada_id_fkey";

alter table "public"."evaluaciones_hoja" add constraint "evaluaciones_hoja_empleada_id_mes_anio_key" UNIQUE using index "evaluaciones_hoja_empleada_id_mes_anio_key";

alter table "public"."evaluaciones_hoja" add constraint "evaluaciones_hoja_mes_check" CHECK (((mes >= 1) AND (mes <= 12))) not valid;

alter table "public"."evaluaciones_hoja" validate constraint "evaluaciones_hoja_mes_check";

alter table "public"."evaluaciones_hoja" add constraint "evaluaciones_hoja_sucursal_id_fkey" FOREIGN KEY (sucursal_id) REFERENCES public.sucursales(id) ON DELETE CASCADE not valid;

alter table "public"."evaluaciones_hoja" validate constraint "evaluaciones_hoja_sucursal_id_fkey";

alter table "public"."folios_ticket" add constraint "folios_ticket_sucursal_id_fkey" FOREIGN KEY (sucursal_id) REFERENCES public.sucursales(id) ON DELETE CASCADE not valid;

alter table "public"."folios_ticket" validate constraint "folios_ticket_sucursal_id_fkey";

alter table "public"."marketing_campanas" add constraint "marketing_campanas_config_id_fkey" FOREIGN KEY (config_id) REFERENCES public.marketing_configs(id) ON DELETE CASCADE not valid;

alter table "public"."marketing_campanas" validate constraint "marketing_campanas_config_id_fkey";

alter table "public"."marketing_campanas" add constraint "marketing_campanas_estado_check" CHECK ((estado = ANY (ARRAY['activa'::text, 'pausada'::text, 'finalizada'::text]))) not valid;

alter table "public"."marketing_campanas" validate constraint "marketing_campanas_estado_check";

alter table "public"."marketing_campanas" add constraint "marketing_campanas_platform_check" CHECK ((platform = ANY (ARRAY['meta'::text, 'google'::text, 'otro'::text]))) not valid;

alter table "public"."marketing_campanas" validate constraint "marketing_campanas_platform_check";

alter table "public"."marketing_campanas" add constraint "marketing_campanas_sucursal_id_fkey" FOREIGN KEY (sucursal_id) REFERENCES public.sucursales(id) ON DELETE CASCADE not valid;

alter table "public"."marketing_campanas" validate constraint "marketing_campanas_sucursal_id_fkey";

alter table "public"."marketing_configs" add constraint "marketing_configs_platform_check" CHECK ((platform = ANY (ARRAY['meta'::text, 'google'::text]))) not valid;

alter table "public"."marketing_configs" validate constraint "marketing_configs_platform_check";

alter table "public"."marketing_configs" add constraint "marketing_configs_sucursal_id_fkey" FOREIGN KEY (sucursal_id) REFERENCES public.sucursales(id) ON DELETE CASCADE not valid;

alter table "public"."marketing_configs" validate constraint "marketing_configs_sucursal_id_fkey";

alter table "public"."movimientos_caja" add constraint "movimientos_caja_empleada_id_fkey" FOREIGN KEY (empleada_id) REFERENCES public.perfiles_empleadas(id) ON DELETE SET NULL not valid;

alter table "public"."movimientos_caja" validate constraint "movimientos_caja_empleada_id_fkey";

alter table "public"."movimientos_caja" add constraint "movimientos_caja_turno_caja_id_fkey" FOREIGN KEY (turno_caja_id) REFERENCES public.turnos_caja(id) ON DELETE CASCADE not valid;

alter table "public"."movimientos_caja" validate constraint "movimientos_caja_turno_caja_id_fkey";

alter table "public"."pagos" add constraint "pagos_ticket_id_fkey" FOREIGN KEY (ticket_id) REFERENCES public.tickets(id) ON DELETE CASCADE not valid;

alter table "public"."pagos" validate constraint "pagos_ticket_id_fkey";

alter table "public"."perfiles_usuario" add constraint "perfiles_usuario_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."perfiles_usuario" validate constraint "perfiles_usuario_id_fkey";

alter table "public"."perfiles_usuario" add constraint "perfiles_usuario_rol_check" CHECK ((rol = ANY (ARRAY['admin'::text, 'superadmin'::text]))) not valid;

alter table "public"."perfiles_usuario" validate constraint "perfiles_usuario_rol_check";

alter table "public"."productos" add constraint "productos_sku_key" UNIQUE using index "productos_sku_key";

alter table "public"."ticket_items" add constraint "ticket_items_ticket_id_fkey" FOREIGN KEY (ticket_id) REFERENCES public.tickets(id) ON DELETE CASCADE not valid;

alter table "public"."ticket_items" validate constraint "ticket_items_ticket_id_fkey";

alter table "public"."ticket_items" add constraint "ticket_items_vendedor_id_fkey" FOREIGN KEY (vendedor_id) REFERENCES public.perfiles_empleadas(id) ON DELETE SET NULL not valid;

alter table "public"."ticket_items" validate constraint "ticket_items_vendedor_id_fkey";

alter table "public"."tickets" add constraint "tickets_cliente_id_fkey" FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON DELETE SET NULL not valid;

alter table "public"."tickets" validate constraint "tickets_cliente_id_fkey";

alter table "public"."tickets" add constraint "tickets_num_ticket_key" UNIQUE using index "tickets_num_ticket_key";

alter table "public"."tickets" add constraint "tickets_sucursal_id_fkey" FOREIGN KEY (sucursal_id) REFERENCES public.sucursales(id) ON DELETE CASCADE not valid;

alter table "public"."tickets" validate constraint "tickets_sucursal_id_fkey";

alter table "public"."tickets" add constraint "tickets_vendedor_id_fkey" FOREIGN KEY (vendedor_id) REFERENCES public.perfiles_empleadas(id) ON DELETE SET NULL not valid;

alter table "public"."tickets" validate constraint "tickets_vendedor_id_fkey";

alter table "public"."turnos_caja" add constraint "turnos_caja_empleada_abre_id_fkey" FOREIGN KEY (empleada_abre_id) REFERENCES public.perfiles_empleadas(id) ON DELETE SET NULL not valid;

alter table "public"."turnos_caja" validate constraint "turnos_caja_empleada_abre_id_fkey";

alter table "public"."turnos_caja" add constraint "turnos_caja_empleada_cierra_id_fkey" FOREIGN KEY (empleada_cierra_id) REFERENCES public.perfiles_empleadas(id) ON DELETE SET NULL not valid;

alter table "public"."turnos_caja" validate constraint "turnos_caja_empleada_cierra_id_fkey";

alter table "public"."turnos_caja" add constraint "turnos_caja_sucursal_id_fkey" FOREIGN KEY (sucursal_id) REFERENCES public.sucursales(id) ON DELETE CASCADE not valid;

alter table "public"."turnos_caja" validate constraint "turnos_caja_sucursal_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.decrementar_stock_producto(p_id uuid, p_cantidad integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  UPDATE productos
  SET stock = stock - p_cantidad
  WHERE id = p_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    INSERT INTO public.perfiles_usuario (id, email, nombre)
    VALUES (
        NEW.id, 
        NEW.email, 
        COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1))
    );
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.siguiente_folio_ticket(p_sucursal_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_nuevo INT;
BEGIN
  -- Si no existe fila para esta sucursal, crearla
  INSERT INTO folios_ticket (sucursal_id, ultimo_numero)
  VALUES (p_sucursal_id, 0)
  ON CONFLICT (sucursal_id) DO NOTHING;

  -- Incrementar y obtener el nuevo número atómicamente
  UPDATE folios_ticket
  SET ultimo_numero = ultimo_numero + 1
  WHERE sucursal_id = p_sucursal_id
  RETURNING ultimo_numero INTO v_nuevo;

  RETURN v_nuevo;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.validar_disponibilidad_cita()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  conflict_count INT;
  v_new_end_time TIME;
BEGIN
  IF NEW.duracion_manual_slots IS NULL THEN
     NEW.duracion_manual_slots := 4;
  END IF;
  
  v_new_end_time := NEW.bloque_inicio + (NEW.duracion_manual_slots * 15 || ' minutes')::interval;

  -- Checar con otras citas agendadas
  SELECT count(*) INTO conflict_count
  FROM citas
  WHERE empleada_id = NEW.empleada_id
    AND fecha = NEW.fecha
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000')
    AND estado != 'Cancelada'
    AND estado != 'No asistió'
    AND (
      (NEW.bloque_inicio, v_new_end_time) OVERLAPS 
      (bloque_inicio, bloque_inicio + (COALESCE(duracion_manual_slots, 4) * 15 || ' minutes')::interval)
    );

  IF conflict_count > 0 THEN
    RAISE EXCEPTION 'Horario ocupado (Cita existente) para la profesional seleccionada en esta fecha.';
  END IF;

  -- Checar con bloqueos de agenda físicos (Comida/Descansos)
  SELECT count(*) INTO conflict_count
  FROM bloqueos_agenda
  WHERE empleada_id = NEW.empleada_id
    AND fecha = NEW.fecha
    AND (
      (NEW.bloque_inicio, v_new_end_time) OVERLAPS 
      (hora_inicio, hora_fin)
    );
    
  IF conflict_count > 0 THEN
    RAISE EXCEPTION 'Horario bloqueado (Descanso/Comida) para la profesional seleccionada.';
  END IF;

  RETURN NEW;
END;
$function$
;

grant delete on table "public"."asistencia" to "anon";

grant insert on table "public"."asistencia" to "anon";

grant references on table "public"."asistencia" to "anon";

grant select on table "public"."asistencia" to "anon";

grant trigger on table "public"."asistencia" to "anon";

grant truncate on table "public"."asistencia" to "anon";

grant update on table "public"."asistencia" to "anon";

grant delete on table "public"."asistencia" to "authenticated";

grant insert on table "public"."asistencia" to "authenticated";

grant references on table "public"."asistencia" to "authenticated";

grant select on table "public"."asistencia" to "authenticated";

grant trigger on table "public"."asistencia" to "authenticated";

grant truncate on table "public"."asistencia" to "authenticated";

grant update on table "public"."asistencia" to "authenticated";

grant delete on table "public"."asistencia" to "service_role";

grant insert on table "public"."asistencia" to "service_role";

grant references on table "public"."asistencia" to "service_role";

grant select on table "public"."asistencia" to "service_role";

grant trigger on table "public"."asistencia" to "service_role";

grant truncate on table "public"."asistencia" to "service_role";

grant update on table "public"."asistencia" to "service_role";

grant delete on table "public"."bloqueos_agenda" to "anon";

grant insert on table "public"."bloqueos_agenda" to "anon";

grant references on table "public"."bloqueos_agenda" to "anon";

grant select on table "public"."bloqueos_agenda" to "anon";

grant trigger on table "public"."bloqueos_agenda" to "anon";

grant truncate on table "public"."bloqueos_agenda" to "anon";

grant update on table "public"."bloqueos_agenda" to "anon";

grant delete on table "public"."bloqueos_agenda" to "authenticated";

grant insert on table "public"."bloqueos_agenda" to "authenticated";

grant references on table "public"."bloqueos_agenda" to "authenticated";

grant select on table "public"."bloqueos_agenda" to "authenticated";

grant trigger on table "public"."bloqueos_agenda" to "authenticated";

grant truncate on table "public"."bloqueos_agenda" to "authenticated";

grant update on table "public"."bloqueos_agenda" to "authenticated";

grant delete on table "public"."bloqueos_agenda" to "service_role";

grant insert on table "public"."bloqueos_agenda" to "service_role";

grant references on table "public"."bloqueos_agenda" to "service_role";

grant select on table "public"."bloqueos_agenda" to "service_role";

grant trigger on table "public"."bloqueos_agenda" to "service_role";

grant truncate on table "public"."bloqueos_agenda" to "service_role";

grant update on table "public"."bloqueos_agenda" to "service_role";

grant delete on table "public"."cita_servicios" to "anon";

grant insert on table "public"."cita_servicios" to "anon";

grant references on table "public"."cita_servicios" to "anon";

grant select on table "public"."cita_servicios" to "anon";

grant trigger on table "public"."cita_servicios" to "anon";

grant truncate on table "public"."cita_servicios" to "anon";

grant update on table "public"."cita_servicios" to "anon";

grant delete on table "public"."cita_servicios" to "authenticated";

grant insert on table "public"."cita_servicios" to "authenticated";

grant references on table "public"."cita_servicios" to "authenticated";

grant select on table "public"."cita_servicios" to "authenticated";

grant trigger on table "public"."cita_servicios" to "authenticated";

grant truncate on table "public"."cita_servicios" to "authenticated";

grant update on table "public"."cita_servicios" to "authenticated";

grant delete on table "public"."cita_servicios" to "service_role";

grant insert on table "public"."cita_servicios" to "service_role";

grant references on table "public"."cita_servicios" to "service_role";

grant select on table "public"."cita_servicios" to "service_role";

grant trigger on table "public"."cita_servicios" to "service_role";

grant truncate on table "public"."cita_servicios" to "service_role";

grant update on table "public"."cita_servicios" to "service_role";

grant delete on table "public"."citas" to "anon";

grant insert on table "public"."citas" to "anon";

grant references on table "public"."citas" to "anon";

grant select on table "public"."citas" to "anon";

grant trigger on table "public"."citas" to "anon";

grant truncate on table "public"."citas" to "anon";

grant update on table "public"."citas" to "anon";

grant delete on table "public"."citas" to "authenticated";

grant insert on table "public"."citas" to "authenticated";

grant references on table "public"."citas" to "authenticated";

grant select on table "public"."citas" to "authenticated";

grant trigger on table "public"."citas" to "authenticated";

grant truncate on table "public"."citas" to "authenticated";

grant update on table "public"."citas" to "authenticated";

grant delete on table "public"."citas" to "service_role";

grant insert on table "public"."citas" to "service_role";

grant references on table "public"."citas" to "service_role";

grant select on table "public"."citas" to "service_role";

grant trigger on table "public"."citas" to "service_role";

grant truncate on table "public"."citas" to "service_role";

grant update on table "public"."citas" to "service_role";

grant delete on table "public"."clientes" to "anon";

grant insert on table "public"."clientes" to "anon";

grant references on table "public"."clientes" to "anon";

grant select on table "public"."clientes" to "anon";

grant trigger on table "public"."clientes" to "anon";

grant truncate on table "public"."clientes" to "anon";

grant update on table "public"."clientes" to "anon";

grant delete on table "public"."clientes" to "authenticated";

grant insert on table "public"."clientes" to "authenticated";

grant references on table "public"."clientes" to "authenticated";

grant select on table "public"."clientes" to "authenticated";

grant trigger on table "public"."clientes" to "authenticated";

grant truncate on table "public"."clientes" to "authenticated";

grant update on table "public"."clientes" to "authenticated";

grant delete on table "public"."clientes" to "service_role";

grant insert on table "public"."clientes" to "service_role";

grant references on table "public"."clientes" to "service_role";

grant select on table "public"."clientes" to "service_role";

grant trigger on table "public"."clientes" to "service_role";

grant truncate on table "public"."clientes" to "service_role";

grant update on table "public"."clientes" to "service_role";

grant delete on table "public"."documentos" to "anon";

grant insert on table "public"."documentos" to "anon";

grant references on table "public"."documentos" to "anon";

grant select on table "public"."documentos" to "anon";

grant trigger on table "public"."documentos" to "anon";

grant truncate on table "public"."documentos" to "anon";

grant update on table "public"."documentos" to "anon";

grant delete on table "public"."documentos" to "authenticated";

grant insert on table "public"."documentos" to "authenticated";

grant references on table "public"."documentos" to "authenticated";

grant select on table "public"."documentos" to "authenticated";

grant trigger on table "public"."documentos" to "authenticated";

grant truncate on table "public"."documentos" to "authenticated";

grant update on table "public"."documentos" to "authenticated";

grant delete on table "public"."documentos" to "service_role";

grant insert on table "public"."documentos" to "service_role";

grant references on table "public"."documentos" to "service_role";

grant select on table "public"."documentos" to "service_role";

grant trigger on table "public"."documentos" to "service_role";

grant truncate on table "public"."documentos" to "service_role";

grant update on table "public"."documentos" to "service_role";

grant delete on table "public"."evaluaciones_hoja" to "anon";

grant insert on table "public"."evaluaciones_hoja" to "anon";

grant references on table "public"."evaluaciones_hoja" to "anon";

grant select on table "public"."evaluaciones_hoja" to "anon";

grant trigger on table "public"."evaluaciones_hoja" to "anon";

grant truncate on table "public"."evaluaciones_hoja" to "anon";

grant update on table "public"."evaluaciones_hoja" to "anon";

grant delete on table "public"."evaluaciones_hoja" to "authenticated";

grant insert on table "public"."evaluaciones_hoja" to "authenticated";

grant references on table "public"."evaluaciones_hoja" to "authenticated";

grant select on table "public"."evaluaciones_hoja" to "authenticated";

grant trigger on table "public"."evaluaciones_hoja" to "authenticated";

grant truncate on table "public"."evaluaciones_hoja" to "authenticated";

grant update on table "public"."evaluaciones_hoja" to "authenticated";

grant delete on table "public"."evaluaciones_hoja" to "service_role";

grant insert on table "public"."evaluaciones_hoja" to "service_role";

grant references on table "public"."evaluaciones_hoja" to "service_role";

grant select on table "public"."evaluaciones_hoja" to "service_role";

grant trigger on table "public"."evaluaciones_hoja" to "service_role";

grant truncate on table "public"."evaluaciones_hoja" to "service_role";

grant update on table "public"."evaluaciones_hoja" to "service_role";

grant delete on table "public"."folios_ticket" to "anon";

grant insert on table "public"."folios_ticket" to "anon";

grant references on table "public"."folios_ticket" to "anon";

grant select on table "public"."folios_ticket" to "anon";

grant trigger on table "public"."folios_ticket" to "anon";

grant truncate on table "public"."folios_ticket" to "anon";

grant update on table "public"."folios_ticket" to "anon";

grant delete on table "public"."folios_ticket" to "authenticated";

grant insert on table "public"."folios_ticket" to "authenticated";

grant references on table "public"."folios_ticket" to "authenticated";

grant select on table "public"."folios_ticket" to "authenticated";

grant trigger on table "public"."folios_ticket" to "authenticated";

grant truncate on table "public"."folios_ticket" to "authenticated";

grant update on table "public"."folios_ticket" to "authenticated";

grant delete on table "public"."folios_ticket" to "service_role";

grant insert on table "public"."folios_ticket" to "service_role";

grant references on table "public"."folios_ticket" to "service_role";

grant select on table "public"."folios_ticket" to "service_role";

grant trigger on table "public"."folios_ticket" to "service_role";

grant truncate on table "public"."folios_ticket" to "service_role";

grant update on table "public"."folios_ticket" to "service_role";

grant delete on table "public"."marketing_campanas" to "anon";

grant insert on table "public"."marketing_campanas" to "anon";

grant references on table "public"."marketing_campanas" to "anon";

grant select on table "public"."marketing_campanas" to "anon";

grant trigger on table "public"."marketing_campanas" to "anon";

grant truncate on table "public"."marketing_campanas" to "anon";

grant update on table "public"."marketing_campanas" to "anon";

grant delete on table "public"."marketing_campanas" to "authenticated";

grant insert on table "public"."marketing_campanas" to "authenticated";

grant references on table "public"."marketing_campanas" to "authenticated";

grant select on table "public"."marketing_campanas" to "authenticated";

grant trigger on table "public"."marketing_campanas" to "authenticated";

grant truncate on table "public"."marketing_campanas" to "authenticated";

grant update on table "public"."marketing_campanas" to "authenticated";

grant delete on table "public"."marketing_campanas" to "service_role";

grant insert on table "public"."marketing_campanas" to "service_role";

grant references on table "public"."marketing_campanas" to "service_role";

grant select on table "public"."marketing_campanas" to "service_role";

grant trigger on table "public"."marketing_campanas" to "service_role";

grant truncate on table "public"."marketing_campanas" to "service_role";

grant update on table "public"."marketing_campanas" to "service_role";

grant delete on table "public"."marketing_configs" to "anon";

grant insert on table "public"."marketing_configs" to "anon";

grant references on table "public"."marketing_configs" to "anon";

grant select on table "public"."marketing_configs" to "anon";

grant trigger on table "public"."marketing_configs" to "anon";

grant truncate on table "public"."marketing_configs" to "anon";

grant update on table "public"."marketing_configs" to "anon";

grant delete on table "public"."marketing_configs" to "authenticated";

grant insert on table "public"."marketing_configs" to "authenticated";

grant references on table "public"."marketing_configs" to "authenticated";

grant select on table "public"."marketing_configs" to "authenticated";

grant trigger on table "public"."marketing_configs" to "authenticated";

grant truncate on table "public"."marketing_configs" to "authenticated";

grant update on table "public"."marketing_configs" to "authenticated";

grant delete on table "public"."marketing_configs" to "service_role";

grant insert on table "public"."marketing_configs" to "service_role";

grant references on table "public"."marketing_configs" to "service_role";

grant select on table "public"."marketing_configs" to "service_role";

grant trigger on table "public"."marketing_configs" to "service_role";

grant truncate on table "public"."marketing_configs" to "service_role";

grant update on table "public"."marketing_configs" to "service_role";

grant delete on table "public"."movimientos_caja" to "anon";

grant insert on table "public"."movimientos_caja" to "anon";

grant references on table "public"."movimientos_caja" to "anon";

grant select on table "public"."movimientos_caja" to "anon";

grant trigger on table "public"."movimientos_caja" to "anon";

grant truncate on table "public"."movimientos_caja" to "anon";

grant update on table "public"."movimientos_caja" to "anon";

grant delete on table "public"."movimientos_caja" to "authenticated";

grant insert on table "public"."movimientos_caja" to "authenticated";

grant references on table "public"."movimientos_caja" to "authenticated";

grant select on table "public"."movimientos_caja" to "authenticated";

grant trigger on table "public"."movimientos_caja" to "authenticated";

grant truncate on table "public"."movimientos_caja" to "authenticated";

grant update on table "public"."movimientos_caja" to "authenticated";

grant delete on table "public"."movimientos_caja" to "service_role";

grant insert on table "public"."movimientos_caja" to "service_role";

grant references on table "public"."movimientos_caja" to "service_role";

grant select on table "public"."movimientos_caja" to "service_role";

grant trigger on table "public"."movimientos_caja" to "service_role";

grant truncate on table "public"."movimientos_caja" to "service_role";

grant update on table "public"."movimientos_caja" to "service_role";

grant delete on table "public"."pagos" to "anon";

grant insert on table "public"."pagos" to "anon";

grant references on table "public"."pagos" to "anon";

grant select on table "public"."pagos" to "anon";

grant trigger on table "public"."pagos" to "anon";

grant truncate on table "public"."pagos" to "anon";

grant update on table "public"."pagos" to "anon";

grant delete on table "public"."pagos" to "authenticated";

grant insert on table "public"."pagos" to "authenticated";

grant references on table "public"."pagos" to "authenticated";

grant select on table "public"."pagos" to "authenticated";

grant trigger on table "public"."pagos" to "authenticated";

grant truncate on table "public"."pagos" to "authenticated";

grant update on table "public"."pagos" to "authenticated";

grant delete on table "public"."pagos" to "service_role";

grant insert on table "public"."pagos" to "service_role";

grant references on table "public"."pagos" to "service_role";

grant select on table "public"."pagos" to "service_role";

grant trigger on table "public"."pagos" to "service_role";

grant truncate on table "public"."pagos" to "service_role";

grant update on table "public"."pagos" to "service_role";

grant delete on table "public"."perfiles_empleadas" to "anon";

grant insert on table "public"."perfiles_empleadas" to "anon";

grant references on table "public"."perfiles_empleadas" to "anon";

grant select on table "public"."perfiles_empleadas" to "anon";

grant trigger on table "public"."perfiles_empleadas" to "anon";

grant truncate on table "public"."perfiles_empleadas" to "anon";

grant update on table "public"."perfiles_empleadas" to "anon";

grant delete on table "public"."perfiles_empleadas" to "authenticated";

grant insert on table "public"."perfiles_empleadas" to "authenticated";

grant references on table "public"."perfiles_empleadas" to "authenticated";

grant select on table "public"."perfiles_empleadas" to "authenticated";

grant trigger on table "public"."perfiles_empleadas" to "authenticated";

grant truncate on table "public"."perfiles_empleadas" to "authenticated";

grant update on table "public"."perfiles_empleadas" to "authenticated";

grant delete on table "public"."perfiles_empleadas" to "service_role";

grant insert on table "public"."perfiles_empleadas" to "service_role";

grant references on table "public"."perfiles_empleadas" to "service_role";

grant select on table "public"."perfiles_empleadas" to "service_role";

grant trigger on table "public"."perfiles_empleadas" to "service_role";

grant truncate on table "public"."perfiles_empleadas" to "service_role";

grant update on table "public"."perfiles_empleadas" to "service_role";

grant delete on table "public"."perfiles_usuario" to "anon";

grant insert on table "public"."perfiles_usuario" to "anon";

grant references on table "public"."perfiles_usuario" to "anon";

grant select on table "public"."perfiles_usuario" to "anon";

grant trigger on table "public"."perfiles_usuario" to "anon";

grant truncate on table "public"."perfiles_usuario" to "anon";

grant update on table "public"."perfiles_usuario" to "anon";

grant delete on table "public"."perfiles_usuario" to "authenticated";

grant insert on table "public"."perfiles_usuario" to "authenticated";

grant references on table "public"."perfiles_usuario" to "authenticated";

grant select on table "public"."perfiles_usuario" to "authenticated";

grant trigger on table "public"."perfiles_usuario" to "authenticated";

grant truncate on table "public"."perfiles_usuario" to "authenticated";

grant update on table "public"."perfiles_usuario" to "authenticated";

grant delete on table "public"."perfiles_usuario" to "service_role";

grant insert on table "public"."perfiles_usuario" to "service_role";

grant references on table "public"."perfiles_usuario" to "service_role";

grant select on table "public"."perfiles_usuario" to "service_role";

grant trigger on table "public"."perfiles_usuario" to "service_role";

grant truncate on table "public"."perfiles_usuario" to "service_role";

grant update on table "public"."perfiles_usuario" to "service_role";

grant delete on table "public"."productos" to "anon";

grant insert on table "public"."productos" to "anon";

grant references on table "public"."productos" to "anon";

grant select on table "public"."productos" to "anon";

grant trigger on table "public"."productos" to "anon";

grant truncate on table "public"."productos" to "anon";

grant update on table "public"."productos" to "anon";

grant delete on table "public"."productos" to "authenticated";

grant insert on table "public"."productos" to "authenticated";

grant references on table "public"."productos" to "authenticated";

grant select on table "public"."productos" to "authenticated";

grant trigger on table "public"."productos" to "authenticated";

grant truncate on table "public"."productos" to "authenticated";

grant update on table "public"."productos" to "authenticated";

grant delete on table "public"."productos" to "service_role";

grant insert on table "public"."productos" to "service_role";

grant references on table "public"."productos" to "service_role";

grant select on table "public"."productos" to "service_role";

grant trigger on table "public"."productos" to "service_role";

grant truncate on table "public"."productos" to "service_role";

grant update on table "public"."productos" to "service_role";

grant delete on table "public"."servicios" to "anon";

grant insert on table "public"."servicios" to "anon";

grant references on table "public"."servicios" to "anon";

grant select on table "public"."servicios" to "anon";

grant trigger on table "public"."servicios" to "anon";

grant truncate on table "public"."servicios" to "anon";

grant update on table "public"."servicios" to "anon";

grant delete on table "public"."servicios" to "authenticated";

grant insert on table "public"."servicios" to "authenticated";

grant references on table "public"."servicios" to "authenticated";

grant select on table "public"."servicios" to "authenticated";

grant trigger on table "public"."servicios" to "authenticated";

grant truncate on table "public"."servicios" to "authenticated";

grant update on table "public"."servicios" to "authenticated";

grant delete on table "public"."servicios" to "service_role";

grant insert on table "public"."servicios" to "service_role";

grant references on table "public"."servicios" to "service_role";

grant select on table "public"."servicios" to "service_role";

grant trigger on table "public"."servicios" to "service_role";

grant truncate on table "public"."servicios" to "service_role";

grant update on table "public"."servicios" to "service_role";

grant delete on table "public"."sucursales" to "anon";

grant insert on table "public"."sucursales" to "anon";

grant references on table "public"."sucursales" to "anon";

grant select on table "public"."sucursales" to "anon";

grant trigger on table "public"."sucursales" to "anon";

grant truncate on table "public"."sucursales" to "anon";

grant update on table "public"."sucursales" to "anon";

grant delete on table "public"."sucursales" to "authenticated";

grant insert on table "public"."sucursales" to "authenticated";

grant references on table "public"."sucursales" to "authenticated";

grant select on table "public"."sucursales" to "authenticated";

grant trigger on table "public"."sucursales" to "authenticated";

grant truncate on table "public"."sucursales" to "authenticated";

grant update on table "public"."sucursales" to "authenticated";

grant delete on table "public"."sucursales" to "service_role";

grant insert on table "public"."sucursales" to "service_role";

grant references on table "public"."sucursales" to "service_role";

grant select on table "public"."sucursales" to "service_role";

grant trigger on table "public"."sucursales" to "service_role";

grant truncate on table "public"."sucursales" to "service_role";

grant update on table "public"."sucursales" to "service_role";

grant delete on table "public"."ticket_items" to "anon";

grant insert on table "public"."ticket_items" to "anon";

grant references on table "public"."ticket_items" to "anon";

grant select on table "public"."ticket_items" to "anon";

grant trigger on table "public"."ticket_items" to "anon";

grant truncate on table "public"."ticket_items" to "anon";

grant update on table "public"."ticket_items" to "anon";

grant delete on table "public"."ticket_items" to "authenticated";

grant insert on table "public"."ticket_items" to "authenticated";

grant references on table "public"."ticket_items" to "authenticated";

grant select on table "public"."ticket_items" to "authenticated";

grant trigger on table "public"."ticket_items" to "authenticated";

grant truncate on table "public"."ticket_items" to "authenticated";

grant update on table "public"."ticket_items" to "authenticated";

grant delete on table "public"."ticket_items" to "service_role";

grant insert on table "public"."ticket_items" to "service_role";

grant references on table "public"."ticket_items" to "service_role";

grant select on table "public"."ticket_items" to "service_role";

grant trigger on table "public"."ticket_items" to "service_role";

grant truncate on table "public"."ticket_items" to "service_role";

grant update on table "public"."ticket_items" to "service_role";

grant delete on table "public"."tickets" to "anon";

grant insert on table "public"."tickets" to "anon";

grant references on table "public"."tickets" to "anon";

grant select on table "public"."tickets" to "anon";

grant trigger on table "public"."tickets" to "anon";

grant truncate on table "public"."tickets" to "anon";

grant update on table "public"."tickets" to "anon";

grant delete on table "public"."tickets" to "authenticated";

grant insert on table "public"."tickets" to "authenticated";

grant references on table "public"."tickets" to "authenticated";

grant select on table "public"."tickets" to "authenticated";

grant trigger on table "public"."tickets" to "authenticated";

grant truncate on table "public"."tickets" to "authenticated";

grant update on table "public"."tickets" to "authenticated";

grant delete on table "public"."tickets" to "service_role";

grant insert on table "public"."tickets" to "service_role";

grant references on table "public"."tickets" to "service_role";

grant select on table "public"."tickets" to "service_role";

grant trigger on table "public"."tickets" to "service_role";

grant truncate on table "public"."tickets" to "service_role";

grant update on table "public"."tickets" to "service_role";

grant delete on table "public"."turnos_caja" to "anon";

grant insert on table "public"."turnos_caja" to "anon";

grant references on table "public"."turnos_caja" to "anon";

grant select on table "public"."turnos_caja" to "anon";

grant trigger on table "public"."turnos_caja" to "anon";

grant truncate on table "public"."turnos_caja" to "anon";

grant update on table "public"."turnos_caja" to "anon";

grant delete on table "public"."turnos_caja" to "authenticated";

grant insert on table "public"."turnos_caja" to "authenticated";

grant references on table "public"."turnos_caja" to "authenticated";

grant select on table "public"."turnos_caja" to "authenticated";

grant trigger on table "public"."turnos_caja" to "authenticated";

grant truncate on table "public"."turnos_caja" to "authenticated";

grant update on table "public"."turnos_caja" to "authenticated";

grant delete on table "public"."turnos_caja" to "service_role";

grant insert on table "public"."turnos_caja" to "service_role";

grant references on table "public"."turnos_caja" to "service_role";

grant select on table "public"."turnos_caja" to "service_role";

grant trigger on table "public"."turnos_caja" to "service_role";

grant truncate on table "public"."turnos_caja" to "service_role";

grant update on table "public"."turnos_caja" to "service_role";


  create policy "Autenticados pueden registrar asistencia"
  on "public"."asistencia"
  as permissive
  for insert
  to public
with check ((auth.role() = 'authenticated'::text));



  create policy "Autenticados pueden ver asistencia"
  on "public"."asistencia"
  as permissive
  for select
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "Allow all"
  on "public"."bloqueos_agenda"
  as permissive
  for all
  to anon
using (true)
with check (true);



  create policy "Permitir todo a anon"
  on "public"."bloqueos_agenda"
  as permissive
  for all
  to anon
using (true)
with check (true);



  create policy "Permitir todo a usuarios autenticados"
  on "public"."bloqueos_agenda"
  as permissive
  for all
  to authenticated
using (true)
with check (true);



  create policy "Allow all"
  on "public"."cita_servicios"
  as permissive
  for all
  to anon
using (true)
with check (true);



  create policy "Permitir todo a anon"
  on "public"."cita_servicios"
  as permissive
  for all
  to anon
using (true)
with check (true);



  create policy "Permitir todo a usuarios autenticados"
  on "public"."cita_servicios"
  as permissive
  for all
  to authenticated
using (true)
with check (true);



  create policy "Allow all"
  on "public"."citas"
  as permissive
  for all
  to anon
using (true)
with check (true);



  create policy "Permitir todo a anon"
  on "public"."citas"
  as permissive
  for all
  to anon
using (true)
with check (true);



  create policy "Permitir todo a usuarios autenticados"
  on "public"."citas"
  as permissive
  for all
  to authenticated
using (true)
with check (true);



  create policy "Allow all"
  on "public"."clientes"
  as permissive
  for all
  to anon
using (true)
with check (true);



  create policy "Permitir todo a anon"
  on "public"."clientes"
  as permissive
  for all
  to anon
using (true)
with check (true);



  create policy "Permitir todo a usuarios autenticados"
  on "public"."clientes"
  as permissive
  for all
  to authenticated
using (true)
with check (true);



  create policy "Permitir eliminar documentos"
  on "public"."documentos"
  as permissive
  for delete
  to public
using (true);



  create policy "Permitir insertar documentos"
  on "public"."documentos"
  as permissive
  for insert
  to public
with check (true);



  create policy "Permitir lectura de documentos"
  on "public"."documentos"
  as permissive
  for select
  to public
using (true);



  create policy "Permitir todo a anon"
  on "public"."documentos"
  as permissive
  for all
  to anon
using (true)
with check (true);



  create policy "Permitir todo a usuarios autenticados"
  on "public"."documentos"
  as permissive
  for all
  to authenticated
using (true)
with check (true);



  create policy "Allow all"
  on "public"."evaluaciones_hoja"
  as permissive
  for all
  to anon
using (true)
with check (true);



  create policy "Permitir todo a anon"
  on "public"."evaluaciones_hoja"
  as permissive
  for all
  to anon
using (true)
with check (true);



  create policy "Permitir todo a usuarios autenticados"
  on "public"."evaluaciones_hoja"
  as permissive
  for all
  to authenticated
using (true)
with check (true);



  create policy "Permitir todo a anon"
  on "public"."folios_ticket"
  as permissive
  for all
  to anon
using (true)
with check (true);



  create policy "Permitir todo a usuarios autenticados"
  on "public"."folios_ticket"
  as permissive
  for all
  to authenticated
using (true)
with check (true);



  create policy "Autenticados pueden ver marketing_campanas"
  on "public"."marketing_campanas"
  as permissive
  for all
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "Autenticados pueden ver marketing_configs"
  on "public"."marketing_configs"
  as permissive
  for all
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "Permitir todo a anon"
  on "public"."movimientos_caja"
  as permissive
  for all
  to anon
using (true)
with check (true);



  create policy "Permitir todo a usuarios autenticados"
  on "public"."movimientos_caja"
  as permissive
  for all
  to authenticated
using (true)
with check (true);



  create policy "Allow all"
  on "public"."pagos"
  as permissive
  for all
  to anon
using (true)
with check (true);



  create policy "Permitir todo a anon"
  on "public"."pagos"
  as permissive
  for all
  to anon
using (true)
with check (true);



  create policy "Permitir todo a usuarios autenticados"
  on "public"."pagos"
  as permissive
  for all
  to authenticated
using (true)
with check (true);



  create policy "Allow all"
  on "public"."perfiles_empleadas"
  as permissive
  for all
  to anon
using (true)
with check (true);



  create policy "Permitir todo a anon"
  on "public"."perfiles_empleadas"
  as permissive
  for all
  to anon
using (true)
with check (true);



  create policy "Permitir todo a usuarios autenticados"
  on "public"."perfiles_empleadas"
  as permissive
  for all
  to authenticated
using (true)
with check (true);



  create policy "Editar propio perfil"
  on "public"."perfiles_usuario"
  as permissive
  for update
  to authenticated
using ((auth.uid() = id));



  create policy "Permitir todo a usuarios autenticados"
  on "public"."perfiles_usuario"
  as permissive
  for all
  to authenticated
using (true)
with check (true);



  create policy "Ver propio perfil"
  on "public"."perfiles_usuario"
  as permissive
  for select
  to authenticated
using ((auth.uid() = id));



  create policy "Allow all"
  on "public"."productos"
  as permissive
  for all
  to anon
using (true)
with check (true);



  create policy "Permitir todo a anon"
  on "public"."productos"
  as permissive
  for all
  to anon
using (true)
with check (true);



  create policy "Permitir todo a usuarios autenticados"
  on "public"."productos"
  as permissive
  for all
  to authenticated
using (true)
with check (true);



  create policy "Allow all"
  on "public"."servicios"
  as permissive
  for all
  to anon
using (true)
with check (true);



  create policy "Permitir todo a anon"
  on "public"."servicios"
  as permissive
  for all
  to anon
using (true)
with check (true);



  create policy "Permitir todo a usuarios autenticados"
  on "public"."servicios"
  as permissive
  for all
  to authenticated
using (true)
with check (true);



  create policy "Allow all"
  on "public"."sucursales"
  as permissive
  for all
  to anon
using (true)
with check (true);



  create policy "Permitir todo a anon"
  on "public"."sucursales"
  as permissive
  for all
  to anon
using (true)
with check (true);



  create policy "Permitir todo a usuarios autenticados"
  on "public"."sucursales"
  as permissive
  for all
  to authenticated
using (true)
with check (true);



  create policy "Allow all"
  on "public"."ticket_items"
  as permissive
  for all
  to anon
using (true)
with check (true);



  create policy "Permitir todo a anon"
  on "public"."ticket_items"
  as permissive
  for all
  to anon
using (true)
with check (true);



  create policy "Permitir todo a usuarios autenticados"
  on "public"."ticket_items"
  as permissive
  for all
  to authenticated
using (true)
with check (true);



  create policy "Allow all"
  on "public"."tickets"
  as permissive
  for all
  to anon
using (true)
with check (true);



  create policy "Permitir todo a anon"
  on "public"."tickets"
  as permissive
  for all
  to anon
using (true)
with check (true);



  create policy "Permitir todo a usuarios autenticados"
  on "public"."tickets"
  as permissive
  for all
  to authenticated
using (true)
with check (true);



  create policy "Permitir todo a anon"
  on "public"."turnos_caja"
  as permissive
  for all
  to anon
using (true)
with check (true);



  create policy "Permitir todo a usuarios autenticados"
  on "public"."turnos_caja"
  as permissive
  for all
  to authenticated
using (true)
with check (true);


CREATE TRIGGER trg_validar_disponibilidad_cita BEFORE INSERT OR UPDATE ON public.citas FOR EACH ROW EXECUTE FUNCTION public.validar_disponibilidad_cita();


