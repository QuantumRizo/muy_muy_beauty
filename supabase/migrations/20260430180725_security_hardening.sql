-- ============================================================================
-- SEGURIDAD: Hardening general del esquema
-- Propósito:
--   1. Revocar acceso anónimo de todas las tablas internas
--   2. Mantener acceso público solo para reservas online (servicios, sucursales)
--   3. Fijar search_path en todas las funciones (evita mutable search_path warning)
--   4. Corregir SECURITY DEFINER en las vistas públicas del Dashboard
-- ============================================================================


-- ─── 1. REVOCAR ACCESO ANON DE TABLAS INTERNAS ───────────────────────────────
-- Nadie sin sesión activa debe poder leer datos de operaciones internas.

-- Eliminar políticas que dan acceso a anon
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (qual = 'true' OR with_check = 'true')
      AND roles && ARRAY['anon']::name[]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    RAISE NOTICE 'Dropped anon policy % on %', r.policyname, r.tablename;
  END LOOP;
END;
$$;

-- Solo las tablas que el booking público necesita mantienen acceso anon (lectura)
-- Servicios y sucursales → necesarias para el formulario de reserva público
CREATE POLICY "Lectura pública de servicios"
  ON public.servicios FOR SELECT TO anon USING (true);

CREATE POLICY "Lectura pública de sucursales"
  ON public.sucursales FOR SELECT TO anon USING (true);


-- ─── 2. LIMPIAR POLÍTICAS DUPLICADAS / REDUNDANTES ────────────────────────────
-- Eliminar las políticas "Allow all" genéricas (ya reemplazadas por autenticados)

DROP POLICY IF EXISTS "Allow all" ON public.bloqueos_agenda;
DROP POLICY IF EXISTS "Allow all" ON public.cita_servicios;
DROP POLICY IF EXISTS "Allow all" ON public.citas;
DROP POLICY IF EXISTS "Allow all" ON public.clientes;
DROP POLICY IF EXISTS "Allow all" ON public.evaluaciones_hoja;
DROP POLICY IF EXISTS "Allow all" ON public.pagos;
DROP POLICY IF EXISTS "Allow all" ON public.perfiles_empleadas;
DROP POLICY IF EXISTS "Allow all" ON public.productos;
DROP POLICY IF EXISTS "Allow all" ON public.servicios;
DROP POLICY IF EXISTS "Allow all" ON public.sucursales;
DROP POLICY IF EXISTS "Allow all" ON public.ticket_items;
DROP POLICY IF EXISTS "Allow all" ON public.tickets;


-- ─── 3. FIJAR search_path EN FUNCIONES ────────────────────────────────────────
-- Esto elimina el warning "mutable search_path" del Advisor

CREATE OR REPLACE FUNCTION public.refresh_dashboard_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
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

CREATE OR REPLACE FUNCTION public.aprobar_vacaciones(p_solicitud_id uuid, p_admin_id uuid, p_notas text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sol       public.solicitudes_vacaciones%ROWTYPE;
  v_dia       date;
BEGIN
  SELECT * INTO v_sol FROM public.solicitudes_vacaciones WHERE id = p_solicitud_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Solicitud no encontrada'; END IF;
  IF v_sol.estado <> 'pendiente' THEN RAISE EXCEPTION 'La solicitud ya fue procesada'; END IF;

  UPDATE public.solicitudes_vacaciones SET
    estado      = 'aprobada',
    notas_admin = p_notas,
    reviewed_by = p_admin_id,
    reviewed_at = now()
  WHERE id = p_solicitud_id;

  v_dia := v_sol.fecha_inicio;
  WHILE v_dia <= v_sol.fecha_fin LOOP
    INSERT INTO public.bloqueos_agenda (empleada_id, fecha, hora_inicio, hora_fin, motivo, origen)
    VALUES (v_sol.empleada_id, v_dia, '08:00', '21:00', 'Vacaciones aprobadas', 'vacaciones')
    ON CONFLICT DO NOTHING;
    v_dia := v_dia + 1;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.rechazar_vacaciones(p_solicitud_id uuid, p_admin_id uuid, p_notas text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.solicitudes_vacaciones SET
    estado      = 'rechazada',
    notas_admin = p_notas,
    reviewed_by = p_admin_id,
    reviewed_at = now()
  WHERE id = p_solicitud_id AND estado = 'pendiente';
  IF NOT FOUND THEN RAISE EXCEPTION 'Solicitud no encontrada o ya procesada'; END IF;
END;
$$;

-- Funciones existentes del sistema — fijar search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.perfiles_usuario (id, email, nombre, rol)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'rol', 'admin')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP FUNCTION IF EXISTS public.siguiente_folio_ticket(uuid);
CREATE OR REPLACE FUNCTION public.siguiente_folio_ticket(p_sucursal_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_folio int;
  v_prefix text;
BEGIN
  SELECT prefijo INTO v_prefix FROM public.sucursales WHERE id = p_sucursal_id;
  v_prefix := COALESCE(v_prefix, 'TK');

  INSERT INTO public.folios_ticket (sucursal_id, ultimo_folio)
  VALUES (p_sucursal_id, 1)
  ON CONFLICT (sucursal_id) DO UPDATE
    SET ultimo_folio = public.folios_ticket.ultimo_folio + 1
  RETURNING ultimo_folio INTO v_folio;

  RETURN v_prefix || '-' || LPAD(v_folio::text, 5, '0');
END;
$$;

DROP FUNCTION IF EXISTS public.decrementar_stock_producto(uuid, int);
CREATE OR REPLACE FUNCTION public.decrementar_stock_producto(
  p_id uuid,
  p_cantidad integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.productos
  SET stock = GREATEST(0, stock - p_cantidad)
  WHERE id = p_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.validar_disponibilidad_cita(
  p_empleada_id uuid,
  p_fecha date,
  p_hora_inicio time,
  p_hora_fin time,
  p_excluir_cita_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conflicto int;
BEGIN
  SELECT COUNT(*) INTO v_conflicto
  FROM public.citas
  WHERE empleada_id    = p_empleada_id
    AND fecha          = p_fecha
    AND estado        <> 'Cancelada'
    AND (id <> p_excluir_cita_id OR p_excluir_cita_id IS NULL)
    AND hora_inicio    < p_hora_fin
    AND hora_fin       > p_hora_inicio;

  RETURN v_conflicto = 0;
END;
$$;


-- ─── 4. CORREGIR VISTAS PÚBLICAS (SECURITY DEFINER) ──────────────────────────
-- Las vistas públicas del Dashboard heredan el SECURITY DEFINER por acceder
-- al esquema private. Para silenciar el aviso del Advisor, las recreamos
-- explícitamente con SECURITY INVOKER (el default seguro).
-- La seguridad real está en que el esquema private no es accesible directamente.

CREATE OR REPLACE VIEW public.mv_tickets_diarios
WITH (security_invoker = true)
AS SELECT * FROM private.mv_tickets_diarios
WHERE (
  (SELECT rol FROM public.perfiles_usuario WHERE id = auth.uid()) IN ('admin', 'superadmin')
  OR sucursal_id = ANY (SELECT sucursal_id FROM public.perfiles_empleadas WHERE id = auth.uid())
);

CREATE OR REPLACE VIEW public.mv_ventas_empleado_diarias
WITH (security_invoker = true)
AS SELECT * FROM private.mv_ventas_empleado_diarias
WHERE (
  (SELECT rol FROM public.perfiles_usuario WHERE id = auth.uid()) IN ('admin', 'superadmin')
  OR sucursal_id = ANY (SELECT sucursal_id FROM public.perfiles_empleadas WHERE id = auth.uid())
);

CREATE OR REPLACE VIEW public.mv_asistencias_diarias
WITH (security_invoker = true)
AS SELECT * FROM private.mv_asistencias_diarias
WHERE (
  (SELECT rol FROM public.perfiles_usuario WHERE id = auth.uid()) IN ('admin', 'superadmin')
  OR sucursal_id = ANY (SELECT sucursal_id FROM public.perfiles_empleadas WHERE id = auth.uid())
);

CREATE OR REPLACE VIEW public.mv_servicios_familia_diarios
WITH (security_invoker = true)
AS SELECT * FROM private.mv_servicios_familia_diarios
WHERE (
  (SELECT rol FROM public.perfiles_usuario WHERE id = auth.uid()) IN ('admin', 'superadmin')
  OR sucursal_id = ANY (SELECT sucursal_id FROM public.perfiles_empleadas WHERE id = auth.uid())
);

CREATE OR REPLACE VIEW public.mv_pagos_diarios
WITH (security_invoker = true)
AS SELECT * FROM private.mv_pagos_diarios
WHERE (
  (SELECT rol FROM public.perfiles_usuario WHERE id = auth.uid()) IN ('admin', 'superadmin')
  OR sucursal_id = ANY (SELECT sucursal_id FROM public.perfiles_empleadas WHERE id = auth.uid())
);

-- Re-otorgar permisos de lectura (CREATE OR REPLACE puede revocarlos)
GRANT SELECT ON public.mv_tickets_diarios TO authenticated;
GRANT SELECT ON public.mv_ventas_empleado_diarias TO authenticated;
GRANT SELECT ON public.mv_asistencias_diarias TO authenticated;
GRANT SELECT ON public.mv_servicios_familia_diarios TO authenticated;
GRANT SELECT ON public.mv_pagos_diarios TO authenticated;
