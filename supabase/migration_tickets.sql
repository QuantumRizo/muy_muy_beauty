-- =============================================================
-- MIGRACIÓN: Sistema de Tickets y Cobros (Flowww-style)
-- =============================================================

-- ─── ENUMS ────────────────────────────────────────────────────
-- NOTA: Si ya existen tipos con estos nombres, podrías necesitar borrarlos o renombrarlos.
-- DROP TYPE IF EXISTS ticket_status CASCADE;
-- DROP TYPE IF EXISTS item_tipo CASCADE;
-- DROP TYPE IF EXISTS metodo_pago CASCADE;

CREATE TYPE ticket_status AS ENUM ('Pendiente', 'Pagado', 'Anulado');
CREATE TYPE item_tipo     AS ENUM ('Servicio', 'Producto');
CREATE TYPE metodo_pago   AS ENUM ('Efectivo', 'Tarjeta', 'Transferencia', 'Puntos', 'Bono', 'Anticipo', 'Aplazado', 'Otros');

-- ─── PRODUCTOS (INVENTARIO) ───────────────────────────────────
CREATE TABLE productos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      TEXT NOT NULL,
  descripcion TEXT,
  precio      NUMERIC(10,2) NOT NULL DEFAULT 0,
  stock       INT NOT NULL DEFAULT 0,
  sku         TEXT UNIQUE,
  activo      BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── TICKETS ──────────────────────────────────────────────────
CREATE TABLE tickets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sucursal_id     UUID REFERENCES sucursales(id) ON DELETE CASCADE,
  cliente_id      UUID REFERENCES clientes(id) ON DELETE SET NULL,
  vendedor_id     UUID REFERENCES perfiles_empleadas(id) ON DELETE SET NULL,
  num_ticket      TEXT UNIQUE NOT NULL, -- Ej: T-0001
  fecha           DATE NOT NULL,
  hora            TIME NOT NULL,
  base_imponible  NUMERIC(10,2) NOT NULL DEFAULT 0,
  iva             NUMERIC(10,2) NOT NULL DEFAULT 0,
  total           NUMERIC(10,2) NOT NULL DEFAULT 0,
  descuento       NUMERIC(10,2) DEFAULT 0,
  propina         NUMERIC(10,2) DEFAULT 0,
  estado          ticket_status NOT NULL DEFAULT 'Pendiente',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── TICKET ITEMS ─────────────────────────────────────────────
CREATE TABLE ticket_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id       UUID REFERENCES tickets(id) ON DELETE CASCADE,
  tipo            item_tipo NOT NULL,
  referencia_id   UUID NOT NULL, -- UUID de servicio o producto
  nombre          TEXT NOT NULL, -- Snapshot at time of sale
  cantidad        INT NOT NULL DEFAULT 1,
  precio_unitario NUMERIC(10,2) NOT NULL,
  iva_porcentaje  NUMERIC(5,2) DEFAULT 16.00, -- Ajustado para México (16%)
  descuento       NUMERIC(10,2) DEFAULT 0,

  total           NUMERIC(10,2) NOT NULL
);

-- ─── PAGOS ────────────────────────────────────────────────────
CREATE TABLE pagos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id     UUID REFERENCES tickets(id) ON DELETE CASCADE,
  metodo_pago   metodo_pago NOT NULL,
  importe       NUMERIC(10,2) NOT NULL,
  detalles      JSONB DEFAULT '{}'::jsonb, -- Para IDs de transacciones, etc.
  fecha         DATE NOT NULL,
  hora          TIME NOT NULL
);

-- ─── ACTUALIZAR CITAS ─────────────────────────────────────────
-- Añadir el campo ticket_id a la tabla citas para relacionarlas
ALTER TABLE citas ADD COLUMN ticket_id UUID REFERENCES tickets(id) ON DELETE SET NULL;

-- ─── RLS (Row Level Security) ─────────────────────────────────
ALTER TABLE productos    ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets      ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos        ENABLE ROW LEVEL SECURITY;

-- Por ahora: acceso total (ajustar según auth en producción)
CREATE POLICY "Allow all" ON productos    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON tickets      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON ticket_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON pagos        FOR ALL USING (true) WITH CHECK (true);

-- ─── ÍNDICES ──────────────────────────────────────────────────
CREATE INDEX idx_tickets_fecha    ON tickets(fecha);
CREATE INDEX idx_tickets_cliente  ON tickets(cliente_id);
CREATE INDEX idx_tickets_sucursal ON tickets(sucursal_id);
CREATE INDEX idx_items_ticket     ON ticket_items(ticket_id);
CREATE INDEX idx_pagos_ticket     ON pagos(ticket_id);
