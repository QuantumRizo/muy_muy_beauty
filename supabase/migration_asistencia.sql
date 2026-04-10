-- ─── Tabla: asistencia ────────────────────────────────────────────────
-- Registro de llegada (check-in) de empleados por sucursal.

CREATE TABLE IF NOT EXISTS asistencia (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sucursal_id     UUID NOT NULL REFERENCES sucursales(id) ON DELETE CASCADE,
  empleada_id     UUID NOT NULL REFERENCES perfiles_empleadas(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE asistencia ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas (ajustar según roles de seguridad si es necesario)
CREATE POLICY "Autenticados pueden ver asistencia"
  ON asistencia FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Autenticados pueden registrar asistencia"
  ON asistencia FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Índice para consultas por sucursal y fecha (para ver quién llegó hoy)
CREATE INDEX IF NOT EXISTS idx_asistencia_sucursal_fecha
  ON asistencia (sucursal_id, created_at);
