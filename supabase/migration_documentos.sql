-- 1. Crear tabla de documentos
CREATE TABLE public.documentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  archivo_url TEXT NOT NULL,
  peso_bytes BIGINT,
  tipo_mime TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Habilitar Seguridad de Nivel de Fila (RLS)
ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de acceso para la tabla
-- Permitir lectura a todos (o solo usuarios autenticados si tienes Auth configurado)
CREATE POLICY "Permitir lectura de documentos" ON public.documentos FOR SELECT USING (true);
CREATE POLICY "Permitir insertar documentos" ON public.documentos FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir eliminar documentos" ON public.documentos FOR DELETE USING (true);

-- 4. INSTRUCCIONES MANUALES PARA EL STORAGE BUCKET:
-- Tendrás que ir al panel de Supabase -> Storage
-- 1. Haz clic en "New Bucket"
-- 2. Creado con el nombre exacto: documentos_empresa
-- 3. Marca la casilla "Public bucket" para que las URLs de descarga funcionen directo
-- 4. En las "Policies" del Storage, asegúrate de permitir INSERT, SELECT y DELETE.
