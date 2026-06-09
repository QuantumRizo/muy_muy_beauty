-- =============================================================================
-- MIGRACIÓN: 20260609010000_secure_booking_rpc
-- Fecha: 2026-06-09
-- Descripción: Reemplaza el acceso directo del rol 'anon' a la tabla 'clientes'
--              con funciones RPC de tipo SECURITY DEFINER.
--
-- PROBLEMA RESUELTO:
-- La política SELECT "Lectura pública de clientes por teléfono" con USING (true)
-- permitía que cualquier persona con la anon key pudiera obtener TODOS los datos
-- de clientes (nombres, teléfonos, emails) vía la API REST de Supabase.
--
-- SOLUCIÓN:
-- 1. verificar_cliente_por_telefono() → solo devuelve nombre + email si existe,
--    sin exponer el resto de la tabla.
-- 2. crear_reserva_publica() → maneja todo el flujo de reserva server-side.
--
-- El rol 'anon' ya NO necesita acceso directo a clientes, cita_servicios
-- ni INSERT en citas.
-- =============================================================================

-- ─── STEP 1: Eliminar políticas anon que ya no son necesarias ─────────────────

DROP POLICY IF EXISTS "Lectura pública de clientes por teléfono"  ON public.clientes;
DROP POLICY IF EXISTS "Inserción pública de nuevos clientes"        ON public.clientes;
DROP POLICY IF EXISTS "Inserción pública de citas para reservas"    ON public.citas;
DROP POLICY IF EXISTS "Lectura pública de servicios de cita"        ON public.cita_servicios;
DROP POLICY IF EXISTS "Inserción pública de servicios de cita"      ON public.cita_servicios;

-- ─── STEP 2: Función de verificación de cliente por teléfono ──────────────────
-- Solo expone nombre_completo + email del cliente encontrado.
-- Nunca devuelve id, sucursal_id, ni otros datos sensibles.

CREATE OR REPLACE FUNCTION public.verificar_cliente_por_telefono(p_telefono TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_nombre TEXT;
  v_email  TEXT;
BEGIN
  SELECT nombre_completo, email
  INTO   v_nombre, v_email
  FROM   public.clientes
  WHERE  telefono_cel = p_telefono
  LIMIT  1;

  IF FOUND THEN
    RETURN json_build_object(
      'existe',           true,
      'nombre_completo',  v_nombre,
      'email',            v_email
    );
  ELSE
    RETURN json_build_object('existe', false);
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.verificar_cliente_por_telefono(TEXT) TO anon;

-- ─── STEP 3: Función principal del flujo de reserva pública ───────────────────
-- Esta función corre con privilegios del owner (postgres), por lo que puede
-- insertar en clientes/citas/cita_servicios sin que el rol anon tenga acceso
-- directo a esas tablas.

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
BEGIN
  -- Validaciones básicas
  IF p_telefono IS NULL OR length(trim(p_telefono)) < 10 THEN
    RETURN json_build_object('error', 'Teléfono inválido');
  END IF;
  IF p_nombre IS NULL OR trim(p_nombre) = '' THEN
    RETURN json_build_object('error', 'Nombre requerido');
  END IF;
  IF p_servicio_ids IS NULL OR array_length(p_servicio_ids, 1) = 0 THEN
    RETURN json_build_object('error', 'Debes seleccionar al menos un servicio');
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

  -- Fallback: si todas están ocupadas, asignar la primera disponible de la sucursal
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

GRANT EXECUTE ON FUNCTION public.crear_reserva_publica(TEXT, TEXT, TEXT, UUID, DATE, TEXT, UUID[], TEXT, UUID) TO anon;
