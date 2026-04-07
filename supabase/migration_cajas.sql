-- =============================================================
-- MIGRACIÓN: Módulo de Caja (Turnos y Cortes Estilo Flowww)
-- =============================================================

CREATE TYPE estado_caja AS ENUM ('Abierta', 'Cerrada');
CREATE TYPE tipo_movimiento_caja AS ENUM ('Ingreso Extra', 'Gasto / Salida');

-- ─── TURNOS DE CAJA ───────────────────────────────────────────
CREATE TABLE turnos_caja (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sucursal_id                 UUID REFERENCES sucursales(id) ON DELETE CASCADE,
  empleada_abre_id            UUID REFERENCES perfiles_empleadas(id) ON DELETE SET NULL,
  empleada_cierra_id          UUID REFERENCES perfiles_empleadas(id) ON DELETE SET NULL,
  
  estado                      estado_caja NOT NULL DEFAULT 'Abierta',
  
  fecha_apertura              DATE NOT NULL,
  hora_apertura               TIME NOT NULL,
  fecha_cierre                DATE,
  hora_cierre                 TIME,
  
  monto_apertura_efectivo     NUMERIC(10,2) NOT NULL DEFAULT 0,
  monto_cierre_efectivo_real  NUMERIC(10,2),
  
  -- Estos totales se "congelan" al momento del corte para historial
  total_ventas_efectivo       NUMERIC(10,2) DEFAULT 0,
  total_ventas_tarjeta        NUMERIC(10,2) DEFAULT 0,
  total_ventas_otros          NUMERIC(10,2) DEFAULT 0,
  total_gastos                NUMERIC(10,2) DEFAULT 0,
  total_ingresos_extra        NUMERIC(10,2) DEFAULT 0,
  
  diferencia_efectivo         NUMERIC(10,2), -- Positiva o Negativa
  
  notas_cierre                TEXT,
  created_at                  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── MOVIMIENTOS DE CAJA (GASTOS EXTRA) ───────────────────────
CREATE TABLE movimientos_caja (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  turno_caja_id     UUID REFERENCES turnos_caja(id) ON DELETE CASCADE,
  empleada_id       UUID REFERENCES perfiles_empleadas(id) ON DELETE SET NULL,
  
  tipo              tipo_movimiento_caja NOT NULL,
  monto             NUMERIC(10,2) NOT NULL,
  concepto          TEXT NOT NULL, -- Ej: "Compra de jabón", "Pago de internet"
  fecha             DATE NOT NULL,
  hora              TIME NOT NULL
);

-- ─── RLS (Row Level Security) ─────────────────────────────────
ALTER TABLE turnos_caja      ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_caja ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all" ON turnos_caja      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON movimientos_caja FOR ALL USING (true) WITH CHECK (true);

-- ─── ÍNDICES ──────────────────────────────────────────────────
CREATE INDEX idx_turnos_sucursal ON turnos_caja(sucursal_id);
CREATE INDEX idx_turnos_estado   ON turnos_caja(estado);
CREATE INDEX idx_movimientos_turno ON movimientos_caja(turno_caja_id);
