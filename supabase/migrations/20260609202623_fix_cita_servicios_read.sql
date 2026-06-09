-- Restaurar permiso de lectura pública para la tabla cita_servicios
-- Esto es necesario para que la app (rol anon) pueda consultar los nombres de los servicios
-- ligados a las citas del cliente en su historial.
CREATE POLICY "Lectura pública de servicios de cita" ON public.cita_servicios FOR SELECT TO anon USING (true);
