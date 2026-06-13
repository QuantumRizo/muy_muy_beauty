import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { supabase } from '../lib/supabase'
import { timeToSlots, slotsToTime } from '../utils/agenda'
import type { Sucursal, Servicio, Empleada } from '../types/database'

// ─── HELPERS ──────────────────────────────────────────────────
export function getSucursalHours(sucursal: Sucursal, date: Date): { start: number; end: number } {
  const dow = date.getDay() // 0=Dom, 6=Sáb
  const hpd = sucursal.horarios_por_dia
  if (hpd && hpd[dow] && !hpd[dow].cerrado) {
    return {
      start: parseInt(hpd[dow].apertura.split(':')[0], 10),
      end:   parseInt(hpd[dow].cierre.split(':')[0], 10),
    }
  }
  // Fallback: algunos valores legacy pueden llegar como nanosegundos enteros (PostgreSQL interval)
  const toHour = (val: string | number | null | undefined): number => {
    if (typeof val === 'string') return parseInt(val.split(':')[0], 10)
    if (typeof val === 'number') return Math.floor(val / 3_600_000_000_000) // nanoseconds → hours
    return 10 // safe default
  }
  const esFinde = dow === 0 || dow === 6
  const apertura = esFinde ? (sucursal.hora_apertura_finde ?? sucursal.hora_apertura) : sucursal.hora_apertura
  const cierre   = esFinde ? (sucursal.hora_cierre_finde   ?? sucursal.hora_cierre)   : sucursal.hora_cierre
  return { start: toHour(apertura) || 10, end: toHour(cierre) || 20 }
}

export function useBookingAvailability(
  selectedDate: Date | null,
  selectedSucursal: Sucursal | null,
  selectedServicios: Servicio[],
  perfiles: Empleada[],
  selectedProfesional: string | null
) {
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [fetchingSlots, setFetchingSlots] = useState(false)

  useEffect(() => {
    if (selectedDate && selectedSucursal && selectedServicios.length > 0 && perfiles.length > 0) {
      async function checkAvailability() {
        setFetchingSlots(true)
        const dateStr = format(selectedDate!, 'yyyy-MM-dd')
        const totalDuration = selectedServicios.reduce((acc, s) => acc + s.duracion_slots, 0)

        // Horario real de la sucursal para el día seleccionado
        const { start: START_HOUR, end: END_HOUR } = getSucursalHours(selectedSucursal!, selectedDate!)

        try {
          const [resCitas, resBloqueos] = await Promise.all([
            supabase.from('citas')
              .select('bloque_inicio, duracion_manual_slots, empleada_id')
              .eq('fecha', dateStr)
              .neq('estado', 'Cancelada'),
            supabase.from('bloqueos_agenda')
              .select('hora_inicio, hora_fin, empleada_id')
              .eq('fecha', dateStr)
          ])

          const citas = resCitas.data || []
          const bloqueos = resBloqueos.data || []

          const slotsFound = new Set<string>()

          const perfilesToCheck = selectedProfesional
            ? perfiles.filter(p => p.id === selectedProfesional)
            : perfiles

          perfilesToCheck.forEach(emp => {
            const occupied = new Array(96).fill(false)
            citas.filter(c => c.empleada_id === emp.id).forEach(c => {
              const start    = timeToSlots(c.bloque_inicio)
              const duration = c.duracion_manual_slots || 4
              for (let i = 0; i < duration; i++) if (start + i < 96) occupied[start + i] = true
            })
            bloqueos.filter(b => b.empleada_id === emp.id).forEach(b => {
              const start = timeToSlots(b.hora_inicio)
              const end   = timeToSlots(b.hora_fin)
              for (let i = start; i < end; i++) if (i < 96) occupied[i] = true
            })
            for (let h = START_HOUR; h < END_HOUR; h++) {
              for (let m = 0; m < 60; m += 15) {
                const sIndex = h * 4 + m / 15
                let canFit = true
                for (let i = 0; i < totalDuration; i++) {
                  if (sIndex + i >= 96 || occupied[sIndex + i]) {
                    canFit = false
                    break
                  }
                }
                if (canFit) {
                  slotsFound.add(slotsToTime(sIndex))
                }
              }
            }
          })
          setAvailableSlots(Array.from(slotsFound).sort())
        } catch (err) {
          console.error(err)
        } finally {
          setFetchingSlots(false)
        }
      }
      checkAvailability()
    } else {
      setAvailableSlots([])
    }
  }, [selectedDate, selectedSucursal, selectedServicios, perfiles, selectedProfesional])

  return { availableSlots, fetchingSlots }
}
