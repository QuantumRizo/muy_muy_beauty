CREATE OR REPLACE FUNCTION public.cancelar_cita_cliente(
  p_cita_id UUID,
  p_cliente_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cita_estado TEXT;
BEGIN
  -- Verificar que la cita existe y pertenece al cliente
  SELECT estado INTO v_cita_estado
  FROM public.citas
  WHERE id = p_cita_id AND cliente_id = p_cliente_id;

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Cita no encontrada o no pertenece a este cliente');
  END IF;

  -- Solo se pueden cancelar citas Programadas
  IF v_cita_estado != 'Programada' THEN
    RETURN json_build_object('error', 'Solo se pueden cancelar citas programadas');
  END IF;

  -- Actualizar la cita a Cancelada
  UPDATE public.citas
  SET estado = 'Cancelada'
  WHERE id = p_cita_id;

  RETURN json_build_object('ok', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.cancelar_cita_cliente(UUID, UUID) TO anon;
