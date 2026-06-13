import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useClientVerification(telefono: string, setClientInfo: any) {
  const [isExistingClient, setIsExistingClient] = useState(false)

  useEffect(() => {
    if (telefono.length === 10) {
      supabase.rpc('verificar_cliente_por_telefono', { p_telefono: telefono })
        .then(({ data }) => {
          if (data?.existe) {
            setClientInfo((prev: any) => ({ ...prev, nombre: data.nombre_completo, email: data.email || prev.email }))
            setIsExistingClient(true)
          } else {
            setIsExistingClient(false)
          }
        })
    } else {
      setIsExistingClient(false)
    }
  }, [telefono, setClientInfo])

  return { isExistingClient }
}
