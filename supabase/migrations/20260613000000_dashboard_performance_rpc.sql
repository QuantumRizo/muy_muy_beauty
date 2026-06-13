-- =============================================================================
-- MIGRACIÓN: 20260613000000_dashboard_performance_rpc
-- Fecha: 2026-06-13
-- Descripción:
--   1. Añade validación de Rate Limit (max 3/día) al RPC crear_reserva_publica.
--   2. Añade RPC get_primeras_sesiones para evitar query N+1 en dashboard.
--   3. Añade RPC get_primeras_compras para evitar query N+1 en dashboard.
-- =============================================================================

-- ── 1. RATE LIMIT PARA RESERVAS PÚBLICAS ─────────────────────────────────────
-- Reemplazamos la función para añadir la comprobación de rate limit justo después 
-- de encontrar o crear al cliente.

CREATE OR REPLACE FUNCTION public.crear_reserva_publica(
  p_telefono      TEXT,
  p_nombre        TEXT,
  p_email         TEXT,
  p_sucursal_id   UUID,
  p_fecha         DATE,
  p_bloque_inicio TEXT,
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
  v_reservas_hoy   INT;
BEGIN
  -- Validaciones de entrada
  IF p_telefono IS NULL OR length(trim(p_telefono)) < 10 THEN
    RETURN json_build_object('error', 'Teléfono inválido');
  END IF;
  IF p_nombre IS NULL OR trim(p_nombre) = '' THEN
    RETURN json_build_object('error', 'Nombre requerido');
  END IF;
  IF p_servicio_ids IS NULL OR array_length(p_servicio_ids, 1) = 0 THEN
    RETURN json_build_object('error', 'Debes seleccionar al menos un servicio');
  END IF;

  IF array_length(p_servicio_ids, 1) > 5 THEN
    RETURN json_build_object('error', 'No puedes reservar más de 5 servicios a la vez');
  END IF;

  SELECT COUNT(*) INTO v_servicios_validos
  FROM public.servicios
  WHERE id = ANY(p_servicio_ids) AND activo = true;

  IF v_servicios_validos <> array_length(p_servicio_ids, 1) THEN
    RETURN json_build_object('error', 'Uno o más servicios seleccionados no están disponibles');
  END IF;

  IF p_empleada_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.perfiles_empleadas
      WHERE id = p_empleada_id AND sucursal_id = p_sucursal_id AND activo = true
    ) THEN
      RETURN json_build_object('error', 'La profesional seleccionada no pertenece a esta sucursal');
    END IF;
  END IF;

  -- Buscar o crear cliente
  SELECT id INTO v_cliente_id
  FROM public.clientes
  WHERE telefono_cel = p_telefono
  LIMIT 1;

  IF v_cliente_id IS NULL THEN
    INSERT INTO public.clientes (nombre_completo, telefono_cel, email, sucursal_id, datos_extra)
    VALUES (trim(p_nombre), p_telefono, NULLIF(trim(p_email), ''), p_sucursal_id, '{}'::jsonb)
    RETURNING id INTO v_cliente_id;
  END IF;

  -- FIX SEGURIDAD: Rate Limit de reservas (máx 3 por cliente en las últimas 24 horas)
  -- Evita que un bot o usuario malicioso llene la agenda.
  SELECT COUNT(*) INTO v_reservas_hoy
  FROM public.citas
  WHERE cliente_id = v_cliente_id
    AND created_at >= (now() - interval '24 hours');
    
  IF v_reservas_hoy >= 3 THEN
    RETURN json_build_object('error', 'Has alcanzado el límite máximo de reservas por día. Por favor, contáctanos por teléfono.');
  END IF;

  -- Calcular duración
  SELECT COALESCE(SUM(duracion_slots), 4) INTO v_duracion_total
  FROM public.servicios
  WHERE id = ANY(p_servicio_ids) AND activo = true;

  v_inicio_slot := (
    EXTRACT(HOUR FROM p_bloque_inicio::TIME)::INT * 4 +
    (EXTRACT(MINUTE FROM p_bloque_inicio::TIME)::INT / 15)
  );

  -- Buscar empleada disponible
  FOR v_emp_candidate IN (
    SELECT pe.id FROM public.perfiles_empleadas pe
    WHERE pe.activo = true AND pe.sucursal_id = p_sucursal_id
      AND (p_empleada_id IS NULL OR pe.id = p_empleada_id)
    ORDER BY pe.id
  ) LOOP
    v_conflict := false;

    FOR v_cita_rec IN (
      SELECT
        (EXTRACT(HOUR FROM c.bloque_inicio::TIME)::INT * 4 + EXTRACT(MINUTE FROM c.bloque_inicio::TIME)::INT / 15) AS inicio,
        (EXTRACT(HOUR FROM c.bloque_inicio::TIME)::INT * 4 + EXTRACT(MINUTE FROM c.bloque_inicio::TIME)::INT / 15) + COALESCE(c.duracion_manual_slots, 4) AS fin
      FROM public.citas c
      WHERE c.empleada_id = v_emp_candidate AND c.fecha = p_fecha AND c.estado != 'Cancelada'
    ) LOOP
      IF v_inicio_slot < v_cita_rec.fin AND (v_inicio_slot + v_duracion_total) > v_cita_rec.inicio THEN
        v_conflict := true;
        EXIT;
      END IF;
    END LOOP;

    IF NOT v_conflict THEN
      FOR v_bloq_rec IN (
        SELECT
          (EXTRACT(HOUR FROM b.hora_inicio::TIME)::INT * 4 + EXTRACT(MINUTE FROM b.hora_inicio::TIME)::INT / 15) AS inicio,
          (EXTRACT(HOUR FROM b.hora_fin::TIME)::INT * 4 + EXTRACT(MINUTE FROM b.hora_fin::TIME)::INT / 15) AS fin
        FROM public.bloqueos_agenda b
        WHERE b.empleada_id = v_emp_candidate AND b.fecha = p_fecha
      ) LOOP
        IF v_inicio_slot < v_bloq_rec.fin AND (v_inicio_slot + v_duracion_total) > v_bloq_rec.inicio THEN
          v_conflict := true;
          EXIT;
        END IF;
      END LOOP;
    END IF;

    IF NOT v_conflict THEN
      v_empleada_id := v_emp_candidate;
      v_found := true;
      EXIT;
    END IF;
  END LOOP;

  IF NOT v_found THEN
    IF p_empleada_id IS NOT NULL THEN
      RETURN json_build_object('error', 'La profesional seleccionada ya no está disponible en este horario.');
    ELSE
      SELECT id INTO v_empleada_id
      FROM public.perfiles_empleadas
      WHERE activo = true AND sucursal_id = p_sucursal_id
      LIMIT 1;
    END IF;
  END IF;

  INSERT INTO public.citas (
    cliente_id, sucursal_id, empleada_id, fecha, bloque_inicio, estado, duracion_manual_slots, notas_cliente
  ) VALUES (
    v_cliente_id, p_sucursal_id, v_empleada_id, p_fecha, p_bloque_inicio::TIME, 'Programada', v_duracion_total, p_notas
  ) RETURNING id INTO v_cita_id;

  FOREACH v_servicio_id IN ARRAY p_servicio_ids LOOP
    INSERT INTO public.cita_servicios (cita_id, servicio_id) VALUES (v_cita_id, v_servicio_id);
  END LOOP;

  RETURN json_build_object('ok', true, 'cita_id', v_cita_id, 'cliente_id', v_cliente_id);

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.crear_reserva_publica(TEXT, TEXT, TEXT, UUID, DATE, TEXT, UUID[], TEXT, UUID) TO anon;

-- ── 2. RPC: get_primeras_sesiones ────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_primeras_sesiones(
  p_fecha_inicio DATE,
  p_fecha_fin DATE,
  p_sucursal_id UUID DEFAULT NULL
)
RETURNS TABLE (
  cliente_id UUID,
  fecha DATE,
  sucursal_id UUID,
  sucursal_nombre TEXT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
WITH ranked_citas AS (
  SELECT 
    c.cliente_id, 
    c.fecha, 
    c.sucursal_id, 
    s.nombre as sucursal_nombre,
    ROW_NUMBER() OVER(PARTITION BY c.cliente_id ORDER BY c.fecha ASC, c.created_at ASC) as rn
  FROM public.citas c
  LEFT JOIN public.sucursales s ON s.id = c.sucursal_id
  WHERE c.estado IN ('Programada', 'En curso', 'Finalizada')
    AND c.cliente_id IS NOT NULL
)
SELECT 
  rc.cliente_id, 
  rc.fecha, 
  rc.sucursal_id, 
  rc.sucursal_nombre
FROM ranked_citas rc
WHERE rc.rn = 1 
  AND rc.fecha >= p_fecha_inicio 
  AND rc.fecha <= p_fecha_fin
  AND (p_sucursal_id IS NULL OR rc.sucursal_id = p_sucursal_id);
$$;

GRANT EXECUTE ON FUNCTION public.get_primeras_sesiones(DATE, DATE, UUID) TO authenticated;

-- ── 3. RPC: get_primeras_compras ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_primeras_compras(
  p_fecha_inicio DATE,
  p_fecha_fin DATE,
  p_sucursal_id UUID DEFAULT NULL
)
RETURNS TABLE (
  cliente_id UUID,
  fecha DATE,
  total NUMERIC,
  sucursal_id UUID,
  sucursal_nombre TEXT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
WITH ranked_tickets AS (
  SELECT 
    t.cliente_id, 
    t.fecha,
    t.total,
    t.sucursal_id, 
    s.nombre as sucursal_nombre,
    ROW_NUMBER() OVER(PARTITION BY t.cliente_id ORDER BY t.fecha ASC, t.created_at ASC) as rn
  FROM public.tickets t
  LEFT JOIN public.sucursales s ON s.id = t.sucursal_id
  WHERE t.estado = 'Pagado' 
    AND t.cliente_id IS NOT NULL
)
SELECT 
  rt.cliente_id, 
  rt.fecha, 
  rt.total,
  rt.sucursal_id, 
  rt.sucursal_nombre
FROM ranked_tickets rt
WHERE rt.rn = 1 
  AND rt.fecha >= p_fecha_inicio 
  AND rt.fecha <= p_fecha_fin
  AND (p_sucursal_id IS NULL OR rt.sucursal_id = p_sucursal_id);
$$;

GRANT EXECUTE ON FUNCTION public.get_primeras_compras(DATE, DATE, UUID) TO authenticated;
