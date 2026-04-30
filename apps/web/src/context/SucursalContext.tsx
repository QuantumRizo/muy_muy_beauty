import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { useAuthContext } from './AuthContext'

interface SucursalContextType {
  selectedSucursalId: string
  setSelectedSucursalId: (id: string) => void
}

const SucursalContext = createContext<SucursalContextType | undefined>(undefined)

const STORAGE_KEY = 'sn_selected_sucursal_id'

export function SucursalProvider({ children }: { children: React.ReactNode }) {
  const [selectedSucursalId, setSelectedSucursalIdState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY) || ''
  })

  const setSelectedSucursalId = (id: string) => {
    setSelectedSucursalIdState(id)
    localStorage.setItem(STORAGE_KEY, id)
  }

  // Auto-select based on user profile when logging in
  const { profile } = useAuthContext()
  const lastProfileId = useRef<string | null>(null)

  useEffect(() => {
    if (profile?.id && profile.id !== lastProfileId.current) {
      lastProfileId.current = profile.id
      if (profile.sucursal_id) {
        setSelectedSucursalId(profile.sucursal_id)
      }
    }
  }, [profile])

  return (
    <SucursalContext.Provider value={{ selectedSucursalId, setSelectedSucursalId }}>
      {children}
    </SucursalContext.Provider>
  )
}

export function useSucursalContext() {
  const context = useContext(SucursalContext)
  if (context === undefined) {
    throw new Error('useSucursalContext must be used within a SucursalProvider')
  }
  return context
}
