-- Fix dashboard permissions for security_invoker views
-- This ensures that the authenticated role can read both the public views 
-- and the underlying private materialized views.

-- 1. Grant usage on schemas
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA private TO authenticated;

-- 2. Grant select on all materialized views in private schema
GRANT SELECT ON ALL TABLES IN SCHEMA private TO authenticated;

-- 3. Grant select on the public views (security_invoker = true)
GRANT SELECT ON public.mv_pagos_diarios TO authenticated;
GRANT SELECT ON public.mv_servicios_familia_diarios TO authenticated;
GRANT SELECT ON public.mv_ventas_empleado_diarias TO authenticated;
GRANT SELECT ON public.mv_tickets_diarios TO authenticated;
GRANT SELECT ON public.mv_asistencias_diarias TO authenticated;

-- 4. Also grant to service_role to avoid any background worker issues
GRANT USAGE ON SCHEMA private TO service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA private TO service_role;
