-- 1. Eliminar las vistas materializadas y vistas públicas que dependen de la columna 'familia'
DROP VIEW IF EXISTS public.mv_servicios_familia_diarios CASCADE;
DROP MATERIALIZED VIEW IF EXISTS private.mv_servicios_familia_diarios CASCADE;

-- 2. Eliminar definitivamente la columna 'familia' de la tabla 'servicios'
ALTER TABLE public.servicios DROP COLUMN IF EXISTS familia;

-- 3. Recrear la vista materializada usando la nueva relación con 'categorias_servicio'
-- Mantenemos el nombre 'familia' como alias para retrocompatibilidad con los reportes
CREATE MATERIALIZED VIEW private.mv_servicios_familia_diarios AS
SELECT 
  t.fecha,
  t.sucursal_id,
  COALESCE(c.nombre, 'Otros') AS familia,
  COUNT(*) AS cantidad
FROM public.ticket_items ti
JOIN public.tickets t ON t.id = ti.ticket_id AND t.estado = 'Pagado'
LEFT JOIN public.servicios sv ON sv.nombre = ti.nombre
LEFT JOIN public.categorias_servicio c ON c.id = sv.categoria_id
WHERE ti.tipo = 'Servicio'
GROUP BY t.fecha, t.sucursal_id, COALESCE(c.nombre, 'Otros');

CREATE INDEX ON private.mv_servicios_familia_diarios(fecha);

-- 4. Recrear la vista segura en public
CREATE OR REPLACE VIEW public.mv_servicios_familia_diarios AS
SELECT * FROM private.mv_servicios_familia_diarios
WHERE (
  (SELECT rol FROM public.perfiles_usuario WHERE id = auth.uid()) IN ('admin', 'superadmin')
  OR sucursal_id = ANY (SELECT sucursal_id FROM public.perfiles_empleadas WHERE id = auth.uid())
);

-- 5. Dar permisos de lectura
GRANT SELECT ON public.mv_servicios_familia_diarios TO authenticated;
