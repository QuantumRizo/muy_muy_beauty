-- =============================================================================
-- MIGRACIÓN: fix_audit_issues
-- Fecha: 2026-06-05
-- Descripción: Corrige todos los problemas detectados en la auditoría de BD:
--   1. Recrear la función callable validar_disponibilidad_cita (fue eliminada
--      en la migración anterior sin ser reemplazada correctamente).
--   2. Mejorar aprobar_vacaciones para respetar horarios reales de la sucursal.
--   3. Eliminar políticas RLS duplicadas en documentos y perfiles_usuario.
--   4. Optimizar subplan ineficiente de auth.uid() en perfiles_usuario.
-- =============================================================================


-- ============================================================
-- FIX 1: Recrear función callable validar_disponibilidad_cita
-- La migración 20260525143000 eliminó la versión con parámetros
-- (uuid, date, time, time, uuid) sin recrearla. La reconstruimos
-- usando las columnas reales de citas: bloque_inicio + duracion_manual_slots.
-- ============================================================
CREATE OR REPLACE FUNCTION public.validar_disponibilidad_cita(
  p_empleada_id     uuid,
  p_fecha           date,
  p_hora_inicio     time without time zone,
  p_hora_fin        time without time zone,
  p_excluir_cita_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conflicto_citas    int;
  v_conflicto_bloqueos int;
BEGIN
  -- Verificar conflicto con otras citas activas de la misma empleada
  SELECT COUNT(*) INTO v_conflicto_citas
  FROM public.citas
  WHERE empleada_id = p_empleada_id
    AND fecha       = p_fecha
    AND estado NOT IN ('Cancelada', 'No asistió')
    AND (id <> p_excluir_cita_id OR p_excluir_cita_id IS NULL)
    AND (
      p_hora_inicio,
      p_hora_fin
    ) OVERLAPS (
      bloque_inicio,
      bloque_inicio + (COALESCE(duracion_manual_slots, 4) * 15 || ' minutes')::interval
    );

  IF v_conflicto_citas > 0 THEN
    RETURN false;
  END IF;

  -- Verificar conflicto con bloqueos de agenda (descansos, comida, vacaciones)
  SELECT COUNT(*) INTO v_conflicto_bloqueos
  FROM public.bloqueos_agenda
  WHERE empleada_id = p_empleada_id
    AND fecha       = p_fecha
    AND (p_hora_inicio, p_hora_fin) OVERLAPS (hora_inicio, hora_fin);

  RETURN v_conflicto_bloqueos = 0;
END;
$$;


-- ============================================================
-- FIX 2: Mejorar aprobar_vacaciones para respetar horarios
-- reales de la sucursal (horarios_por_dia JSONB) en lugar de
-- hardcodear '08:00'–'21:00' para cada día.
-- ============================================================
CREATE OR REPLACE FUNCTION public.aprobar_vacaciones(
  p_solicitud_id uuid,
  p_admin_id     uuid,
  p_notas        text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sol      public.solicitudes_vacaciones%ROWTYPE;
  v_suc      public.sucursales%ROWTYPE;
  v_dia      date;
  v_dow      text;
  v_config   jsonb;
  v_apertura time;
  v_cierre   time;
  v_cerrado  boolean;
BEGIN
  SELECT * INTO v_sol FROM public.solicitudes_vacaciones WHERE id = p_solicitud_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Solicitud no encontrada';
  END IF;
  IF v_sol.estado <> 'pendiente' THEN
    RAISE EXCEPTION 'La solicitud ya fue procesada';
  END IF;

  SELECT * INTO v_suc FROM public.sucursales WHERE id = v_sol.sucursal_id;

  UPDATE public.solicitudes_vacaciones
  SET
    estado      = 'aprobada',
    notas_admin = p_notas,
    reviewed_by = p_admin_id,
    reviewed_at = now()
  WHERE id = p_solicitud_id;

  -- Crear bloqueos de agenda por cada día del rango de vacaciones
  v_dia := v_sol.fecha_inicio;
  WHILE v_dia <= v_sol.fecha_fin LOOP
    v_dow    := EXTRACT(DOW FROM v_dia)::text;
    v_config := v_suc.horarios_por_dia->v_dow;
    v_cerrado := COALESCE((v_config->>'cerrado')::boolean, false);

    -- Solo insertar bloqueo si la sucursal no está cerrada ese día
    IF NOT v_cerrado AND v_config IS NOT NULL THEN
      v_apertura := (v_config->>'apertura')::time;
      v_cierre   := (v_config->>'cierre')::time;
    ELSE
      -- Fallback si no hay configuración: bloqueo de día completo estándar
      v_apertura := '08:00'::time;
      v_cierre   := '21:00'::time;
    END IF;

    IF NOT v_cerrado THEN
      INSERT INTO public.bloqueos_agenda (empleada_id, fecha, hora_inicio, hora_fin, motivo, origen)
      VALUES (v_sol.empleada_id, v_dia, v_apertura, v_cierre, 'Vacaciones aprobadas', 'vacaciones')
      ON CONFLICT DO NOTHING;
    END IF;

    v_dia := v_dia + 1;
  END LOOP;
END;
$$;


-- ============================================================
-- FIX 3: Eliminar política RLS duplicada en tabla documentos.
-- La política genérica "Permitir todo" solapa con las específicas
-- (Permitir lectura, Permitir insertar, Permitir eliminar).
-- Conservamos las específicas.
-- ============================================================
DROP POLICY IF EXISTS "Permitir todo a usuarios autenticados" ON public.documentos;


-- ============================================================
-- FIX 4: Eliminar política RLS duplicada en tabla perfiles_usuario.
-- La política "Permitir todo" solapa con "Ver propio perfil" y
-- "Editar propio perfil", que sí tienen lógica real (auth.uid() = id).
-- ============================================================
DROP POLICY IF EXISTS "Permitir todo a usuarios autenticados" ON public.perfiles_usuario;


-- ============================================================
-- FIX 5: Optimizar políticas RLS en perfiles_usuario.
-- Reemplazar auth.uid() por (SELECT auth.uid()) para evitar
-- que se re-evalúe la función por cada fila (subplan ineficiente).
-- ============================================================
DROP POLICY IF EXISTS "Ver propio perfil" ON public.perfiles_usuario;
CREATE POLICY "Ver propio perfil"
  ON public.perfiles_usuario
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Editar propio perfil" ON public.perfiles_usuario;
CREATE POLICY "Editar propio perfil"
  ON public.perfiles_usuario
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);
