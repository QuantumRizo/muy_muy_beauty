CREATE OR REPLACE FUNCTION public.actualizar_perfil_cliente(
  p_cliente_id UUID,
  p_nombre_completo TEXT,
  p_email TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_nombre_completo IS NULL OR trim(p_nombre_completo) = '' THEN
    RETURN json_build_object('error', 'El nombre no puede estar vacío');
  END IF;

  UPDATE public.clientes
  SET nombre_completo = trim(p_nombre_completo),
      email = NULLIF(trim(p_email), '')
  WHERE id = p_cliente_id;

  IF FOUND THEN
    RETURN json_build_object('ok', true);
  ELSE
    RETURN json_build_object('error', 'Cliente no encontrado');
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.actualizar_perfil_cliente(UUID, TEXT, TEXT) TO anon;
