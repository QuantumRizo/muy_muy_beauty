/**
 * Utilidades para el manejo de slots y colisiones en la agenda.
 */

export function timeToSlots(time: string): number {
  if (!time) return 0
  const [h, m] = time.split(':').map(Number)
  return h * 4 + Math.floor(m / 15)
}

export function slotsToTime(slots: number): string {
  const h = Math.floor(slots / 4)
  const m = (slots % 4) * 15
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

interface Interval {
  start: number
  end: number
}

/**
 * Comprueba si dos intervalos de slots se solapan.
 */
export function haySolapamiento(i1: Interval, i2: Interval): boolean {
  return i1.start < i2.end && i2.start < i1.end
}
