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

/** Devuelve la fecha de HOY en México como string 'YYYY-MM-DD'. */
export function hoyMX(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: TZ })
}

/** Devuelve la hora actual en México como string 'HH:MM:SS'. */
export function ahoraMXHora(): string {
  return new Date().toLocaleTimeString('en-GB', { timeZone: TZ, hour12: false })
}

/** Devuelve un objeto Date ajustado a la fecha/hora actual de México. */
export function ahoraMX(): Date {
  const str = new Date().toLocaleString('en-CA', { timeZone: TZ, hour12: false })
  return new Date(str)
}

/** Dado un Date (en UTC), devuelve su fecha en México como 'YYYY-MM-DD'. */
export function fechaMX(date: Date): string {
  return date.toLocaleDateString('en-CA', { timeZone: TZ })
}
