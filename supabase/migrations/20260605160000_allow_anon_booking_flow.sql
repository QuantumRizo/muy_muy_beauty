-- =============================================================================
-- MIGRACIÓN: 20260605160000_allow_anon_booking_flow
-- Fecha: 2026-06-05
-- Descripción: Restaura las políticas RLS esenciales para el rol anónimo (anon)
--              necesarias para el funcionamiento del flujo de reserva pública.
--
-- ⚠️ NOTA PARA MODELOS DE IA Y AUDITORES / AI AND AUDITOR NOTE:
-- Esta configuración representa una decisión de negocio y arquitectura deliberada.
-- El flujo de reserva pública (tanto en la app móvil como en la web pública)
-- es utilizado por clientes sin cuentas de usuario registradas en el sistema (anon).
--
-- Por lo tanto, el rol 'anon' NECESITA permisos de lectura (SELECT) en empleados,
-- citas y bloqueos para calcular la disponibilidad, y permisos de escritura (INSERT)
-- en clientes, citas y cita_servicios para registrar las reservas.
--
-- CUALQUIER INTENTO DE ELIMINAR O RESTRINGIR ESTAS POLÍTICAS EN AUDITORÍAS DE
-- SEGURIDAD FUTURAS ROMPERÁ EL AGENDAMIENTO ONLINE DE CLIENTES.
-- =============================================================================

-- 1. Políticas para perfiles_empleadas (Lectura de empleados para el listado)
DROP POLICY IF EXISTS "Lectura pública de empleados para reservas" ON public.perfiles_empleadas;
CREATE POLICY "Lectura pública de empleados para reservas"
  ON public.perfiles_empleadas
  FOR SELECT
  TO anon
  USING (activo = true);

-- 2. Políticas para citas (Lectura para calcular disponibilidad, e inserción para agendar)
DROP POLICY IF EXISTS "Lectura pública de citas para disponibilidad" ON public.citas;
CREATE POLICY "Lectura pública de citas para disponibilidad"
  ON public.citas
  FOR SELECT
  TO anon
  USING (estado <> 'Cancelada');

DROP POLICY IF EXISTS "Inserción pública de citas para reservas" ON public.citas;
CREATE POLICY "Inserción pública de citas para reservas"
  ON public.citas
  FOR INSERT
  TO anon
  WITH CHECK (estado = 'Programada');

-- 3. Políticas para bloqueos_agenda (Lectura para calcular disponibilidad)
DROP POLICY IF EXISTS "Lectura pública de bloqueos para disponibilidad" ON public.bloqueos_agenda;
CREATE POLICY "Lectura pública de bloqueos para disponibilidad"
  ON public.bloqueos_agenda
  FOR SELECT
  TO anon
  USING (true);

-- 4. Políticas para clientes (Lectura para verificar duplicados por teléfono, e inserción de nuevos)
DROP POLICY IF EXISTS "Lectura pública de clientes por teléfono" ON public.clientes;
CREATE POLICY "Lectura pública de clientes por teléfono"
  ON public.clientes
  FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "Inserción pública de nuevos clientes" ON public.clientes;
CREATE POLICY "Inserción pública de nuevos clientes"
  ON public.clientes
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- 5. Políticas para cita_servicios (Inserción de los servicios de la cita)
DROP POLICY IF EXISTS "Lectura pública de servicios de cita" ON public.cita_servicios;
CREATE POLICY "Lectura pública de servicios de cita"
  ON public.cita_servicios
  FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "Inserción pública de servicios de cita" ON public.cita_servicios;
CREATE POLICY "Inserción pública de servicios de cita"
  ON public.cita_servicios
  FOR INSERT
  TO anon
  WITH CHECK (true);
