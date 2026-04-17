-- Actualizar el constraint de roles para permitir 'empleado'
ALTER TABLE public.perfiles_usuario 
DROP CONSTRAINT IF EXISTS perfiles_usuario_rol_check;

ALTER TABLE public.perfiles_usuario 
ADD CONSTRAINT perfiles_usuario_rol_check 
CHECK (rol = ANY (ARRAY['admin'::text, 'superadmin'::text, 'empleado'::text]));

-- Comentario para recordar la estructura
COMMENT ON COLUMN public.perfiles_usuario.rol IS 'Rol del usuario: admin, superadmin o empleado';
