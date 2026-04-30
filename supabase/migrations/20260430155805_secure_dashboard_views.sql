-- ============================================================================
-- MIGRACIÓN: ASEGURAR VISTAS MATERIALIZADAS (DASHBOARD)
-- Propósito: Mover los datos pesados a un esquema privado y crear capas
-- de acceso seguras (vistas con filtrado por RLS lógico).
-- ============================================================================

-- 1. Crear esquema privado si no existe
CREATE SCHEMA IF NOT EXISTS private;

-- 2. Mover vistas actuales al esquema privado
-- Nota: Si no existen, el script seguirá adelante (DROP IF EXISTS ya se usó en el pasado)

-- 2.1 TICKETS
DROP MATERIALIZED VIEW IF EXISTS public.mv_tickets_diarios CASCADE;
-- ALTER MATERIALIZED VIEW IF EXISTS public.mv_tickets_diarios SET SCHEMA private; -- No necesario si dropeamos y recreamos

-- 2.2 VENTAS
DROP MATERIALIZED VIEW IF EXISTS public.mv_ventas_empleado_diarias CASCADE;

-- 2.3 ASISTENCIAS
DROP MATERIALIZED VIEW IF EXISTS public.mv_asistencias_diarias CASCADE;

-- 2.4 SERVICIOS
DROP MATERIALIZED VIEW IF EXISTS public.mv_servicios_familia_diarios CASCADE;

-- 2.5 PAGOS
DROP MATERIALIZED VIEW IF EXISTS public.mv_pagos_diarios CASCADE;


-- 2.6 Recrear las vistas materializadas en el esquema PRIVADO
-- (Esto asegura que existan ahí con su definición correcta)

CREATE MATERIALIZED VIEW private.mv_tickets_diarios AS
SELECT 
  t.id            AS ticket_id,
  t.fecha,
  t.total,
  t.sucursal_id,
  s.nombre        AS sucursal_nombre,
  t.vendedor_id,
  pe.nombre       AS vendedor_nombre,
  pe.sueldo_diario
FROM public.tickets t
LEFT JOIN public.sucursales s ON s.id = t.sucursal_id
LEFT JOIN public.perfiles_empleadas pe ON pe.id = t.vendedor_id
WHERE t.estado = 'Pagado';

CREATE UNIQUE INDEX ON private.mv_tickets_diarios(ticket_id);
CREATE INDEX ON private.mv_tickets_diarios(fecha);
CREATE INDEX ON private.mv_tickets_diarios(sucursal_id, fecha);

CREATE MATERIALIZED VIEW private.mv_ventas_empleado_diarias AS
SELECT 
  t.fecha,
  ti.vendedor_id,
  pe.nombre       AS vendedor_nombre,
  t.sucursal_id,
  s.nombre        AS sucursal_nombre,
  SUM(ti.total)   AS total_ventas
FROM public.ticket_items ti
JOIN public.tickets t ON t.id = ti.ticket_id AND t.estado = 'Pagado'
LEFT JOIN public.perfiles_empleadas pe ON pe.id = ti.vendedor_id
LEFT JOIN public.sucursales s ON s.id = t.sucursal_id
WHERE ti.vendedor_id IS NOT NULL
GROUP BY t.fecha, ti.vendedor_id, pe.nombre, t.sucursal_id, s.nombre;

CREATE INDEX ON private.mv_ventas_empleado_diarias(fecha);
CREATE INDEX ON private.mv_ventas_empleado_diarias(sucursal_id, fecha);

CREATE MATERIALIZED VIEW private.mv_asistencias_diarias AS
SELECT 
  (created_at AT TIME ZONE 'America/Mexico_City')::date AS fecha,
  a.empleada_id,
  a.sucursal_id,
  pe.sueldo_diario
FROM public.asistencia a
LEFT JOIN public.perfiles_empleadas pe ON pe.id = a.empleada_id
GROUP BY 
  (created_at AT TIME ZONE 'America/Mexico_City')::date,
  a.empleada_id,
  a.sucursal_id,
  pe.sueldo_diario;

CREATE INDEX ON private.mv_asistencias_diarias(fecha);

CREATE MATERIALIZED VIEW private.mv_servicios_familia_diarios AS
SELECT 
  t.fecha,
  t.sucursal_id,
  COALESCE(sv.familia, 'Otros') AS familia,
  COUNT(*)                       AS cantidad
FROM public.ticket_items ti
JOIN public.tickets t ON t.id = ti.ticket_id AND t.estado = 'Pagado'
LEFT JOIN public.servicios sv ON sv.nombre = ti.nombre
WHERE ti.tipo = 'Servicio'
GROUP BY t.fecha, t.sucursal_id, COALESCE(sv.familia, 'Otros');

CREATE INDEX ON private.mv_servicios_familia_diarios(fecha);

CREATE MATERIALIZED VIEW private.mv_pagos_diarios AS
SELECT 
  p.fecha,
  t.sucursal_id,
  p.metodo_pago::text  AS metodo_pago,
  COUNT(*)             AS cantidad,
  SUM(p.importe)       AS total
FROM public.pagos p
JOIN public.tickets t ON t.id = p.ticket_id
GROUP BY p.fecha, t.sucursal_id, p.metodo_pago::text;

CREATE INDEX ON private.mv_pagos_diarios(fecha);


-- 3. Crear VISTAS SEGURAS en public (Actuarán como "mostrador" con RLS manual)
-- Estas vistas corren con permisos del creador (postgres) para acceder al esquema private,
-- pero filtran los datos según quién sea el usuario logueado.

-- 3.1 TICKETS
CREATE OR REPLACE VIEW public.mv_tickets_diarios AS
SELECT * FROM private.mv_tickets_diarios
WHERE (
  (SELECT rol FROM public.perfiles_usuario WHERE id = auth.uid()) IN ('admin', 'superadmin')
  OR sucursal_id = ANY (SELECT sucursal_id FROM public.perfiles_empleadas WHERE id = auth.uid())
);

-- 3.2 VENTAS
CREATE OR REPLACE VIEW public.mv_ventas_empleado_diarias AS
SELECT * FROM private.mv_ventas_empleado_diarias
WHERE (
  (SELECT rol FROM public.perfiles_usuario WHERE id = auth.uid()) IN ('admin', 'superadmin')
  OR sucursal_id = ANY (SELECT sucursal_id FROM public.perfiles_empleadas WHERE id = auth.uid())
);

-- 3.3 ASISTENCIAS
CREATE OR REPLACE VIEW public.mv_asistencias_diarias AS
SELECT * FROM private.mv_asistencias_diarias
WHERE (
  (SELECT rol FROM public.perfiles_usuario WHERE id = auth.uid()) IN ('admin', 'superadmin')
  OR sucursal_id = ANY (SELECT sucursal_id FROM public.perfiles_empleadas WHERE id = auth.uid())
);

-- 3.4 SERVICIOS
CREATE OR REPLACE VIEW public.mv_servicios_familia_diarios AS
SELECT * FROM private.mv_servicios_familia_diarios
WHERE (
  (SELECT rol FROM public.perfiles_usuario WHERE id = auth.uid()) IN ('admin', 'superadmin')
  OR sucursal_id = ANY (SELECT sucursal_id FROM public.perfiles_empleadas WHERE id = auth.uid())
);

-- 3.5 PAGOS
CREATE OR REPLACE VIEW public.mv_pagos_diarios AS
SELECT * FROM private.mv_pagos_diarios
WHERE (
  (SELECT rol FROM public.perfiles_usuario WHERE id = auth.uid()) IN ('admin', 'superadmin')
  OR sucursal_id = ANY (SELECT sucursal_id FROM public.perfiles_empleadas WHERE id = auth.uid())
);

-- 4. Dar permisos de lectura a los usuarios autenticados sobre las vistas públicas
GRANT SELECT ON public.mv_tickets_diarios TO authenticated;
GRANT SELECT ON public.mv_ventas_empleado_diarias TO authenticated;
GRANT SELECT ON public.mv_asistencias_diarias TO authenticated;
GRANT SELECT ON public.mv_servicios_familia_diarios TO authenticated;
GRANT SELECT ON public.mv_pagos_diarios TO authenticated;

-- 5. Revocar cualquier acceso directo al esquema privado (solo para estar seguros)
REVOKE ALL ON SCHEMA private FROM anon, authenticated;


-- 6. Actualizar la función de refresco
-- Ahora debe apuntar a private.mv_...
CREATE OR REPLACE FUNCTION public.refresh_dashboard_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY private.mv_tickets_diarios;
  REFRESH MATERIALIZED VIEW private.mv_ventas_empleado_diarias;
  REFRESH MATERIALIZED VIEW private.mv_asistencias_diarias;
  REFRESH MATERIALIZED VIEW private.mv_servicios_familia_diarios;
  REFRESH MATERIALIZED VIEW private.mv_pagos_diarios;
  RAISE NOTICE 'Dashboard views refreshed at %', NOW();
END;
$$;
