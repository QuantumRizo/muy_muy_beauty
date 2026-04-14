/**
 * @muymuy/logic
 *
 * Lógica de negocio compartida entre web y mobile.
 * Sin dependencias de UI — puro TypeScript.
 *
 * Uso: import { calcularPorcentaje, TABLA_COMISION } from '@muymuy/logic'
 */

// ─── Tabla de comisiones ────────────────────────────────────────
export const TABLA_COMISION: { umbral: number; conHoja: number; sinHoja: number }[] = [
  { umbral: 24000, conHoja: 4.0, sinHoja: 2.0 },
  { umbral: 30000, conHoja: 4.5, sinHoja: 2.5 },
  { umbral: 36000, conHoja: 5.0, sinHoja: 3.0 },
  { umbral: 42000, conHoja: 5.5, sinHoja: 3.5 },
  { umbral: 48000, conHoja: 6.0, sinHoja: 4.0 },
  { umbral: 54000, conHoja: 6.5, sinHoja: 4.5 },
  { umbral: 60000, conHoja: 7.0, sinHoja: 5.0 },
  { umbral: 66000, conHoja: 7.5, sinHoja: 5.5 },
  { umbral: 72000, conHoja: 8.0, sinHoja: 6.0 },
  { umbral: 78000, conHoja: 8.5, sinHoja: 6.5 },
  { umbral: 84000, conHoja: 9.0, sinHoja: 7.0 },
]

/**
 * Dado un total con IVA y si cumplió hoja, retorna el % de comisión.
 * Retorna 0 si no llega al umbral mínimo.
 */
export function calcularPorcentaje(totalConIva: number, cumplioHoja: boolean): number {
  let tramo: typeof TABLA_COMISION[0] | null = null
  for (const t of TABLA_COMISION) {
    if (totalConIva >= t.umbral) tramo = t
  }
  if (!tramo) return 0
  return cumplioHoja ? tramo.conHoja : tramo.sinHoja
}

/** Retorna la etiqueta de texto del tramo de ventas. */
export function getTramoStr(totalConIva: number): string {
  let tramoStr = 'Menos de $24,000'
  for (const t of TABLA_COMISION) {
    if (totalConIva >= t.umbral) {
      tramoStr = `$${t.umbral.toLocaleString('es-MX')}`
    }
  }
  return tramoStr
}

/**
 * Calcula la comisión final de una profesional.
 * @param totalConIva  Ventas del mes incluyendo IVA
 * @param cumplioHoja  Si cumplió metas de hoja ese mes
 * @returns Monto de comisión en MXN
 */
export function calcularComision(totalConIva: number, cumplioHoja: boolean): number {
  const porcentaje = calcularPorcentaje(totalConIva, cumplioHoja)
  const basesinIva = totalConIva / 1.16
  return (basesinIva * porcentaje) / 100
}

// ─── Formatters compartidos ─────────────────────────────────────
export const formatMXN = (n: number): string =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(n)
