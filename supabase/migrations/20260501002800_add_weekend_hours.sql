-- ============================================================================
-- Horarios de Fin de Semana por Sucursal
-- Añade hora_apertura_finde y hora_cierre_finde a la tabla sucursales.
-- Si se dejan en NULL, la agenda usará los horarios de semana como fallback.
-- ============================================================================

ALTER TABLE public.sucursales
  ADD COLUMN IF NOT EXISTS hora_apertura_finde TIME DEFAULT '09:00:00',
  ADD COLUMN IF NOT EXISTS hora_cierre_finde   TIME DEFAULT '18:00:00';

COMMENT ON COLUMN public.sucursales.hora_apertura_finde IS 'Hora de apertura Sábado–Domingo. Si es NULL usa hora_apertura.';
COMMENT ON COLUMN public.sucursales.hora_cierre_finde   IS 'Hora de cierre Sábado–Domingo. Si es NULL usa hora_cierre.';

-- ── Actualizar función aprobar_vacaciones para usar horario correcto por día ──
CREATE OR REPLACE FUNCTION public.aprobar_vacaciones(
  p_solicitud_id uuid,
  p_admin_id     uuid,
  p_notas        text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sol  public.solicitudes_vacaciones%ROWTYPE;
  v_suc  public.sucursales%ROWTYPE;
  v_dia  date;
  v_dow  int;   -- 0=Domingo, 1=Lunes ... 6=Sábado
  v_apertura time;
  v_cierre   time;
BEGIN
  SELECT * INTO v_sol FROM public.solicitudes_vacaciones WHERE id = p_solicitud_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Solicitud no encontrada'; END IF;
  IF v_sol.estado <> 'pendiente' THEN RAISE EXCEPTION 'La solicitud ya fue procesada'; END IF;

  -- Get branch hours
  SELECT * INTO v_suc FROM public.sucursales WHERE id = v_sol.sucursal_id;

  UPDATE public.solicitudes_vacaciones SET
    estado      = 'aprobada',
    notas_admin = p_notas,
    reviewed_by = p_admin_id,
    reviewed_at = now()
  WHERE id = p_solicitud_id;

  v_dia := v_sol.fecha_inicio;
  WHILE v_dia <= v_sol.fecha_fin LOOP
    -- 0 = Domingo, 6 = Sábado
    v_dow := EXTRACT(DOW FROM v_dia)::int;

    IF v_dow IN (0, 6) THEN
      -- Fin de semana: usar horario finde (con fallback al de semana)
      v_apertura := COALESCE(v_suc.hora_apertura_finde, v_suc.hora_apertura);
      v_cierre   := COALESCE(v_suc.hora_cierre_finde,   v_suc.hora_cierre);
    ELSE
      -- Lunes–Viernes
      v_apertura := v_suc.hora_apertura;
      v_cierre   := v_suc.hora_cierre;
    END IF;

    INSERT INTO public.bloqueos_agenda (empleada_id, fecha, hora_inicio, hora_fin, motivo, origen)
    VALUES (v_sol.empleada_id, v_dia, v_apertura, v_cierre, 'Vacaciones aprobadas', 'vacaciones')
    ON CONFLICT DO NOTHING;

    v_dia := v_dia + 1;
  END LOOP;
END;
$$;
