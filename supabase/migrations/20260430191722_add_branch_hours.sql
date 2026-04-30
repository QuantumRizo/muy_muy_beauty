ALTER TABLE public.sucursales 
ADD COLUMN hora_apertura TIME NOT NULL DEFAULT '08:00:00',
ADD COLUMN hora_cierre TIME NOT NULL DEFAULT '21:00:00';

-- Update the approval function to use branch hours
DROP FUNCTION IF EXISTS public.aprobar_vacaciones(uuid, uuid, text);
CREATE OR REPLACE FUNCTION public.aprobar_vacaciones(
  p_solicitud_id uuid,
  p_admin_id uuid,
  p_notas text
) RETURNS void AS $$
DECLARE
  v_sol       public.solicitudes_vacaciones%ROWTYPE;
  v_suc       public.sucursales%ROWTYPE;
  v_dia       date;
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
    INSERT INTO public.bloqueos_agenda (empleada_id, fecha, hora_inicio, hora_fin, motivo, origen)
    VALUES (v_sol.empleada_id, v_dia, v_suc.hora_apertura, v_suc.hora_cierre, 'Vacaciones aprobadas', 'vacaciones')
    ON CONFLICT DO NOTHING;
    v_dia := v_dia + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment for documentation
COMMENT ON COLUMN public.sucursales.hora_apertura IS 'Hora en que la sucursal abre y empieza la agenda';
COMMENT ON COLUMN public.sucursales.hora_cierre IS 'Hora en que la sucursal cierra y termina la agenda';
