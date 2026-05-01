-- ============================================================================
-- Horarios Detallados Día por Día
-- Añade horarios_por_dia (JSONB) para flexibilidad total.
-- ============================================================================

ALTER TABLE public.sucursales
  ADD COLUMN IF NOT EXISTS horarios_por_dia JSONB DEFAULT '{
    "0": {"apertura": "09:00", "cierre": "18:00", "cerrado": false},
    "1": {"apertura": "08:00", "cierre": "21:00", "cerrado": false},
    "2": {"apertura": "08:00", "cierre": "21:00", "cerrado": false},
    "3": {"apertura": "08:00", "cierre": "21:00", "cerrado": false},
    "4": {"apertura": "08:00", "cierre": "21:00", "cerrado": false},
    "5": {"apertura": "08:00", "cierre": "21:00", "cerrado": false},
    "6": {"apertura": "09:00", "cierre": "18:00", "cerrado": false}
  }'::jsonb;

COMMENT ON COLUMN public.sucursales.horarios_por_dia IS 'Mapa de horarios por día (0=Dom, 1=Lun...).';

-- ── Actualizar función aprobar_vacaciones para leer del JSON ──
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
  v_dow  text;
  v_config jsonb;
  v_apertura time;
  v_cierre   time;
  v_cerrado  boolean;
BEGIN
  SELECT * INTO v_sol FROM public.solicitudes_vacaciones WHERE id = p_solicitud_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Solicitud no encontrada'; END IF;
  IF v_sol.estado <> 'pendiente' THEN RAISE EXCEPTION 'La solicitud ya fue procesada'; END IF;

  SELECT * INTO v_suc FROM public.sucursales WHERE id = v_sol.sucursal_id;

  UPDATE public.solicitudes_vacaciones SET
    estado      = 'aprobada',
    notas_admin = p_notas,
    reviewed_by = p_admin_id,
    reviewed_at = now()
  WHERE id = p_solicitud_id;

  v_dia := v_sol.fecha_inicio;
  WHILE v_dia <= v_sol.fecha_fin LOOP
    v_dow := EXTRACT(DOW FROM v_dia)::text;
    v_config := v_suc.horarios_por_dia->v_dow;
    
    v_cerrado  := (v_config->>'cerrado')::boolean;
    
    -- Solo insertar bloqueo si no está cerrado ese día
    IF NOT v_cerrado THEN
      v_apertura := (v_config->>'apertura')::time;
      v_cierre   := (v_config->>'cierre')::time;

      INSERT INTO public.bloqueos_agenda (empleada_id, fecha, hora_inicio, hora_fin, motivo, origen)
      VALUES (v_sol.empleada_id, v_dia, v_apertura, v_cierre, 'Vacaciones aprobadas', 'vacaciones')
      ON CONFLICT DO NOTHING;
    END IF;

    v_dia := v_dia + 1;
  END LOOP;
END;
$$;
