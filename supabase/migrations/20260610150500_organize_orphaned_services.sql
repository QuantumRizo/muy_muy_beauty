-- Asignar Depilación Láser a Depilación Premium
UPDATE public.servicios s
SET categoria_id = c.id
FROM public.categorias_servicio c
WHERE c.nombre = 'Depilación Premium' AND s.familia = 'Depilación Láser';

-- Asignar SUPLEMENTO MANICURA RUSA a Manicura & Spa
UPDATE public.servicios s
SET categoria_id = c.id
FROM public.categorias_servicio c
WHERE c.nombre = 'Manicura & Spa' AND s.nombre = 'SUPLEMENTO MANICURA RUSA';

-- Asignar SUPLEMENTO GUANTE DE KERATINA a Manicura & Spa
UPDATE public.servicios s
SET categoria_id = c.id
FROM public.categorias_servicio c
WHERE c.nombre = 'Manicura & Spa' AND s.nombre = 'SUPLEMENTO GUANTE DE KERATINA';
