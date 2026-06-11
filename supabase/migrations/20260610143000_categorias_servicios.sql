-- Migración para crear la tabla dinámica de categorías de servicios

-- 1. Crear tabla categorias_servicio
CREATE TABLE IF NOT EXISTS public.categorias_servicio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    descripcion TEXT,
    imagen_url TEXT,
    orden INTEGER DEFAULT 0,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Añadir políticas de lectura pública a las categorías
ALTER TABLE public.categorias_servicio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura pública de categorias" 
ON public.categorias_servicio FOR SELECT TO anon USING (true);

CREATE POLICY "Lectura autenticada de categorias" 
ON public.categorias_servicio FOR SELECT TO authenticated USING (true);

-- 3. Modificar la tabla 'servicios' para enlazarla con la categoría
ALTER TABLE public.servicios ADD COLUMN categoria_id UUID REFERENCES public.categorias_servicio(id) ON DELETE SET NULL;

-- 4. Crear el bucket de Storage para las imágenes de las categorías
INSERT INTO storage.buckets (id, name, public) 
VALUES ('categorias', 'categorias', true)
ON CONFLICT (id) DO NOTHING;

-- 5. Crear políticas públicas para el bucket 'categorias'
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'categorias');

CREATE POLICY "Admin Insert Access" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'categorias' AND (auth.role() = 'authenticated'));

-- 6. Insertar las categorías iniciales base (vacías de imagen por ahora)
INSERT INTO public.categorias_servicio (nombre, descripcion, orden) VALUES
('Esmaltado Permanente', 'La novedosa técnica que ha revolucionado el mundo de las uñas: el único esmaltado permanente de larga duración y 20Free.', 1),
('Uñas Esculpidas', 'Uñas esculpidas con las mejores técnicas del mercado: uñas de gel, uñas en acrílico... ¡Ponte en buenas manos!', 2),
('Manicura & Spa', '¡Tus manos hablan de ti! Cuídalas con nuestros servicios de manicura: limar y esmaltar, manicura básica, spa, etc.', 3),
('Cuidado Facial', 'Protocolos de higiene profunda y tratamientos personalizados para una piel luminosa, sana y revitalizada.', 4),
('Masajes Terapéuticos', 'Un refugio para el estrés. Sesiones de relajación profunda y reflexología para restaurar tu equilibrio corporal y mental.', 5),
('Pedicura Avanzada', 'Salud y estética integral para tus pies. Desde relajantes sesiones spa hasta pedicuras técnicas especializadas.', 6),
('Eyes & Brows', 'Realzamos tu mirada. Diseños de cejas y elevación de pestañas que enmarcan tu rostro con elegancia y naturalidad.', 7),
('Depilación Premium', 'Suavidad duradera con técnicas delicadas y efectivas. Una experiencia de depilación profesional en un ambiente de confort.', 8),
('Nail Art & Diseño', 'El toque artístico final. Decoraciones exclusivas y diseños personalizados para que tus uñas sean una obra de arte.', 9);
