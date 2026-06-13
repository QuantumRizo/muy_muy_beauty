import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Sucursal, Servicio, Empleada } from '../types/database'

export function useBookingData(selectedSucursal: Sucursal | null) {
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [perfiles, setPerfiles] = useState<Empleada[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const [resSuc, resSer] = await Promise.all([
        supabase.from('sucursales').select('*').order('nombre'),
        supabase.from('servicios').select('*, categoria:categorias_servicio(nombre)').eq('activo', true).order('nombre')
      ])
      if (resSuc.data) setSucursales(resSuc.data)
      if (resSer.data) setServicios(resSer.data)
      setLoading(false)
    }
    fetchData()
  }, [])

  useEffect(() => {
    if (selectedSucursal) {
      supabase.from('perfiles_empleadas')
        .select('*')
        .eq('activo', true)
        .eq('sucursal_id', selectedSucursal.id)
        .then(({ data }) => {
          if (data) setPerfiles(data)
        })
    } else {
      setPerfiles([])
    }
  }, [selectedSucursal])

  return { sucursales, servicios, perfiles, loading }
}
