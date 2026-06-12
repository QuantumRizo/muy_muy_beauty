/**
 * Tests unitarios — Lógica de comisiones (lib/commissions.ts)
 *
 * Estas funciones calculan cuánto cobra cada empleada y son
 * críticas para el negocio — cualquier bug tiene impacto económico directo.
 */
import { describe, it, expect } from 'vitest'
import { calcularPorcentaje, getTramoStr } from '../lib/commissions'
import type { CommissionThreshold } from '../lib/commissions'

const TABLA_EJEMPLO: CommissionThreshold[] = [
  { umbral: 0,      porcentaje_con_hoja: 5,  porcentaje_sin_hoja: 3  },
  { umbral: 5000,   porcentaje_con_hoja: 8,  porcentaje_sin_hoja: 5  },
  { umbral: 10000,  porcentaje_con_hoja: 12, porcentaje_sin_hoja: 8  },
  { umbral: 20000,  porcentaje_con_hoja: 15, porcentaje_sin_hoja: 10 },
]

describe('calcularPorcentaje', () => {
  it('retorna 0 cuando la tabla está vacía', () => {
    expect(calcularPorcentaje(10000, true, [])).toBe(0)
  })

  it('retorna el porcentaje del primer tramo cuando el total es 0', () => {
    expect(calcularPorcentaje(0, true, TABLA_EJEMPLO)).toBe(5)
    expect(calcularPorcentaje(0, false, TABLA_EJEMPLO)).toBe(3)
  })

  it('usa porcentaje_con_hoja cuando cumplioHoja es true', () => {
    expect(calcularPorcentaje(5000, true, TABLA_EJEMPLO)).toBe(8)
    expect(calcularPorcentaje(10000, true, TABLA_EJEMPLO)).toBe(12)
    expect(calcularPorcentaje(20000, true, TABLA_EJEMPLO)).toBe(15)
  })

  it('usa porcentaje_sin_hoja cuando cumplioHoja es false', () => {
    expect(calcularPorcentaje(5000, false, TABLA_EJEMPLO)).toBe(5)
    expect(calcularPorcentaje(10000, false, TABLA_EJEMPLO)).toBe(8)
    expect(calcularPorcentaje(20000, false, TABLA_EJEMPLO)).toBe(10)
  })

  it('usa el tramo correcto para valores en el borde exacto del umbral', () => {
    // Valor exactamente en el umbral → debe activar ese tramo
    expect(calcularPorcentaje(5000, true, TABLA_EJEMPLO)).toBe(8)   // exactamente 5000 → tramo 5000
    expect(calcularPorcentaje(4999, true, TABLA_EJEMPLO)).toBe(5)   // justo antes → tramo 0
    expect(calcularPorcentaje(20000, true, TABLA_EJEMPLO)).toBe(15) // exactamente 20000 → tramo 20000
  })

  it('usa el tramo más alto cuando supera el último umbral', () => {
    expect(calcularPorcentaje(50000, true, TABLA_EJEMPLO)).toBe(15)
    expect(calcularPorcentaje(1_000_000, false, TABLA_EJEMPLO)).toBe(10)
  })

  it('maneja tabla de un solo tramo correctamente', () => {
    const tablaSimple: CommissionThreshold[] = [
      { umbral: 0, porcentaje_con_hoja: 10, porcentaje_sin_hoja: 7 },
    ]
    expect(calcularPorcentaje(99999, true, tablaSimple)).toBe(10)
    expect(calcularPorcentaje(99999, false, tablaSimple)).toBe(7)
  })
})

describe('getTramoStr', () => {
  it('retorna "Sin configuración" cuando la tabla está vacía', () => {
    expect(getTramoStr(5000, [])).toBe('Sin configuración')
  })

  it('retorna el rango correcto para valor menor al primer umbral', () => {
    // Con umbral[0] = 0, cualquier valor >= 0 activa ese tramo
    expect(getTramoStr(0, TABLA_EJEMPLO)).toContain('0')
  })

  it('retorna el tramo correcto al superar cada umbral', () => {
    expect(getTramoStr(5000, TABLA_EJEMPLO)).toContain('5,000')
    expect(getTramoStr(10000, TABLA_EJEMPLO)).toContain('10,000')
    expect(getTramoStr(20000, TABLA_EJEMPLO)).toContain('20,000')
  })
})
