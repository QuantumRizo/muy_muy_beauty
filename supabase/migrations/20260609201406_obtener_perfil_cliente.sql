CREATE OR REPLACE FUNCTION public.obtener_perfil_cliente(p_cliente_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cliente RECORD;
BEGIN
  SELECT id, nombre_completo, telefono_cel, email, created_at, num_cliente
  INTO v_cliente
  FROM public.clientes
  WHERE id = p_cliente_id
  LIMIT 1;

  IF FOUND THEN
    RETURN row_to_json(v_cliente);
  ELSE
    RETURN NULL;
  END IF;
END;
$$;
