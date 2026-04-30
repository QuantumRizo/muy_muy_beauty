ALTER TABLE public.perfiles_usuario 
ADD COLUMN sucursal_id uuid REFERENCES public.sucursales(id) ON DELETE SET NULL;

-- Actualizar política para que se pueda leer el sucursal_id
-- (Ya hay una política "Permitir todo a usuarios autenticados" que debería cubrirlo,
-- pero nos aseguramos de que esté disponible).
