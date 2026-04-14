-- ══════════════════════════════════════════════════════════════
-- MIGRACIÓN: Empleadas por sucursal + Cabinas en agenda
-- Fecha: 2026-04-14
-- ══════════════════════════════════════════════════════════════

-- ── 1. NUEVAS COLUMNAS ────────────────────────────────────────

-- Asociar empleadas a una sucursal específica
ALTER TABLE public.perfiles_empleadas
  ADD COLUMN IF NOT EXISTS sucursal_id uuid REFERENCES public.sucursales(id) ON DELETE SET NULL;

-- Cabinas configurables por sucursal (default: 1 extra)
ALTER TABLE public.sucursales
  ADD COLUMN IF NOT EXISTS num_cabinas integer NOT NULL DEFAULT 1;


-- ── 2. LIMPIAR EMPLEADAS ACTUALES ────────────────────────────
-- NOTA: Se pone a NULL el empleada_id en citas antes de borrar
-- para no romper registros históricos de citas.

UPDATE public.citas SET empleada_id = NULL WHERE empleada_id IS NOT NULL;
UPDATE public.bloqueos_agenda SET empleada_id = NULL WHERE empleada_id IS NOT NULL;
UPDATE public.asistencia SET empleada_id = NULL WHERE empleada_id IS NOT NULL;
UPDATE public.tickets SET vendedor_id = NULL WHERE vendedor_id IS NOT NULL;
UPDATE public.ticket_items SET vendedor_id = NULL WHERE vendedor_id IS NOT NULL;
UPDATE public.movimientos_caja SET empleada_id = NULL WHERE empleada_id IS NOT NULL;
UPDATE public.turnos_caja SET empleada_abre_id = NULL WHERE empleada_abre_id IS NOT NULL;
UPDATE public.turnos_caja SET empleada_cierra_id = NULL WHERE empleada_cierra_id IS NOT NULL;
UPDATE public.evaluaciones_hoja SET empleada_id = (SELECT id FROM public.perfiles_empleadas LIMIT 1) WHERE TRUE;
DELETE FROM public.evaluaciones_hoja;

DELETE FROM public.perfiles_empleadas;


-- ── 3. INSERTAR NUEVAS EMPLEADAS ─────────────────────────────
-- Usamos subconsultas para obtener el UUID real de cada sucursal por nombre.
-- Asegúrate de que tus sucursales se llamen exactamente:
--   Newton, Eliseos, Euler, Homero  (sin acentos extra)

INSERT INTO public.perfiles_empleadas (nombre, activo, fecha_contratacion, sueldo_diario, sucursal_id)
VALUES

  -- ── NEWTON ──────────────────────────────────────────────────
  ('DANIELA UGALDE CASTAÑEDA',          true, '2020-06-03', 315.00,
    (SELECT id FROM public.sucursales WHERE nombre ILIKE '%newton%' LIMIT 1)),
  ('JOSS AGUILAR',                      true, NULL,         NULL,
    (SELECT id FROM public.sucursales WHERE nombre ILIKE '%newton%' LIMIT 1)),
  ('ITZEL LOPEZ SOLORZANO',             true, '2022-08-01', 315.00,
    (SELECT id FROM public.sucursales WHERE nombre ILIKE '%newton%' LIMIT 1)),
  ('NADIA VALERIA MEDINA CHAVEZ',       true, '2023-09-04', 315.00,
    (SELECT id FROM public.sucursales WHERE nombre ILIKE '%newton%' LIMIT 1)),
  ('MARIA ESTHER RAMIREZ VALENCIA',     true, '2023-05-24', 315.00,
    (SELECT id FROM public.sucursales WHERE nombre ILIKE '%newton%' LIMIT 1)),
  ('GRETEL RODRIGUEZ RODRIGUEZ',        true, NULL,         NULL,
    (SELECT id FROM public.sucursales WHERE nombre ILIKE '%newton%' LIMIT 1)),
  ('NATACHA YOSELIN CHIRINOS SANGUINETT', true, NULL,       NULL,
    (SELECT id FROM public.sucursales WHERE nombre ILIKE '%newton%' LIMIT 1)),
  ('VALERIA PEDROSA CARDOSO',           true, '2024-10-31', 400.00,
    (SELECT id FROM public.sucursales WHERE nombre ILIKE '%newton%' LIMIT 1)),
  ('GUADALUPE TONATZIN DELGADO SUBIAS', true, NULL,         400.00,
    (SELECT id FROM public.sucursales WHERE nombre ILIKE '%newton%' LIMIT 1)),

  -- ── ELISEOS ──────────────────────────────────────────────────
  ('REBECA LEDEZMA',                    true, '2025-01-01', 400.00,
    (SELECT id FROM public.sucursales WHERE nombre ILIKE '%elis%' LIMIT 1)),
  ('ITZEL DENISSE VARGAS ESPINOSA',     true, '2026-02-25', 333.00,
    (SELECT id FROM public.sucursales WHERE nombre ILIKE '%elis%' LIMIT 1)),
  ('ROSA SANCHEZ ESCALONA',             true, '2023-09-24', 400.00,
    (SELECT id FROM public.sucursales WHERE nombre ILIKE '%elis%' LIMIT 1)),
  ('ANALIA CRUZ ANAYA',                 true, NULL,         500.00,
    (SELECT id FROM public.sucursales WHERE nombre ILIKE '%elis%' LIMIT 1)),

  -- ── EULER ────────────────────────────────────────────────────
  ('KARLA YANELI PEREZ GASPAR',         true, '2022-05-10', 315.00,
    (SELECT id FROM public.sucursales WHERE nombre ILIKE '%euler%' LIMIT 1)),
  ('MAYERLIN VARGAS',                   true, '2024-10-31', 315.00,
    (SELECT id FROM public.sucursales WHERE nombre ILIKE '%euler%' LIMIT 1)),
  ('ESTEPHANI JOANA ARELLANO SEGUNDO',  true, '2023-10-18', 350.00,
    (SELECT id FROM public.sucursales WHERE nombre ILIKE '%euler%' LIMIT 1)),
  ('PRISCILA ORALIA MARIN BAJO',        true, NULL,         315.00,
    (SELECT id FROM public.sucursales WHERE nombre ILIKE '%euler%' LIMIT 1)),

  -- ── HOMERO ───────────────────────────────────────────────────
  ('NORMA ANGELICA HERNANDEZ',          true, '2024-10-18', 400.00,
    (SELECT id FROM public.sucursales WHERE nombre ILIKE '%homero%' LIMIT 1)),
  ('ESPERANZA MONTSERRAT GUERRA',       true, '2025-09-04', 400.00,
    (SELECT id FROM public.sucursales WHERE nombre ILIKE '%homero%' LIMIT 1)),
  ('PAULA LETICIA MENDOZA MENDEZ',      true, '2023-08-01', 315.04,
    (SELECT id FROM public.sucursales WHERE nombre ILIKE '%homero%' LIMIT 1));


-- ── 4. VERIFICACIÓN (resultados finales) ─────────────────────
-- Puedes ver el resultado con:
-- SELECT p.nombre, s.nombre as sucursal FROM perfiles_empleadas p LEFT JOIN sucursales s ON p.sucursal_id = s.id ORDER BY s.nombre, p.nombre;
