CREATE TABLE public.config_comisiones (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    umbral numeric NOT NULL,
    porcentaje_con_hoja numeric NOT NULL,
    porcentaje_sin_hoja numeric NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT config_comisiones_pkey PRIMARY KEY (id)
);

-- Habilitar RLS
ALTER TABLE public.config_comisiones ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
CREATE POLICY "Permitir lectura a usuarios autenticados" ON public.config_comisiones
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Permitir lectura a anon" ON public.config_comisiones
    FOR SELECT TO anon USING (true);

-- Insertar datos iniciales
INSERT INTO public.config_comisiones (umbral, porcentaje_con_hoja, porcentaje_sin_hoja) VALUES
(24000, 4.0, 2.0),
(30000, 4.5, 2.5),
(36000, 5.0, 3.0),
(42000, 5.5, 3.5),
(48000, 6.0, 4.0),
(54000, 6.5, 4.5),
(60000, 7.0, 5.0),
(66000, 7.5, 5.5),
(72000, 8.0, 6.0),
(78000, 8.5, 6.5),
(84000, 9.0, 7.0);
