import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import type { Session, User } from '@supabase/supabase-js'
import { QueryClient } from '@tanstack/react-query'

export interface UserProfile {
  id: string
  nombre: string
  email: string
  rol: 'admin' | 'superadmin'
  avatar_url?: string
}

interface AuthContextType {
  session: Session | null
  user: User | null
  profile: UserProfile | null
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
  } catch {
    return null
  }
}

export function AuthProvider({ children, queryClient }: { children: React.ReactNode, queryClient: QueryClient }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Ref para evitar fetches de perfil duplicados
  const profileFetchedFor = useRef<string | null>(null)

  useEffect(() => {
    // PASO 1: Obtener sesión inicial sincronamente (sin esperar perfil)
    // Esto quita el loader lo antes posible.
    supabase.auth.getSession()
      .then(({ data: { session: initialSession } }) => {
        setSession(initialSession)
        setUser(initialSession?.user ?? null)
        setLoading(false)

        if (initialSession?.user && profileFetchedFor.current !== initialSession.user.id) {
          profileFetchedFor.current = initialSession.user.id
          fetchProfile(initialSession.user.id).then(p => setProfile(p))
        }
      })
      .catch((err) => {
        console.error('[Auth] getSession() falló:', err)
        setLoading(false) // Garantizamos que el spinner siempre se quite
      })

    // PASO 2: Escuchar solo cambios POSTERIORES (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      // Ignorar INITIAL_SESSION porque ya lo manejamos arriba con getSession()
      if (event === 'INITIAL_SESSION') return

      setSession(currentSession)
      setUser(currentSession?.user ?? null)
      setLoading(false)

      if (currentSession?.user) {
        if (profileFetchedFor.current !== currentSession.user.id) {
          profileFetchedFor.current = currentSession.user.id
          fetchProfile(currentSession.user.id).then(p => setProfile(p))
        }
      } else {
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
