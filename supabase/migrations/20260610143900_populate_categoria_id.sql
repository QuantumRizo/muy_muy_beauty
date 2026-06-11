-- Migración para poblar el categoria_id en base a la columna familia

UPDATE public.servicios s
SET categoria_id = c.id
FROM public.categorias_servicio c
WHERE TRIM(LOWER(s.familia)) = TRIM(LOWER(c.nombre));
