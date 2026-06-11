import { useEffect, useState, useCallback } from 'react'
import { hoyMX } from '../../lib/dateUtils'
import {
  View, Text, StyleSheet, ScrollView,
  ActivityIndicator, TouchableOpacity, Image, RefreshControl, Alert, SafeAreaView
} from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../../lib/supabase'

const ACCENT = '#88B04B'

import { useCatalogStore } from '../../lib/useCatalogStore'

export default function InicioScreen() {
  const router = useRouter()
  const [nombre, setNombre] = useState<string | null>(null)
  const [clienteId, setClienteId] = useState<string | null>(null)
  const [citas, setCitas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const { categorias, sucursales: centros, fetchCatalog } = useCatalogStore()

  const loadData = useCallback(async () => {
    try {
      let id = null
      let nom = null

      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const { data: cliente } = await supabase
          .from('clientes')
          .select('id, nombre_completo')
          .eq('auth_user_id', session.user.id)
          .single()
        
        if (cliente) {
          id = cliente.id
          nom = cliente.nombre_completo
        }
      }

      setClienteId(id)
      setNombre(nom ? nom.split(' ')[0] : null)

      // Fetch global catalog (only runs API call if stale)
      await fetchCatalog()

      if (id) {
        const hoy = hoyMX()
        const { data } = await supabase
          .from('citas')
          .select('*, sucursal:sucursales(nombre), servicios:cita_servicios(servicio:servicios(nombre))')
          .eq('cliente_id', id)
          .gte('fecha', hoy)
          .eq('estado', 'Programada')
          .order('fecha', { ascending: true })
          .limit(1)
        setCitas((data as any[]) ?? [])
      }
    } catch {
      // Non-blocking
    } finally {
      setLoading(false)
    }
  }, [])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchCatalog(true)
    await loadData()
    setRefreshing(false)
  }, [loadData, fetchCatalog])

  useFocusEffect(
    useCallback(() => {
      loadData()
    }, [loadData])
  )

  const confirmCancel = (citaId: string) => {
    Alert.alert(
      'Cancelar Cita',
      '¿Estás segura de que deseas cancelar esta cita?',
      [
        { text: 'No, mantener', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            if (!clienteId) return
            
            setLoading(true)
            try {
              const { data, error } = await supabase.rpc('cancelar_cita_cliente', {
                p_cita_id: citaId,
                p_cliente_id: clienteId
              })
              
              if (error) throw error
              if (data?.error) throw new Error(data?.error)
              
              Alert.alert('Cita cancelada', 'Tu cita ha sido cancelada exitosamente.')
              loadData()
            } catch (err: any) {
              Alert.alert('Error', err.message || 'No se pudo cancelar la cita')
              setLoading(false)
            }
          }
        }
      ]
    )
  }

  const handlePressCita = (cita: any) => {
    const serviciosStr = cita.servicios?.map((s: any) => s.servicio?.nombre).filter(Boolean).join('\n• ') || 'Sin servicios registrados'
    const notasStr = cita.notas_cliente ? `\n\nNotas que dejaste:\n"${cita.notas_cliente}"` : ''
    const fechaDate = new Date(cita.fecha + 'T12:00:00')
    const fechaStr = fechaDate.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    const sucursalStr = cita.sucursal?.nombre || 'MUYMUY'
    
    const detalleMsg = `Servicios:\n• ${serviciosStr}${notasStr}\n\nCuándo: ${fechaStr} a las ${cita.bloque_inicio}\nDónde: ${sucursalStr}\n\n¿Qué deseas hacer con esta cita?`

    Alert.alert(
      'Detalles de tu cita',
      detalleMsg,
      [
        { text: 'Cancelar Cita', style: 'destructive', onPress: () => confirmCancel(cita.id) },
        { text: 'Reagendar', onPress: () => Alert.alert('Reagendar', 'Para reagendar, cancela esta cita y elige un nuevo horario.') },
        { text: 'Cerrar', style: 'cancel' }
      ]
    )
  }

  return (
    <SafeAreaView style={styles.outerContainer}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT} />}
      >

        {/* Header */}
        <View style={styles.headerContainer}>
          <View style={styles.headerLeft}>
            <Text style={styles.greetingLight}>Hola{nombre ? ',' : ''}</Text>
            {nombre && <Text style={styles.greetingBold}>{nombre}</Text>}
          </View>
          <Image 
            source={require('../../assets/logo.jpeg')} 
            style={styles.headerLogo} 
            resizeMode="contain" 
          />
          <TouchableOpacity style={styles.headerRight}>
            <Ionicons name="notifications-outline" size={24} color="#1d1d1f" />
          </TouchableOpacity>
        </View>

        {/* Hero Card Reservar */}
        <TouchableOpacity
          style={styles.heroCard}
          onPress={() => router.push('/(tabs)/reservar')}
          activeOpacity={0.85}
        >
          <View style={styles.heroIconContainer}>
            <Ionicons name="calendar" size={24} color={ACCENT} />
          </View>
          <View style={styles.heroTextContainer}>
            <Text style={styles.heroTitle}>Reserva tu cita</Text>
            <Text style={styles.heroSub}>Elige servicio, sucursal y horario</Text>
          </View>
          <View style={styles.heroArrow}>
            <Ionicons name="arrow-forward" size={20} color={ACCENT} />
          </View>
        </TouchableOpacity>

        {/* Proximas Citas */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Tus próximas citas</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/citas')}>
            <Text style={styles.seeAllText}>Ver todas</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color={ACCENT} style={{ marginVertical: 20 }} />
        ) : citas.length === 0 ? (
          <View style={styles.emptyCitaCard}>
            <View style={styles.emptyCitaIcon}>
              <Ionicons name="calendar-outline" size={24} color={ACCENT} />
            </View>
            <View style={styles.emptyCitaText}>
              <Text style={styles.emptyCitaTitle}>No tienes citas próximas</Text>
              <Text style={styles.emptyCitaSub}>¡Agenda tu próxima visita!</Text>
            </View>
          </View>
        ) : (
          citas.map((cita) => (
            <TouchableOpacity key={cita.id} style={styles.activeCitaCard} onPress={() => handlePressCita(cita)} activeOpacity={0.7}>
              <View style={styles.citaDateBadge}>
                <Text style={styles.citaDay}>{new Date(cita.fecha + 'T12:00:00').getDate()}</Text>
                <Text style={styles.citaMes}>
                  {new Date(cita.fecha + 'T12:00:00').toLocaleString('es-MX', { month: 'short' }).toUpperCase()}
                </Text>
              </View>
              <View style={styles.citaInfo}>
                <Text style={styles.citaSucursal}>{cita.sucursal?.nombre ?? 'MUYMUY'}</Text>
                <Text style={styles.citaHora}>{cita.bloque_inicio} hrs</Text>
                <Text style={styles.citaServicio} numberOfLines={1}>
                  {cita.servicios?.map((s: any) => s.servicio?.nombre).filter(Boolean).join(', ') || 'Servicio'}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}

        {/* Categorías de servicios */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Categorías de servicios</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/servicios')}>
            <Text style={styles.seeAllText}>Ver todas</Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriasScroll}
        >
          {loading ? (
            <ActivityIndicator color={ACCENT} style={{ marginLeft: 20 }} />
          ) : categorias.map((cat, i) => {
            const count = cat.servicios?.[0]?.count || 0;
            return (
              <TouchableOpacity 
                key={cat.id} 
                style={styles.categoriaCard} 
                activeOpacity={0.8}
                onPress={() => router.push({ pathname: '/(tabs)/servicios', params: { categoria_id: cat.id } })}
              >
                <View style={styles.categoriaImageContainer}>
                  {cat.imagen_url ? (
                    <Image source={{ uri: cat.imagen_url }} style={styles.categoriaImage} />
                  ) : (
                    <View style={[styles.categoriaImage, { backgroundColor: '#e0e0e0' }]} />
                  )}
                  {/* Circular icon overlapping */}
                  <View style={styles.categoriaIconCircle}>
                    <Ionicons name="sparkles-outline" size={20} color={ACCENT} />
                  </View>
                </View>
                <View style={styles.categoriaTextContainer}>
                  <Text style={styles.categoriaTitle} numberOfLines={2}>{cat.nombre}</Text>
                  <Text style={styles.categoriaCount}>{count} servicios</Text>
                </View>
              </TouchableOpacity>
            )
          })}
        </ScrollView>

        {/* Sección de centros */}
        <View style={[styles.sectionHeaderRow, { marginTop: 32 }]}>
          <Text style={styles.sectionTitle}>Nuestros Centros</Text>
        </View>

        <View style={styles.centrosGrid}>
          {centros.map((centro, i) => (
            <View key={i} style={styles.centroCard}>
              <View style={styles.centroHeader}>
                <Ionicons name="location-sharp" size={18} color={ACCENT} />
                <Text style={styles.centroNombre}>{centro.nombre}</Text>
              </View>
              <Text style={styles.centroDireccion}>{centro.direccion?.split(',')[0]}</Text>
              {centro.telefono ? (
                <TouchableOpacity style={styles.centroTelRow}>
                  <Ionicons name="call" size={14} color="#6e6e73" />
                  <Text style={styles.centroTelefono}>{centro.telefono}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerTitle}>MUYMUY Beauty Studio</Text>
          <Text style={styles.footerSub}>Polanco · Ciudad de México</Text>
          <Text style={styles.footerSub}>Lun–Sab 10:00–20:00  ·  Dom 11:00–18:00</Text>
          <Text style={styles.footerCopyright}>© 2026 MUYMUY. Todos los derechos reservados.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  outerContainer: { flex: 1, backgroundColor: '#fcfcfc' },
  container: { flex: 1 },
  content: { paddingBottom: 20 }, 

  /* Header */
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerLeft: { flex: 1 },
  greetingLight: { fontSize: 16, color: '#6e6e73' },
  greetingBold: { fontSize: 20, fontWeight: '800', color: ACCENT },
  headerLogo: { width: 120, height: 40 },
  headerRight: { flex: 1, alignItems: 'flex-end' },

  /* Hero Card */
  heroCard: {
    backgroundColor: ACCENT,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    marginBottom: 30,
  },
  heroIconContainer: {
    width: 44, height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  heroTextContainer: { flex: 1 },
  heroTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 2 },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.85)' },
  heroArrow: {
    width: 32, height: 32,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },

  /* Sections */
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1d1d1f',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: ACCENT,
  },

  /* Empty Cita */
  emptyCitaCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 30,
  },
  emptyCitaIcon: {
    width: 44, height: 44,
    borderRadius: 22,
    backgroundColor: '#f0f7e6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  emptyCitaText: { flex: 1 },
  emptyCitaTitle: { fontSize: 14, fontWeight: '700', color: '#1d1d1f', marginBottom: 2 },
  emptyCitaSub: { fontSize: 12, color: '#6e6e73' },
  btnReservarOutline: {
    borderWidth: 1,
    borderColor: ACCENT,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  btnReservarOutlineText: {
    color: ACCENT,
    fontSize: 12,
    fontWeight: '600'
  },

  /* Active Cita */
  activeCitaCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 16,
    marginBottom: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  citaDateBadge: {
    width: 50, height: 50, borderRadius: 12,
    backgroundColor: '#f0f7e6',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  citaDay: { fontSize: 18, fontWeight: '800', color: ACCENT },
  citaMes: { fontSize: 10, fontWeight: '700', color: ACCENT },
  citaInfo: { flex: 1 },
  citaSucursal: { fontSize: 15, fontWeight: '700', color: '#1d1d1f' },
  citaHora: { fontSize: 13, color: '#6e6e73', marginTop: 2 },
  citaServicio: { fontSize: 13, color: '#6e6e73', marginTop: 2 },

  /* Categorías */
  categoriasScroll: {
    paddingLeft: 20,
    paddingRight: 10,
  },
  categoriaCard: {
    backgroundColor: '#ffffff',
    width: 140,
    borderRadius: 16,
    marginRight: 14,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'visible',
  },
  categoriaImageContainer: {
    position: 'relative',
    height: 120,
  },
  categoriaImage: {
    width: '100%',
    height: 100,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  categoriaIconCircle: {
    position: 'absolute',
    bottom: 0,
    alignSelf: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoriaTextContainer: {
    padding: 12,
    paddingTop: 8,
    alignItems: 'center',
  },
  categoriaTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1d1d1f',
    textAlign: 'center',
    marginBottom: 4,
  },
  categoriaCount: {
    fontSize: 11,
    color: ACCENT,
    fontWeight: '600'
  },

  /* Centros grid */
  centrosGrid: {
    marginHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  centroCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  centroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  centroNombre: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1d1d1f',
  },
  centroDireccion: {
    fontSize: 13,
    color: '#6e6e73',
    lineHeight: 18,
    marginBottom: 8,
  },
  centroTelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  centroTelefono: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1d1d1f',
  },

  /* Footer */
  footer: {
    marginTop: 20,
    paddingVertical: 40,
    paddingHorizontal: 24,
    backgroundColor: '#1d1d1f',
    alignItems: 'center',
    gap: 4,
  },
  footerTitle: { fontSize: 18, fontWeight: '800', color: ACCENT, marginBottom: 4 },
  footerSub: { fontSize: 13, color: 'rgba(255,255,255,0.45)', textAlign: 'center' },
  footerCopyright: { fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 20 }
})
