/**
 * ─── Utilidades de Fecha — Zona Horaria: Ciudad de México ────────────────────
 *
 * REGLA DE ORO:
 *   - Nunca usar `new Date().toISOString().split('T')[0]`
 *     Eso da la fecha en UTC, que puede ser el día siguiente después de las 6 PM.
 *
 *   - Siempre usar `hoyMX()` para obtener la fecha local correcta en México.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

const TZ = 'America/Mexico_City'

/**
 * Devuelve la fecha de HOY en México como string 'YYYY-MM-DD'.
 * Funciona correctamente incluso después de las 6 PM (cuando UTC ya es mañana).
 */
export function hoyMX(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: TZ })
}

/**
 * Devuelve la hora actual en México como string 'HH:MM:SS'.
 */
export function ahoraMXHora(): string {
  return new Date().toLocaleTimeString('en-GB', { timeZone: TZ, hour12: false })
}

/**
 * Devuelve un objeto Date ajustado a la fecha/hora actual de México.
 * Útil para cálculos con horas (ej: comida + 1 hora).
 */
export function ahoraMX(): Date {
  // Convertimos la hora local de México en un objeto Date manipulable
  const str = new Date().toLocaleString('en-CA', { timeZone: TZ, hour12: false })
  return new Date(str)
}

/**
 * Dado un Date (en UTC), devuelve su fecha en México como 'YYYY-MM-DD'.
 * Útil para mostrar fechas de registros guardados en la DB.
 */
export function fechaMX(date: Date): string {
  return date.toLocaleDateString('en-CA', { timeZone: TZ })
}

/**
 * Inicio del mes actual en México como 'YYYY-MM-DD'.
 */
export function inicioMesMX(): string {
  const d = new Date()
  const year = parseInt(d.toLocaleDateString('en-CA', { timeZone: TZ }).split('-')[0])
  const month = parseInt(d.toLocaleDateString('en-CA', { timeZone: TZ }).split('-')[1])
  return `${year}-${String(month).padStart(2, '0')}-01`
}

/**
 * Dado un string 'YYYY-MM-DD' (fecha de México), devuelve el inicio del día
 * en ISO/UTC para queries de columnas `timestamptz` (como created_at).
 *
 * Ejemplo: '2026-06-09' → '2026-06-09T06:00:00.000Z' (porque México es UTC-6)
 */
export function startOfDayMXIso(dateStr: string): string {
  // Crear fecha a medianoche en México y convertir a UTC
  const dt = new Date(dateStr + 'T00:00:00')
  // Obtener el offset de México usando una comparación
  const mxStr = dt.toLocaleString('en-CA', { timeZone: TZ, hour12: false })
  const mxDate = new Date(mxStr)
  const offsetMs = dt.getTime() - mxDate.getTime()
  const midnight = new Date(dateStr + 'T00:00:00')
  midnight.setTime(midnight.getTime() + offsetMs)
  return midnight.toISOString()
}

/**
 * Dado un string 'YYYY-MM-DD' (fecha de México), devuelve el final del día
 * en ISO/UTC para queries de columnas `timestamptz`.
 *
 * Ejemplo: '2026-06-09' → '2026-06-10T05:59:59.999Z'
 */
export function endOfDayMXIso(dateStr: string): string {
  const dt = new Date(dateStr + 'T23:59:59.999')
  const mxStr = dt.toLocaleString('en-CA', { timeZone: TZ, hour12: false })
  const mxDate = new Date(mxStr)
  const offsetMs = dt.getTime() - mxDate.getTime()
  const endOfDay = new Date(dateStr + 'T23:59:59.999')
  endOfDay.setTime(endOfDay.getTime() + offsetMs)
  return endOfDay.toISOString()
}

/**
 * Devuelve los minutos desde medianoche en hora de México.
 * Útil para calcular tolerancias de asistencia.
 */
export function minutosDelDiaMX(): number {
  const parts = ahoraMXHora().split(':')
  return parseInt(parts[0]) * 60 + parseInt(parts[1])
}
