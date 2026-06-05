-- Fix broken functions introduced by security hardening

-- 1. Drop the incorrect function with the wrong signature
DROP FUNCTION IF EXISTS public.validar_disponibilidad_cita(uuid, date, time without time zone, time without time zone, uuid);

-- 2. Restore and harden the original trigger function
CREATE OR REPLACE FUNCTION public.validar_disponibilidad_cita()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  conflict_count INT;
  v_new_end_time TIME;
BEGIN
  IF NEW.duracion_manual_slots IS NULL THEN
     NEW.duracion_manual_slots := 4;
  END IF;
  
  v_new_end_time := NEW.bloque_inicio + (NEW.duracion_manual_slots * 15 || ' minutes')::interval;

  -- Checar con otras citas agendadas
  SELECT count(*) INTO conflict_count
  FROM citas
  WHERE empleada_id = NEW.empleada_id
    AND fecha = NEW.fecha
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000')
    AND estado != 'Cancelada'
    AND estado != 'No asistió'
    AND (
      (NEW.bloque_inicio, v_new_end_time) OVERLAPS 
      (bloque_inicio, bloque_inicio + (COALESCE(duracion_manual_slots, 4) * 15 || ' minutes')::interval)
    );

  IF conflict_count > 0 THEN
    RAISE EXCEPTION 'Horario ocupado (Cita existente) para la profesional seleccionada en esta fecha.';
  END IF;

  -- Checar con bloqueos de agenda físicos (Comida/Descansos)
  SELECT count(*) INTO conflict_count
  FROM bloqueos_agenda
  WHERE empleada_id = NEW.empleada_id
    AND fecha = NEW.fecha
    AND (
      (NEW.bloque_inicio, v_new_end_time) OVERLAPS 
      (hora_inicio, hora_fin)
    );
    
  IF conflict_count > 0 THEN
    RAISE EXCEPTION 'Horario bloqueado (Descanso/Comida) para la profesional seleccionada.';
  END IF;

  RETURN NEW;
END;
$function$
;

-- 3. Restore and harden the original folio function returning integer
DROP FUNCTION IF EXISTS public.siguiente_folio_ticket(uuid);
CREATE OR REPLACE FUNCTION public.siguiente_folio_ticket(p_sucursal_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  v_nuevo INT;
BEGIN
  -- Si no existe fila para esta sucursal, crearla
  INSERT INTO folios_ticket (sucursal_id, ultimo_numero)
  VALUES (p_sucursal_id, 0)
  ON CONFLICT (sucursal_id) DO NOTHING;

  -- Incrementar y obtener el nuevo número atómicamente
  UPDATE folios_ticket
  SET ultimo_numero = ultimo_numero + 1
  WHERE sucursal_id = p_sucursal_id
  RETURNING ultimo_numero INTO v_nuevo;

  RETURN v_nuevo;
END;
$function$
;

-- 4. Fix search_path on aprobar_vacaciones which was overwritten by migration 16
CREATE OR REPLACE FUNCTION public.aprobar_vacaciones(p_solicitud_id uuid, p_admin_id uuid, p_notas text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
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
$function$
;
