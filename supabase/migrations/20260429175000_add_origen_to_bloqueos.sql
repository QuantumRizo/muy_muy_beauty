-- Agregar columna 'origen' a bloqueos_agenda para distinguir
-- bloqueos manuales (especiales) de los automáticos por asistencia (comida/no llegó)
ALTER TABLE public.bloqueos_agenda
  ADD COLUMN IF NOT EXISTS origen TEXT NOT NULL DEFAULT 'manual';

-- Los bloqueos existentes son todos manuales
UPDATE public.bloqueos_agenda SET origen = 'manual' WHERE origen IS NULL;

-- Índice para facilitar borrado eficiente de bloqueos de comida
CREATE INDEX IF NOT EXISTS idx_bloqueos_origen_empleada
  ON public.bloqueos_agenda (empleada_id, origen, fecha);
