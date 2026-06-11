import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase } from './supabase'

interface CatalogState {
  categorias: any[]
  servicios: any[]
  sucursales: any[]
  loading: boolean
  lastFetched: number | null
  fetchCatalog: (force?: boolean) => Promise<void>
}

export const useCatalogStore = create<CatalogState>()(
  persist(
    (set, get) => ({
      categorias: [],
      servicios: [],
      sucursales: [],
      loading: false,
      lastFetched: null,

      fetchCatalog: async (force = false) => {
        const { lastFetched, loading } = get()
        
        // Si ya estamos cargando o si cargamos hace menos de 5 minutos, ignorar a menos que se fuerce
        if (!force && lastFetched && (Date.now() - lastFetched < 300000)) {
          return
        }

        if (loading) return // Evitar doble llamada simultánea

        set({ loading: true })

        try {
          const [catRes, servRes, sucRes] = await Promise.all([
            supabase
              .from('categorias_servicio')
              .select('id, nombre, imagen_url, orden, servicios(count)')
              .order('orden'),
            supabase
              .from('servicios')
              .select('*')
              .eq('activo', true)
              .order('nombre'),
            supabase
              .from('sucursales')
              .select('*')
              .order('nombre')
          ])

          if (catRes.error) throw catRes.error
          if (servRes.error) throw servRes.error
          if (sucRes.error) throw sucRes.error

          set({
            categorias: catRes.data || [],
            servicios: servRes.data || [],
            sucursales: sucRes.data || [],
            lastFetched: Date.now()
          })
        } catch (error: any) {
          console.error('Error fetching catalog:', error)
          // Solo mostrar alerta si NO tenemos datos guardados (es decir, offline sin cache)
          const { categorias } = get()
          if (categorias.length === 0) {
            import('react-native').then(({ Alert }) => {
              Alert.alert('Error de Conexión', error?.message || 'No hay internet ni datos guardados.')
            })
          }
        } finally {
          set({ loading: false })
        }
      }
    }),
    {
      name: 'catalog-storage', // nombre de la llave en AsyncStorage
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ 
        categorias: state.categorias, 
        servicios: state.servicios, 
        sucursales: state.sucursales,
        lastFetched: state.lastFetched
      }), // No guardamos 'loading' en disco
    }
  )
)
