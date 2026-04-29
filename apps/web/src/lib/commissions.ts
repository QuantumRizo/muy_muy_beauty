export interface CommissionThreshold {
  umbral: number;
  porcentaje_con_hoja: number;
  porcentaje_sin_hoja: number;
}

/** Dado un total con IVA, si cumplió hoja, y la tabla de configuración, retorna el % de comisión */
export function calcularPorcentaje(totalConIva: number, cumplioHoja: boolean, tabla: CommissionThreshold[]): number {
  let tramo: CommissionThreshold | null = null
  // Asumimos que la tabla viene ordenada por umbral ascendente
  for (const t of tabla) {
    if (totalConIva >= t.umbral) tramo = t
  }
  if (!tramo) return 0
  return cumplioHoja ? tramo.porcentaje_con_hoja : tramo.porcentaje_sin_hoja
}

export function getTramoStr(totalConIva: number, tabla: CommissionThreshold[]): string {
  if (tabla.length === 0) return 'Sin configuración'
  let tramoStr = `Menos de $${tabla[0].umbral.toLocaleString('es-MX')}`
  for (const t of tabla) {
    if (totalConIva >= t.umbral) {
      tramoStr = `$${t.umbral.toLocaleString('es-MX')}`
    }
  }
  return tramoStr
}
