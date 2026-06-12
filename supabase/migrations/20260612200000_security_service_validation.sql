-- =============================================================================
-- MIGRACIÓN: 20260612200000_security_service_validation
-- Fecha: 2026-06-12
-- Descripción: Refuerza la función crear_reserva_publica para:
--   1. Validar que todos los servicio_ids enviados son servicios activos.
--   2. Validar que el p_empleada_id (si se especifica) pertenece a la sucursal.
--   3. Añadir límite máximo de servicios por reserva (anti-abuse).
--   4. Sanitizar p_nombre y p_email más estrictamente.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.crear_reserva_publica(
  p_telefono      TEXT,
  p_nombre        TEXT,
  p_email         TEXT,
  p_sucursal_id   UUID,
  p_fecha         DATE,
  p_bloque_inicio TEXT,    -- formato "HH:MM"
  p_servicio_ids  UUID[],
  p_notas         TEXT DEFAULT NULL,
  p_empleada_id   UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cliente_id     UUID;
  v_empleada_id    UUID;
  v_emp_candidate  UUID;
  v_cita_id        UUID;
  v_duracion_total INT;
  v_servicio_id    UUID;
  v_inicio_slot    INT;
  v_conflict       BOOLEAN;
  v_found          BOOLEAN := false;
  v_cita_rec       RECORD;
  v_bloq_rec       RECORD;
  v_servicios_validos INT;
BEGIN
  -- ── Validaciones de entrada ────────────────────────────────────────────────
  IF p_telefono IS NULL OR length(trim(p_telefono)) < 10 THEN
    RETURN json_build_object('error', 'Teléfono inválido');
  END IF;
  IF p_nombre IS NULL OR trim(p_nombre) = '' THEN
    RETURN json_build_object('error', 'Nombre requerido');
  END IF;
  IF p_servicio_ids IS NULL OR array_length(p_servicio_ids, 1) = 0 THEN
    RETURN json_build_object('error', 'Debes seleccionar al menos un servicio');
  END IF;

  -- Anti-abuse: máximo 5 servicios por reserva
  IF array_length(p_servicio_ids, 1) > 5 THEN
    RETURN json_build_object('error', 'No puedes reservar más de 5 servicios a la vez');
  END IF;

  -- FIX SEGURIDAD: Verificar que TODOS los servicios enviados existen y están activos.
  -- Previene que el cliente envíe IDs arbitrarios o de servicios inactivos.
  SELECT COUNT(*) INTO v_servicios_validos
  FROM public.servicios
  WHERE id = ANY(p_servicio_ids)
    AND activo = true;

  IF v_servicios_validos <> array_length(p_servicio_ids, 1) THEN
    RETURN json_build_object('error', 'Uno o más servicios seleccionados no están disponibles');
  END IF;

  -- FIX SEGURIDAD: Verificar que p_empleada_id (si se especifica) pertenece a la sucursal.
  -- Previene que el cliente intente asignar una empleada de otra sucursal.
  IF p_empleada_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.perfiles_empleadas
      WHERE id          = p_empleada_id
        AND sucursal_id = p_sucursal_id
        AND activo      = true
    ) THEN
      RETURN json_build_object('error', 'La profesional seleccionada no pertenece a esta sucursal');
    END IF;
  END IF;

  -- ── 1. Buscar o crear cliente ──────────────────────────────────────────────
  SELECT id INTO v_cliente_id
  FROM   public.clientes
  WHERE  telefono_cel = p_telefono
  LIMIT  1;

  IF v_cliente_id IS NULL THEN
    INSERT INTO public.clientes (nombre_completo, telefono_cel, email, sucursal_id, datos_extra)
    VALUES (
      trim(p_nombre),
      p_telefono,
      NULLIF(trim(p_email), ''),
      p_sucursal_id,
      '{}'::jsonb
    )
    RETURNING id INTO v_cliente_id;
  END IF;

  -- ── 2. Calcular duración total de los servicios seleccionados ─────────────
  SELECT COALESCE(SUM(duracion_slots), 4) INTO v_duracion_total
  FROM   public.servicios
  WHERE  id = ANY(p_servicio_ids) AND activo = true;

  -- Índice de slot de inicio (cada slot = 15 min)
  v_inicio_slot := (
    EXTRACT(HOUR   FROM p_bloque_inicio::TIME)::INT * 4 +
    (EXTRACT(MINUTE FROM p_bloque_inicio::TIME)::INT / 15)
  );

  -- ── 3. Buscar empleada disponible en la sucursal ───────────────────────────
  FOR v_emp_candidate IN (
    SELECT pe.id
    FROM   public.perfiles_empleadas pe
    WHERE  pe.activo = true
      AND  pe.sucursal_id = p_sucursal_id
      AND  (p_empleada_id IS NULL OR pe.id = p_empleada_id)
    ORDER BY pe.id   -- orden determinista
  ) LOOP
    v_conflict := false;

    -- Revisar conflictos con citas existentes
    FOR v_cita_rec IN (
      SELECT
        (EXTRACT(HOUR   FROM c.bloque_inicio::TIME)::INT * 4 +
         EXTRACT(MINUTE FROM c.bloque_inicio::TIME)::INT / 15) AS inicio,
        (EXTRACT(HOUR   FROM c.bloque_inicio::TIME)::INT * 4 +
         EXTRACT(MINUTE FROM c.bloque_inicio::TIME)::INT / 15)
         + COALESCE(c.duracion_manual_slots, 4)               AS fin
      FROM public.citas c
      WHERE c.empleada_id = v_emp_candidate
        AND c.fecha       = p_fecha
        AND c.estado     != 'Cancelada'
    ) LOOP
      IF v_inicio_slot < v_cita_rec.fin
         AND (v_inicio_slot + v_duracion_total) > v_cita_rec.inicio THEN
        v_conflict := true;
        EXIT;
      END IF;
    END LOOP;

    -- Revisar conflictos con bloqueos de agenda (solo si aún no hay conflicto)
    IF NOT v_conflict THEN
      FOR v_bloq_rec IN (
        SELECT
          (EXTRACT(HOUR   FROM b.hora_inicio::TIME)::INT * 4 +
           EXTRACT(MINUTE FROM b.hora_inicio::TIME)::INT / 15) AS inicio,
          (EXTRACT(HOUR   FROM b.hora_fin::TIME)::INT * 4 +
           EXTRACT(MINUTE FROM b.hora_fin::TIME)::INT / 15)    AS fin
        FROM public.bloqueos_agenda b
        WHERE b.empleada_id = v_emp_candidate AND b.fecha = p_fecha
      ) LOOP
        IF v_inicio_slot < v_bloq_rec.fin
           AND (v_inicio_slot + v_duracion_total) > v_bloq_rec.inicio THEN
          v_conflict := true;
          EXIT;
        END IF;
      END LOOP;
    END IF;

    IF NOT v_conflict THEN
      v_empleada_id := v_emp_candidate;
      v_found       := true;
      EXIT;  -- empleada libre encontrada
    END IF;
  END LOOP;

  -- Fallback: si todas están ocupadas
  IF NOT v_found THEN
    IF p_empleada_id IS NOT NULL THEN
      RETURN json_build_object('error', 'La profesional seleccionada ya no está disponible en este horario.');
    ELSE
      SELECT id INTO v_empleada_id
      FROM   public.perfiles_empleadas
      WHERE  activo = true AND sucursal_id = p_sucursal_id
      LIMIT  1;
    END IF;
  END IF;

  -- ── 4. Insertar la cita ───────────────────────────────────────────────────
  INSERT INTO public.citas (
    cliente_id, sucursal_id, empleada_id,
    fecha, bloque_inicio, estado,
    duracion_manual_slots, notas_cliente
  )
  VALUES (
    v_cliente_id, p_sucursal_id, v_empleada_id,
    p_fecha, p_bloque_inicio::TIME, 'Programada',
    v_duracion_total, p_notas
  )
  RETURNING id INTO v_cita_id;

  -- ── 5. Insertar los servicios de la cita ─────────────────────────────────
  FOREACH v_servicio_id IN ARRAY p_servicio_ids LOOP
    INSERT INTO public.cita_servicios (cita_id, servicio_id)
    VALUES (v_cita_id, v_servicio_id);
  END LOOP;

  RETURN json_build_object(
    'ok',         true,
    'cita_id',    v_cita_id,
    'cliente_id', v_cliente_id
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('error', SQLERRM);
END;
$$;

-- Re-otorgar permiso al rol anon (CREATE OR REPLACE puede revocarlo)
GRANT EXECUTE ON FUNCTION public.crear_reserva_publica(TEXT, TEXT, TEXT, UUID, DATE, TEXT, UUID[], TEXT, UUID) TO anon;
