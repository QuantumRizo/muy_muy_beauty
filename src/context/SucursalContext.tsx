import React, { createContext, useContext, useState, useEffect } from 'react'

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
