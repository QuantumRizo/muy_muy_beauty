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
  const profileFetchedFor = useRef<string | null>(null)

  useEffect(() => {
    // Carga inicial: obtener sesión. Loading=false en cuanto se sabe si hay sesión o no.
    supabase.auth.getSession()
      .then(async ({ data: { session: s } }) => {
        setSession(s)
        setUser(s?.user ?? null)
        if (s?.user && profileFetchedFor.current !== s.user.id) {
          profileFetchedFor.current = s.user.id
          const p = await fetchProfile(s.user.id)
          setProfile(p)
        }
      })
      .catch(err => console.error('[Auth] getSession() falló:', err))
      .finally(() => setLoading(false))

    // Cambios posteriores (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, s) => {
      if (event === 'INITIAL_SESSION') return

      setSession(s)
      setUser(s?.user ?? null)
      setLoading(false)

      if (s?.user) {
        if (profileFetchedFor.current !== s.user.id) {
          profileFetchedFor.current = s.user.id
          const p = await fetchProfile(s.user.id)
          setProfile(p)
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
