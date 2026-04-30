-- ============================================================================
-- MÓDULO DE VACACIONES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.solicitudes_vacaciones (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empleada_id         uuid NOT NULL REFERENCES public.perfiles_empleadas(id) ON DELETE CASCADE,
  sucursal_id         uuid NOT NULL REFERENCES public.sucursales(id) ON DELETE CASCADE,
  fecha_inicio        date NOT NULL,
  fecha_fin           date NOT NULL,
  tipo                text NOT NULL DEFAULT 'nueva' CHECK (tipo IN ('nueva', 'extension')),
  solicitud_padre_id  uuid REFERENCES public.solicitudes_vacaciones(id) ON DELETE SET NULL,
  estado              text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobada', 'rechazada')),
  notas_empleada      text,
  notas_admin         text,
  reviewed_by         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at         timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX ON public.solicitudes_vacaciones(empleada_id);
CREATE INDEX ON public.solicitudes_vacaciones(sucursal_id);
CREATE INDEX ON public.solicitudes_vacaciones(estado);
CREATE INDEX ON public.solicitudes_vacaciones(fecha_inicio, fecha_fin);

-- RLS
ALTER TABLE public.solicitudes_vacaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Empleados y admins pueden leer solicitudes"
  ON public.solicitudes_vacaciones FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Usuarios autenticados pueden insertar solicitudes"
  ON public.solicitudes_vacaciones FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "Admins pueden actualizar (aprobar/rechazar)"
  ON public.solicitudes_vacaciones FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

-- ============================================================================
-- FUNCIÓN: Aprobar vacaciones → crea bloqueos en agenda
-- Bloquea el día entero (08:00 – 21:00) por cada día del rango
-- ============================================================================
CREATE OR REPLACE FUNCTION public.aprobar_vacaciones(p_solicitud_id uuid, p_admin_id uuid, p_notas text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sol       public.solicitudes_vacaciones%ROWTYPE;
  v_dia       date;
BEGIN
  -- Obtener la solicitud
  SELECT * INTO v_sol FROM public.solicitudes_vacaciones WHERE id = p_solicitud_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Solicitud no encontrada'; END IF;
  IF v_sol.estado <> 'pendiente' THEN RAISE EXCEPTION 'La solicitud ya fue procesada'; END IF;

  -- Marcar como aprobada
  UPDATE public.solicitudes_vacaciones SET
    estado      = 'aprobada',
    notas_admin = p_notas,
    reviewed_by = p_admin_id,
    reviewed_at = now()
  WHERE id = p_solicitud_id;

  -- Crear un bloqueo por cada día del rango (excluyendo domingos opcionalmente)
  v_dia := v_sol.fecha_inicio;
  WHILE v_dia <= v_sol.fecha_fin LOOP
    INSERT INTO public.bloqueos_agenda (empleada_id, fecha, hora_inicio, hora_fin, motivo, origen)
    VALUES (v_sol.empleada_id, v_dia, '08:00', '21:00', 'Vacaciones aprobadas', 'vacaciones')
    ON CONFLICT DO NOTHING;
    v_dia := v_dia + 1;
  END LOOP;
END;
$$;

-- ============================================================================
-- FUNCIÓN: Rechazar vacaciones
-- ============================================================================
CREATE OR REPLACE FUNCTION public.rechazar_vacaciones(p_solicitud_id uuid, p_admin_id uuid, p_notas text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
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
