-- Update service names and data
-- 1. Rename LONG LASTING -> RUBBER
UPDATE servicios SET nombre = 'ESMALTADO RUBBER' WHERE id = '1adf6cb4-75d3-466a-a875-70cca16866f2';

-- 2. Rename DECORACION FRANCES -> DECORACION FRENCH
UPDATE servicios SET nombre = 'DECORACION FRENCH' WHERE id = 'e8d4e1fc-ee43-429c-9fa5-9872f33fb5d6';

-- 3. Update duration slots for tiered decoration services
UPDATE servicios SET duracion_slots = 2 WHERE id IN (
  '10000000-0000-4000-8000-000000000200',
  '10000000-0000-4000-8000-000000000250'
);
UPDATE servicios SET duracion_slots = 3 WHERE id IN (
  '10000000-0000-4000-8000-000000000300',
  '10000000-0000-4000-8000-000000000350',
  '10000000-0000-4000-8000-000000000400',
  '10000000-0000-4000-8000-000000000450'
);
UPDATE servicios SET duracion_slots = 4 WHERE id = '10000000-0000-4000-8000-000000000500';

-- 4. Insert new tiered decoration services if they don't exist
INSERT INTO servicios (id, nombre, duracion_slots, precio, activo, categoria_id)
VALUES
  ('10000000-0000-4000-8000-000000000050', 'DECORACION $50', 1, 50.00, true, 'bb2219d8-518a-40f3-9c52-2ba1b3f4e402'),
  ('10000000-0000-4000-8000-000000000100', 'DECORACION $100', 1, 100.00, true, 'bb2219d8-518a-40f3-9c52-2ba1b3f4e402'),
  ('10000000-0000-4000-8000-000000000150', 'DECORACION $150', 1, 150.00, true, 'bb2219d8-518a-40f3-9c52-2ba1b3f4e402'),
  ('10000000-0000-4000-8000-000000000200', 'DECORACION $200', 2, 200.00, true, 'bb2219d8-518a-40f3-9c52-2ba1b3f4e402'),
  ('10000000-0000-4000-8000-000000000250', 'DECORACION $250', 2, 250.00, true, 'bb2219d8-518a-40f3-9c52-2ba1b3f4e402'),
  ('10000000-0000-4000-8000-000000000300', 'DECORACION $300', 3, 300.00, true, 'bb2219d8-518a-40f3-9c52-2ba1b3f4e402'),
  ('10000000-0000-4000-8000-000000000350', 'DECORACION $350', 3, 350.00, true, 'bb2219d8-518a-40f3-9c52-2ba1b3f4e402'),
  ('10000000-0000-4000-8000-000000000400', 'DECORACION $400', 3, 400.00, true, 'bb2219d8-518a-40f3-9c52-2ba1b3f4e402'),
  ('10000000-0000-4000-8000-000000000450', 'DECORACION $450', 3, 450.00, true, 'bb2219d8-518a-40f3-9c52-2ba1b3f4e402'),
  ('10000000-0000-4000-8000-000000000500', 'DECORACION $500', 4, 500.00, true, 'bb2219d8-518a-40f3-9c52-2ba1b3f4e402')
ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  duracion_slots = EXCLUDED.duracion_slots,
  precio = EXCLUDED.precio;

-- 5. Insert Vitamina and Retiro de Gel if they don't exist
INSERT INTO servicios (id, nombre, duracion_slots, precio, activo, categoria_id)
VALUES
  ('f0000000-0000-4000-8000-000000000001', 'VITAMINA', 1, 100.00, true, 'a1eabd89-96d7-43f5-a443-0baeffe70129'),
  ('f0000000-0000-4000-8000-000000000002', 'RETIRO DE GEL', 1, 60.00, true, 'a1eabd89-96d7-43f5-a443-0baeffe70129')
ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  duracion_slots = EXCLUDED.duracion_slots,
  precio = EXCLUDED.precio;
