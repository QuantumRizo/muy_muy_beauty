import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import type { Session, User } from '@supabase/supabase-js'
import { QueryClient } from '@tanstack/react-query'

export interface UserProfile {
  id: string
  nombre: string
  email: string
  rol: 'admin' | 'superadmin' | 'empleado'
  avatar_url?: string
  sucursal_id?: string | null
}

interface AuthContextType {
  session: Session | null
  user: User | null
  profile: UserProfile | null | undefined // undefined = todavía cargando, null = no encontrado
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const fetchProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const { data } = await supabase
      .from('perfiles_usuario')
      .select('*')
      .eq('id', uid)
      .single()
    return data ?? null
  } catch (error) {
    console.error('[Auth] Error fetching profile:', error)
    return null
  }
}

export function AuthProvider({ children, queryClient }: { children: React.ReactNode, queryClient: QueryClient }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const profileFetchedFor = useRef<string | null>(null)

  useEffect(() => {
    // Usamos SOLO onAuthStateChange (incluyendo INITIAL_SESSION para la carga inicial).
    // setLoading(false) se llama SIEMPRE de inmediato (síncrono), sin esperar fetchProfile.
    // El perfil se carga en background para no bloquear la UI.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      setUser(s?.user ?? null)
      setLoading(false) // SIEMPRE inmediato, nunca espera el perfil

      if (s?.user) {
        if (profileFetchedFor.current !== s.user.id) {
          const uid = s.user.id
          profileFetchedFor.current = uid
          setProfile(undefined) // Marcamos como "cargando"
          // Fetch en background — no bloqueamos aquí
          fetchProfile(uid).then(p => {
            if (profileFetchedFor.current === uid) {
              setProfile(p)
            }
          })
        }
      } else {
        // Logout o sin sesión
        profileFetchedFor.current = null
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    queryClient.clear()
    profileFetchedFor.current = null
    setProfile(null)
    setSession(null)
    setUser(null)
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}
