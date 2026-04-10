-- ─── Tabla: marketing_configs ─────────────────────────────────────
-- Almacena las configuraciones de integraciones de marketing por plataforma.
-- Cada sucursal puede tener una config activa por plataforma.

CREATE TABLE IF NOT EXISTS marketing_configs (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sucursal_id     UUID REFERENCES sucursales(id) ON DELETE CASCADE,
  platform        TEXT NOT NULL CHECK (platform IN ('meta', 'google')),
  api_key         TEXT NOT NULL,
  account_id      TEXT,
  active          BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE marketing_configs IS 'Claves de API y configuración de integraciones de marketing por sucursal.';
COMMENT ON COLUMN marketing_configs.api_key    IS 'Access Token de la plataforma publicitaria (Meta/Google).';
COMMENT ON COLUMN marketing_configs.account_id IS 'ID de la cuenta publicitaria en la plataforma.';

-- Índice para consultas rápidas por sucursal y plataforma
CREATE UNIQUE INDEX IF NOT EXISTS marketing_configs_sucursal_platform_idx
  ON marketing_configs (sucursal_id, platform)
  WHERE active = TRUE;

-- ─── Tabla: marketing_campanas ─────────────────────────────────────
-- Registro manual o sincronizado de campañas con sus métricas clave.

CREATE TABLE IF NOT EXISTS marketing_campanas (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  config_id       UUID REFERENCES marketing_configs(id) ON DELETE CASCADE,
  sucursal_id     UUID REFERENCES sucursales(id) ON DELETE CASCADE,
  nombre          TEXT NOT NULL,
  platform        TEXT NOT NULL CHECK (platform IN ('meta', 'google', 'otro')),
  estado          TEXT NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa', 'pausada', 'finalizada')),
  fecha_inicio    DATE,
  fecha_fin       DATE,
  presupuesto     NUMERIC(12,2) DEFAULT 0,
  gasto           NUMERIC(12,2) DEFAULT 0,
  impresiones     BIGINT DEFAULT 0,
  clics           BIGINT DEFAULT 0,
  leads           INTEGER DEFAULT 0,
  platform_id     TEXT,  -- ID de la campaña en Meta/Google
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE marketing_campanas IS 'Campañas de marketing con métricas de rendimiento.';

-- Habilitar RLS
ALTER TABLE marketing_configs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_campanas ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas para usuarios autenticados (ajustar según roles)
CREATE POLICY "Autenticados pueden ver marketing_configs"
  ON marketing_configs FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Autenticados pueden ver marketing_campanas"
  ON marketing_campanas FOR ALL
  USING (auth.role() = 'authenticated');
