-- Enable pgcrypto for hashing (used for PINs)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add pin_hash column to employees table
ALTER TABLE public.perfiles_empleadas 
ADD COLUMN IF NOT EXISTS pin_hash text;

-- Create function to securely set a PIN for an employee
CREATE OR REPLACE FUNCTION public.asignar_pin_empleada(p_empleada_id uuid, p_pin text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.perfiles_empleadas
  SET pin_hash = crypt(p_pin, gen_salt('bf'))
  WHERE id = p_empleada_id;
END;
$$;

-- Create function to verify an employee's PIN for Kiosk Mode
CREATE OR REPLACE FUNCTION public.verificar_pin_empleada(p_empleada_id uuid, p_pin text)
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

  -- If no pin is set or employee not found, return false
  IF v_hash IS NULL THEN
    RETURN false;
  END IF;

  -- Compare the provided pin with the stored hash
  RETURN v_hash = crypt(p_pin, v_hash);
END;
$$;
