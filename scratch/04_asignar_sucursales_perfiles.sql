-- SQL para asignar las sucursales por defecto a los perfiles en Supabase real

-- 1. Primero, asegúrate de tener los IDs de tus sucursales. 
-- Puedes verlos ejecutando: SELECT id, nombre FROM public.sucursales;

-- Reemplaza 'ID_DE_LA_SUCURSAL' con el UUID real de cada una:

-- Newton
UPDATE public.perfiles_usuario 
SET sucursal_id = 'ID_SUCURSAL_NEWTON' 
WHERE email = 'newton@muymuy.com';

-- Campos
UPDATE public.perfiles_usuario 
SET sucursal_id = 'ID_SUCURSAL_CAMPOS' 
WHERE email = 'campos@muymuy.com';

-- Homero
UPDATE public.perfiles_usuario 
SET sucursal_id = 'ID_SUCURSAL_HOMERO' 
WHERE email = 'homero@muymuy.com';

-- Euler
UPDATE public.perfiles_usuario 
SET sucursal_id = 'ID_SUCURSAL_EULER' 
WHERE email = 'euler@muymuy.com';
