-- Create function to verify if an employee has a PIN configured
CREATE OR REPLACE FUNCTION public.tiene_pin_empleada(p_empleada_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hash text;
BEGIN
  SELECT pin_hash INTO v_hash
  FROM public.perfiles_empleadas
  WHERE id = p_empleada_id;

  RETURN v_hash IS NOT NULL;
END;
$$;
