import { useEffect, useState, useCallback, useRef } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, ActivityIndicator, SafeAreaView, Dimensions
} from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../../lib/supabase'

import { useCatalogStore } from '../../lib/useCatalogStore'

const ACCENT = '#88B04B'
const { width } = Dimensions.get('window')

export default function ServiciosScreen() {
  const { categoria_id } = useLocalSearchParams()
  const [activeCatId, setActiveCatId] = useState<string | null>(null)
  const scrollViewRef = useRef<ScrollView>(null)
  const [catPositions, setCatPositions] = useState<{ [key: string]: number }>({})

  const { categorias, servicios, loading, fetchCatalog } = useCatalogStore()

  const loadData = useCallback(async () => {
    await fetchCatalog()
    
    // Configurar la categoría activa una vez que se cargan los datos
    if (categoria_id && typeof categoria_id === 'string') {
      setActiveCatId(categoria_id)
    } else if (useCatalogStore.getState().categorias.length > 0) {
      setActiveCatId(useCatalogStore.getState().categorias[0].id)
    }
  }, [categoria_id, fetchCatalog])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    if (categoria_id && typeof categoria_id === 'string' && catPositions[categoria_id]) {
      scrollViewRef.current?.scrollTo({ y: catPositions[categoria_id] - 20, animated: true })
      setActiveCatId(categoria_id)
    }
  }, [categoria_id, catPositions])

  const handleScrollToCat = (id: string) => {
    setActiveCatId(id)
    if (catPositions[id]) {
      scrollViewRef.current?.scrollTo({ y: catPositions[id] - 20, animated: true })
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Fijo */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Nuestros Servicios</Text>
      </View>

      {/* Navegación Horizontal de Categorías */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          {categorias.map(cat => (
            <TouchableOpacity 
              key={cat.id}
              style={[styles.tabItem, activeCatId === cat.id && styles.tabItemActive]}
              onPress={() => handleScrollToCat(cat.id)}
            >
              <Text style={[styles.tabText, activeCatId === cat.id && styles.tabTextActive]}>
                {cat.nombre}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Lista Principal de Servicios por Categoría */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.mainScroll} 
        contentContainerStyle={styles.mainScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator color={ACCENT} style={{ marginTop: 40 }} />
        ) : (
          categorias.map(cat => {
            const catServicios = servicios.filter(s => s.categoria_id === cat.id)
            if (catServicios.length === 0) return null

            return (
              <View 
                key={cat.id} 
                style={styles.categorySection}
                onLayout={(e) => {
                  const y = e.nativeEvent.layout.y
                  setCatPositions(prev => ({ ...prev, [cat.id]: y }))
                }}
              >
                <View style={styles.categoryHeader}>
                  {cat.imagen_url && <Image source={{ uri: cat.imagen_url }} style={styles.categoryHeaderImage} />}
                  <View style={styles.categoryHeaderOverlay}>
                    <Text style={styles.categoryHeaderTitle}>{cat.nombre}</Text>
                    {cat.descripcion && <Text style={styles.categoryHeaderDesc} numberOfLines={2}>{cat.descripcion}</Text>}
                  </View>
                </View>

                {catServicios.map(serv => (
                  <View key={serv.id} style={styles.servicioRow}>
                    <View style={styles.servicioInfo}>
                      <Text style={styles.servicioNombre}>{serv.nombre}</Text>
                      <View style={styles.servicioDetails}>
                        <Ionicons name="time-outline" size={14} color="#888" />
                        <Text style={styles.servicioMeta}> {serv.duracion_slots * 15} min</Text>
                        <Text style={styles.servicioMeta}>   •   ${serv.precio}</Text>
                      </View>
                    </View>
                    <TouchableOpacity 
                      style={styles.btnReservarSmall}
                      onPress={() => router.push({ pathname: '/(tabs)/reservar', params: { servicio_id: serv.id } })}
                    >
                      <Text style={styles.btnReservarSmallText}>Reservar</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )
          })
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fcfcfc' },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#1d1d1f' },
  
  tabsContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tabsScroll: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  tabItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  tabItemActive: {
    backgroundColor: ACCENT,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6e6e73',
  },
  tabTextActive: {
    color: '#fff',
  },

  mainScroll: { flex: 1 },
  mainScrollContent: { paddingBottom: 40 },

  categorySection: {
    marginTop: 20,
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  categoryHeader: {
    height: 120,
    position: 'relative',
    backgroundColor: '#e0e0e0',
  },
  categoryHeaderImage: {
    width: '100%',
    height: '100%',
  },
  categoryHeaderOverlay: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    padding: 14,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  categoryHeaderTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  categoryHeaderDesc: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    marginTop: 2,
  },

  servicioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  servicioInfo: { flex: 1 },
  servicioNombre: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1d1d1f',
    marginBottom: 4,
  },
  servicioDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  servicioMeta: {
    fontSize: 13,
    color: '#888',
  },
  btnReservarSmall: {
    backgroundColor: '#f0f7e6',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ACCENT,
    marginLeft: 10,
  },
  btnReservarSmallText: {
    color: ACCENT,
    fontSize: 12,
    fontWeight: '700',
  }
})
