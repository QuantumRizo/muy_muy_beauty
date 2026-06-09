-- Actualiza la función verificar_cliente_por_telefono para incluir el ID del cliente
-- de modo que identificacion.tsx en mobile app pueda obtener el UUID y guardarlo en SecureStore.

CREATE OR REPLACE FUNCTION public.verificar_cliente_por_telefono(p_telefono TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id     UUID;
  v_nombre TEXT;
  v_email  TEXT;
BEGIN
  SELECT id, nombre_completo, email
  INTO   v_id, v_nombre, v_email
  FROM   public.clientes
  WHERE  telefono_cel = p_telefono
  LIMIT  1;

  IF FOUND THEN
    RETURN json_build_object(
      'existe',           true,
      'id',               v_id,
      'nombre_completo',  v_nombre,
      'email',            v_email
    );
  ELSE
    RETURN json_build_object('existe', false);
  END IF;
END;
$$;
