-- ============================================================================
-- SCRIPT 1: ELIMINAR DATOS HISTÓRICOS (MANTIENE CONFIGURACIÓN)
-- ============================================================================
-- Este script elimina todos los datos transaccionales de prueba pero 
-- mantiene sucursales, empleadas, servicios, productos, usuarios y configuración.
-- ¡ADVERTENCIA! Ejecuta esto solo en un entorno de desarrollo/pruebas.

TRUNCATE TABLE 
  pagos,
  ticket_items,
  cita_servicios,
  movimientos_caja,
  evaluaciones_hoja,
  asistencia,
  bloqueos_agenda,
  citas,
  tickets,
  turnos_caja,
  clientes
CASCADE;

-- Refrescar las vistas materializadas del dashboard para que muestren ceros
-- (si no se hace, el dashboard seguirá mostrando los datos anteriores)
SELECT refresh_dashboard_views();
