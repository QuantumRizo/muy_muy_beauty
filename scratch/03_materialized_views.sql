-- ============================================================================
-- SCRIPT 3: MATERIALIZED VIEWS PARA DASHBOARD
-- Ejecutar en Supabase SQL Editor
-- Requiere privilegios de superuser (service_role está bien en Supabase)
-- ============================================================================
-- PROPÓSITO:
-- En lugar de que la app haga JOINs pesados en cada request, PostgreSQL
-- pre-calcula y guarda los resultados. La app solo hace un SELECT simple
-- con WHERE fecha BETWEEN. Costo: ms en vez de segundos.
-- ============================================================================

-- 1. TICKETS DIARIOS (reemplaza el JOIN tickets+sucursales+empleadas en A.3 y A.8)
-- Mapea cada ticket pagado con sus datos de sucursal y vendedor, ya resueltos.
-- ─────────────────────────────────────────────────────────────────────────────
DROP MATERIALIZED VIEW IF EXISTS mv_tickets_diarios CASCADE;
CREATE MATERIALIZED VIEW mv_tickets_diarios AS
SELECT 
  t.id            AS ticket_id,
  t.fecha,
  t.total,
  t.sucursal_id,
  s.nombre        AS sucursal_nombre,
  t.vendedor_id,
  pe.nombre       AS vendedor_nombre,
  pe.sueldo_diario
FROM tickets t
LEFT JOIN sucursales s ON s.id = t.sucursal_id
LEFT JOIN perfiles_empleadas pe ON pe.id = t.vendedor_id
WHERE t.estado = 'Pagado';

-- Índice único (necesario para REFRESH CONCURRENTLY en el futuro)
CREATE UNIQUE INDEX ON mv_tickets_diarios(ticket_id);
-- Índices de búsqueda
CREATE INDEX ON mv_tickets_diarios(fecha);
CREATE INDEX ON mv_tickets_diarios(sucursal_id, fecha);
CREATE INDEX ON mv_tickets_diarios(vendedor_id, fecha);


-- 2. VENTAS POR EMPLEADO POR DÍA (para cálculo de comisiones en A.3 y A.8)
-- Agrupa los ticket_items ya resueltos con el nombre del vendedor y sucursal.
-- ─────────────────────────────────────────────────────────────────────────────
DROP MATERIALIZED VIEW IF EXISTS mv_ventas_empleado_diarias CASCADE;
CREATE MATERIALIZED VIEW mv_ventas_empleado_diarias AS
SELECT 
  t.fecha,
  ti.vendedor_id,
  pe.nombre       AS vendedor_nombre,
  t.sucursal_id,
  s.nombre        AS sucursal_nombre,
  SUM(ti.total)   AS total_ventas
FROM ticket_items ti
JOIN tickets t ON t.id = ti.ticket_id AND t.estado = 'Pagado'
LEFT JOIN perfiles_empleadas pe ON pe.id = ti.vendedor_id
LEFT JOIN sucursales s ON s.id = t.sucursal_id
WHERE ti.vendedor_id IS NOT NULL
GROUP BY t.fecha, ti.vendedor_id, pe.nombre, t.sucursal_id, s.nombre;

CREATE INDEX ON mv_ventas_empleado_diarias(fecha);
CREATE INDEX ON mv_ventas_empleado_diarias(sucursal_id, fecha);
CREATE INDEX ON mv_ventas_empleado_diarias(vendedor_id, fecha);


-- 3. ASISTENCIAS DEDUPLICADAS POR DÍA (para cálculo de sueldos)
-- Una fila por empleada por sucursal por día (sin duplicados por múltiples 
-- registros de check-in). Ya incluye el sueldo_diario.
-- ─────────────────────────────────────────────────────────────────────────────
DROP MATERIALIZED VIEW IF EXISTS mv_asistencias_diarias CASCADE;
CREATE MATERIALIZED VIEW mv_asistencias_diarias AS
SELECT 
  (created_at AT TIME ZONE 'America/Mexico_City')::date AS fecha,
  a.empleada_id,
  a.sucursal_id,
  pe.sueldo_diario
FROM asistencia a
LEFT JOIN perfiles_empleadas pe ON pe.id = a.empleada_id
GROUP BY 
  (created_at AT TIME ZONE 'America/Mexico_City')::date,
  a.empleada_id,
  a.sucursal_id,
  pe.sueldo_diario;

CREATE INDEX ON mv_asistencias_diarias(fecha);
CREATE INDEX ON mv_asistencias_diarias(sucursal_id, fecha);
CREATE INDEX ON mv_asistencias_diarias(empleada_id, fecha);


-- 4. SERVICIOS POR FAMILIA POR DÍA (reemplaza A.9 por completo)
-- Ya resuelve el JOIN ticket_items+servicios y agrupa por familia.
-- ─────────────────────────────────────────────────────────────────────────────
DROP MATERIALIZED VIEW IF EXISTS mv_servicios_familia_diarios CASCADE;
CREATE MATERIALIZED VIEW mv_servicios_familia_diarios AS
SELECT 
  t.fecha,
  t.sucursal_id,
  COALESCE(sv.familia, 'Otros') AS familia,
  COUNT(*)                       AS cantidad
FROM ticket_items ti
JOIN tickets t ON t.id = ti.ticket_id AND t.estado = 'Pagado'
LEFT JOIN servicios sv ON sv.nombre = ti.nombre
WHERE ti.tipo = 'Servicio'
GROUP BY t.fecha, t.sucursal_id, COALESCE(sv.familia, 'Otros');

CREATE INDEX ON mv_servicios_familia_diarios(fecha);
CREATE INDEX ON mv_servicios_familia_diarios(sucursal_id, fecha);


-- 5. PAGOS POR MÉTODO POR DÍA (reemplaza 4.12.1)
-- Pre-agrupa los pagos por método y sucursal. 
-- ─────────────────────────────────────────────────────────────────────────────
DROP MATERIALIZED VIEW IF EXISTS mv_pagos_diarios CASCADE;
CREATE MATERIALIZED VIEW mv_pagos_diarios AS
SELECT 
  p.fecha,
  t.sucursal_id,
  p.metodo_pago::text  AS metodo_pago,
  COUNT(*)             AS cantidad,
  SUM(p.importe)       AS total
FROM pagos p
JOIN tickets t ON t.id = p.ticket_id
GROUP BY p.fecha, t.sucursal_id, p.metodo_pago::text;

CREATE INDEX ON mv_pagos_diarios(fecha);
CREATE INDEX ON mv_pagos_diarios(sucursal_id, fecha);


-- ============================================================================
-- FUNCIÓN DE REFRESCO
-- Llamar manualmente o desde un cron de Supabase Edge Functions
-- ============================================================================
CREATE OR REPLACE FUNCTION refresh_dashboard_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- Para ejecutar manualmente cuando quieras:
-- SELECT refresh_dashboard_views();


-- ============================================================================
-- CRON JOB (opcional, requiere pg_cron habilitado en Supabase)
-- Se puede habilitar en: Settings → Database → Extensions → pg_cron
-- ============================================================================
-- Refresco cada hora en punto:
-- SELECT cron.schedule(
--   'refresh-dashboard-views',
--   '0 * * * *',
--   'SELECT refresh_dashboard_views()'
-- );

-- Para ver los crons activos:
-- SELECT * FROM cron.job;

-- Para eliminar el cron si cambia algo:
-- SELECT cron.unschedule('refresh-dashboard-views');
