create extension if not exists "pg_cron" with schema "pg_catalog";

drop extension if exists "pg_net";

create type "public"."tipo_asistencia" as enum ('Entrada', 'Salida Comida', 'Regreso Comida', 'Salida');

alter table "public"."asistencia" add column "tipo" public.tipo_asistencia not null default 'Entrada'::public.tipo_asistencia;

CREATE UNIQUE INDEX clientes_email_key ON public.clientes USING btree (email);

CREATE UNIQUE INDEX clientes_telefono_cel_key ON public.clientes USING btree (telefono_cel);

alter table "public"."clientes" add constraint "clientes_email_key" UNIQUE using index "clientes_email_key";

alter table "public"."clientes" add constraint "clientes_telefono_cel_key" UNIQUE using index "clientes_telefono_cel_key";

set check_function_bodies = off;

create materialized view "public"."mv_asistencias_diarias" as  SELECT ((a.created_at AT TIME ZONE 'America/Mexico_City'::text))::date AS fecha,
    a.empleada_id,
    a.sucursal_id,
    pe.sueldo_diario
   FROM (public.asistencia a
     LEFT JOIN public.perfiles_empleadas pe ON ((pe.id = a.empleada_id)))
  GROUP BY (((a.created_at AT TIME ZONE 'America/Mexico_City'::text))::date), a.empleada_id, a.sucursal_id, pe.sueldo_diario;


create materialized view "public"."mv_pagos_diarios" as  SELECT p.fecha,
    t.sucursal_id,
    (p.metodo_pago)::text AS metodo_pago,
    count(*) AS cantidad,
    sum(p.importe) AS total
   FROM (public.pagos p
     JOIN public.tickets t ON ((t.id = p.ticket_id)))
  GROUP BY p.fecha, t.sucursal_id, (p.metodo_pago)::text;


create materialized view "public"."mv_servicios_familia_diarios" as  SELECT t.fecha,
    t.sucursal_id,
    COALESCE(sv.familia, 'Otros'::text) AS familia,
    count(*) AS cantidad
   FROM ((public.ticket_items ti
     JOIN public.tickets t ON (((t.id = ti.ticket_id) AND (t.estado = 'Pagado'::public.ticket_status))))
     LEFT JOIN public.servicios sv ON ((sv.nombre = ti.nombre)))
  WHERE (ti.tipo = 'Servicio'::public.item_tipo)
  GROUP BY t.fecha, t.sucursal_id, COALESCE(sv.familia, 'Otros'::text);


create materialized view "public"."mv_tickets_diarios" as  SELECT t.id AS ticket_id,
    t.fecha,
    t.total,
    t.sucursal_id,
    s.nombre AS sucursal_nombre,
    t.vendedor_id,
    pe.nombre AS vendedor_nombre,
    pe.sueldo_diario
   FROM ((public.tickets t
     LEFT JOIN public.sucursales s ON ((s.id = t.sucursal_id)))
     LEFT JOIN public.perfiles_empleadas pe ON ((pe.id = t.vendedor_id)))
  WHERE (t.estado = 'Pagado'::public.ticket_status);


create materialized view "public"."mv_ventas_empleado_diarias" as  SELECT t.fecha,
    ti.vendedor_id,
    pe.nombre AS vendedor_nombre,
    t.sucursal_id,
    s.nombre AS sucursal_nombre,
    sum(ti.total) AS total_ventas
   FROM (((public.ticket_items ti
     JOIN public.tickets t ON (((t.id = ti.ticket_id) AND (t.estado = 'Pagado'::public.ticket_status))))
     LEFT JOIN public.perfiles_empleadas pe ON ((pe.id = ti.vendedor_id)))
     LEFT JOIN public.sucursales s ON ((s.id = t.sucursal_id)))
  WHERE (ti.vendedor_id IS NOT NULL)
  GROUP BY t.fecha, ti.vendedor_id, pe.nombre, t.sucursal_id, s.nombre;


CREATE OR REPLACE FUNCTION public.refresh_dashboard_views()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- mv_tickets_diarios tiene unique index → puede usar CONCURRENTLY (no bloquea)
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_tickets_diarios;
  -- Las demás no tienen unique index → refresh normal (bloqueo brevísimo ~ms)
  REFRESH MATERIALIZED VIEW mv_ventas_empleado_diarias;
  REFRESH MATERIALIZED VIEW mv_asistencias_diarias;
  REFRESH MATERIALIZED VIEW mv_servicios_familia_diarios;
  REFRESH MATERIALIZED VIEW mv_pagos_diarios;
  RAISE NOTICE 'Dashboard views refreshed at %', NOW();
END;
$function$
;

CREATE INDEX mv_asistencias_diarias_empleada_id_fecha_idx ON public.mv_asistencias_diarias USING btree (empleada_id, fecha);

CREATE INDEX mv_asistencias_diarias_fecha_idx ON public.mv_asistencias_diarias USING btree (fecha);

CREATE INDEX mv_asistencias_diarias_sucursal_id_fecha_idx ON public.mv_asistencias_diarias USING btree (sucursal_id, fecha);

CREATE INDEX mv_pagos_diarios_fecha_idx ON public.mv_pagos_diarios USING btree (fecha);

CREATE INDEX mv_pagos_diarios_sucursal_id_fecha_idx ON public.mv_pagos_diarios USING btree (sucursal_id, fecha);

CREATE INDEX mv_servicios_familia_diarios_fecha_idx ON public.mv_servicios_familia_diarios USING btree (fecha);

CREATE INDEX mv_servicios_familia_diarios_sucursal_id_fecha_idx ON public.mv_servicios_familia_diarios USING btree (sucursal_id, fecha);

CREATE INDEX mv_tickets_diarios_fecha_idx ON public.mv_tickets_diarios USING btree (fecha);

CREATE INDEX mv_tickets_diarios_sucursal_id_fecha_idx ON public.mv_tickets_diarios USING btree (sucursal_id, fecha);

CREATE UNIQUE INDEX mv_tickets_diarios_ticket_id_idx ON public.mv_tickets_diarios USING btree (ticket_id);

CREATE INDEX mv_tickets_diarios_vendedor_id_fecha_idx ON public.mv_tickets_diarios USING btree (vendedor_id, fecha);

CREATE INDEX mv_ventas_empleado_diarias_fecha_idx ON public.mv_ventas_empleado_diarias USING btree (fecha);

CREATE INDEX mv_ventas_empleado_diarias_sucursal_id_fecha_idx ON public.mv_ventas_empleado_diarias USING btree (sucursal_id, fecha);

CREATE INDEX mv_ventas_empleado_diarias_vendedor_id_fecha_idx ON public.mv_ventas_empleado_diarias USING btree (vendedor_id, fecha);

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


  create policy "documentos_policy 1kte7wp_0"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'documentos_empresa'::text));



  create policy "documentos_policy 1kte7wp_1"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check ((bucket_id = 'documentos_empresa'::text));



  create policy "documentos_policy 1kte7wp_2"
  on "storage"."objects"
  as permissive
  for update
  to public
using ((bucket_id = 'documentos_empresa'::text));



  create policy "documentos_policy 1kte7wp_3"
  on "storage"."objects"
  as permissive
  for delete
  to public
using ((bucket_id = 'documentos_empresa'::text));



