/**
 * Tests unitarios — Utilidades de slots de agenda (utils/agenda.ts)
 *
 * timeToSlots, slotsToTime y haySolapamiento son la base de todo el
 * sistema de disponibilidad. Un bug aquí afecta booking público y agenda interna.
 */
import { describe, it, expect } from 'vitest'
import { timeToSlots, slotsToTime, haySolapamiento } from '../utils/agenda'

describe('timeToSlots', () => {
  it('convierte "00:00" a slot 0', () => {
    expect(timeToSlots('00:00')).toBe(0)
  })

  it('convierte "09:00" a slot 36', () => {
    // 9h * 4 slots/h = 36
    expect(timeToSlots('09:00')).toBe(36)
  })

  it('convierte "09:15" a slot 37', () => {
    expect(timeToSlots('09:15')).toBe(37)
  })

  it('convierte "09:30" a slot 38', () => {
    expect(timeToSlots('09:30')).toBe(38)
  })

  it('convierte "09:45" a slot 39', () => {
    expect(timeToSlots('09:45')).toBe(39)
  })

  it('convierte "10:00" a slot 40', () => {
    expect(timeToSlots('10:00')).toBe(40)
  })

  it('convierte "20:00" a slot 80 (fin de jornada típico)', () => {
    expect(timeToSlots('20:00')).toBe(80)
  })

  it('convierte "23:45" a slot 95 (último slot del día)', () => {
    expect(timeToSlots('23:45')).toBe(95)
  })

  it('retorna 0 para string vacío (safe default)', () => {
    expect(timeToSlots('')).toBe(0)
  })
})

describe('slotsToTime', () => {
  it('convierte slot 0 a "00:00"', () => {
    expect(slotsToTime(0)).toBe('00:00')
  })

  it('convierte slot 36 a "09:00"', () => {
    expect(slotsToTime(36)).toBe('09:00')
  })

  it('convierte slot 37 a "09:15"', () => {
    expect(slotsToTime(37)).toBe('09:15')
  })

  it('convierte slot 80 a "20:00"', () => {
    expect(slotsToTime(80)).toBe('20:00')
  })

  it('es la función inversa de timeToSlots', () => {
    const tiempos = ['09:00', '09:15', '09:30', '12:00', '15:45', '20:00']
    tiempos.forEach(t => {
      expect(slotsToTime(timeToSlots(t))).toBe(t)
    })
  })
})

describe('haySolapamiento', () => {
  // Representamos citas como intervalos de slots para verificar colisiones

  it('detecta solapamiento total (mismo horario)', () => {
    expect(haySolapamiento({ start: 36, end: 40 }, { start: 36, end: 40 })).toBe(true)
  })

  it('detecta solapamiento parcial al inicio', () => {
    // Cita 1: 09:00-10:00 (slots 36-40), Cita 2: 08:30-09:30 (34-38)
    expect(haySolapamiento({ start: 36, end: 40 }, { start: 34, end: 38 })).toBe(true)
  })

  it('detecta solapamiento parcial al final', () => {
    // Cita 1: 09:00-10:00 (36-40), Cita 2: 09:30-10:30 (38-42)
    expect(haySolapamiento({ start: 36, end: 40 }, { start: 38, end: 42 })).toBe(true)
  })

  it('detecta solapamiento cuando una cita contiene a la otra', () => {
    // Cita 1: 09:00-12:00 (36-48), Cita 2: 10:00-11:00 (40-44)
    expect(haySolapamiento({ start: 36, end: 48 }, { start: 40, end: 44 })).toBe(true)
  })

  it('NO detecta solapamiento cuando las citas son consecutivas (fin == inicio)', () => {
    // Cita 1: 09:00-10:00 (36-40), Cita 2: 10:00-11:00 (40-44)
    // Los intervalos son [36,40) y [40,44) — NO se solapan
    expect(haySolapamiento({ start: 36, end: 40 }, { start: 40, end: 44 })).toBe(false)
  })

  it('NO detecta solapamiento cuando las citas no se tocan', () => {
    // Cita 1: 09:00-10:00 (36-40), Cita 2: 11:00-12:00 (44-48)
    expect(haySolapamiento({ start: 36, end: 40 }, { start: 44, end: 48 })).toBe(false)
  })

  it('NO detecta solapamiento cuando la segunda cita es antes', () => {
    expect(haySolapamiento({ start: 40, end: 44 }, { start: 36, end: 40 })).toBe(false)
  })
})
