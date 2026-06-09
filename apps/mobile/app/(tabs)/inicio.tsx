import { useEffect, useState, useCallback } from 'react'
import { hoyMX } from '../../lib/dateUtils'
import {
  View, Text, StyleSheet, ScrollView,
  ActivityIndicator, TouchableOpacity, Image, Dimensions, RefreshControl
} from 'react-native'
import { useRouter } from 'expo-router'
import * as SecureStore from 'expo-secure-store'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../../lib/supabase'

const { width } = Dimensions.get('window')

// SERVICIOS remain as static marketing cards with curated images and descriptions
const SERVICIOS = [
  { 
    title: 'Esmaltado Permanente', 
    image: require('../../assets/esmaltado_permanente.webp'),
    desc: 'La novedosa técnica que ha revolucionado el mundo de las uñas: el único esmaltado permanente de larga duración y 20Free.' 
  },
  { 
    title: 'Uñas Esculpidas', 
    image: require('../../assets/unas_esculpidas.webp'),
    desc: 'Uñas esculpidas con las mejores técnicas del mercado: uñas de gel, uñas en acrílico... ¡Ponte en buenas manos!' 
  },
  { 
    title: 'Manicura & Spa', 
    image: require('../../assets/manicura.webp'),
    desc: '¡Tus manos hablan de ti! Cuídalas con nuestros servicios de manicura: limar y esmaltar, manicura básica, spa, etc.' 
  },
  { 
    title: 'Cuidado Facial', 
    image: require('../../assets/facial.webp'),
    desc: 'Protocolos de higiene profunda y tratamientos personalizados para una piel luminosa, sana y revitalizada.' 
  },
  { 
    title: 'Masajes Terapéuticos', 
    image: require('../../assets/masaje.webp'),
    desc: 'Un refugio para el estrés. Sesiones de relajación profunda y reflexología para restaurar tu equilibrio corporal y mental.' 
  },
  { 
    title: 'Pedicura Avanzada', 
    image: require('../../assets/pedicura.webp'),
    desc: 'Salud y estética integral para tus pies. Desde relajantes sesiones spa hasta pedicuras técnicas especializadas.' 
  },
  { 
    title: 'Eyes & Brows', 
    image: require('../../assets/eyes_beauty.webp'),
    desc: 'Realzamos tu mirada. Diseños de cejas y elevación de pestañas que enmarcan tu rostro con elegancia y naturalidad.' 
  },
  { 
    title: 'Depilación Premium', 
    image: require('../../assets/depilacion.webp'),
    desc: 'Suavidad duradera con técnicas delicadas y efectivas. Una experiencia de depilación profesional en un ambiente de confort.' 
  },
  { 
    title: 'Nail Art & Diseño', 
    image: require('../../assets/nail_art.webp'),
    desc: 'El toque artístico final. Decoraciones exclusivas y diseños personalizados para que tus uñas sean una obra de arte.' 
  },
]

const ACCENT = '#88B04B'

export default function InicioScreen() {
  const router = useRouter()
  const [nombre, setNombre] = useState<string | null>(null)
  const [clienteId, setClienteId] = useState<string | null>(null)
  const [citas, setCitas] = useState<any[]>([])
  const [centros, setCentros] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadData = useCallback(async () => {
    try {
      const id = await SecureStore.getItemAsync('cliente_id')
      const nom = await SecureStore.getItemAsync('cliente_nombre')
      setClienteId(id)
      setNombre(nom ? nom.split(' ')[0] : null)

      // Load sucursales from DB — replaces hardcoded CENTROS
      const { data: sucData } = await supabase
        .from('sucursales')
        .select('nombre, direccion, telefono')
        .order('nombre')
      if (sucData) setCentros(sucData)

      if (id) {
        const hoy = hoyMX()
        const { data } = await supabase
          .from('citas')
          .select('*, sucursal:sucursales(nombre), servicios:cita_servicios(servicio:servicios(nombre))')
          .eq('cliente_id', id)
          .gte('fecha', hoy)
          .eq('estado', 'Programada')
          .order('fecha', { ascending: true })
          .limit(5)
        setCitas((data as any[]) ?? [])
      }
    } catch {
      // Non-blocking — static content still renders even if DB is unreachable
    } finally {
      setLoading(false)
    }
  }, [])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }, [loadData])

  useEffect(() => {
    loadData()
  }, [loadData])

  return (
    <View style={styles.outerContainer}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#88B04B" />}
      >

        {/* Logo / Header */}
        <View style={styles.logoRow}>
          <Image 
            source={require('../../assets/logo.jpeg')} 
            style={styles.logoImage} 
            resizeMode="contain" 
          />
        </View>

        {/* Saludo personalizado si esta identificada */}
        {nombre && (
          <View style={styles.greetingBanner}>
            <Text style={styles.greetingText}>Bienvenida, {nombre}</Text>
          </View>
        )}

        {/* CTA Reservar */}
        <TouchableOpacity
          style={styles.ctaCard}
          onPress={() => router.push('/(tabs)/reservar')}
          activeOpacity={0.85}
        >
          <View style={styles.ctaTextContainer}>
            <Text style={styles.ctaTitle}>Agenda tu cita</Text>
            <Text style={styles.ctaSub}>Elige sucursal, servicio y horario</Text>
          </View>
          <View style={styles.ctaArrow}>
            <Text style={styles.ctaArrowText}>→</Text>
          </View>
        </TouchableOpacity>

        {/* Proximas citas */}
        {clienteId && (
          <>
            <Text style={styles.sectionTitle}>Tus próximas citas</Text>
            {loading ? (
              <ActivityIndicator color={ACCENT} style={{ marginBottom: 32 }} />
            ) : citas.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No tienes citas próximas.</Text>
                <Text style={styles.emptyHint}>Agenda una ahora.</Text>
              </View>
            ) : (
              citas.map((cita) => (
                <View key={cita.id} style={styles.citaCard}>
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
                </View>
              ))
            )}
          </>
        )}

        {/* Sección de servicios */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Nuestros Servicios</Text>
          <Text style={styles.sectionSub}>Redefiniendo el cuidado y la belleza</Text>
        </View>

        <View style={styles.serviciosGrid}>
          {SERVICIOS.map((s, i) => (
            <View key={i} style={styles.servicioCard}>
              <Image source={s.image} style={styles.servicioImage} resizeMode="cover" />
              <View style={styles.servicioInfo}>
                <Text style={styles.servicioTitle}>{s.title}</Text>
                <Text style={styles.servicioDesc}>{s.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Sección de centros */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Nuestros Centros</Text>
          <Text style={styles.sectionSub}>Visítanos en Polanco</Text>
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
    </View>
  )
}

const styles = StyleSheet.create({
  outerContainer: { flex: 1, backgroundColor: '#ffffff' },
  container: { flex: 1 },
  content: { paddingBottom: 0 }, // Conectado al tab bar

  /* Logo */
  logoRow: {
    backgroundColor: '#ffffff',
    paddingTop: 64,
    paddingBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 180,
    height: 60,
  },

  /* Greeting */
  greetingBanner: {
    backgroundColor: '#f0f7e6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e0efcc',
  },
  greetingText: {
    fontSize: 14,
    fontWeight: '600',
    color: ACCENT,
  },

  /* CTA */
  ctaCard: {
    backgroundColor: ACCENT,
    margin: 20,
    borderRadius: 20,
    padding: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  ctaTextContainer: { flex: 1 },
  ctaTitle: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 4 },
  ctaSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', maxWidth: '90%' },
  ctaArrow: {
    width: 36, height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  ctaArrowText: { color: '#fff', fontSize: 18, fontWeight: '700' },

  /* Citas */
  sectionHeader: { marginTop: 32, marginBottom: 16 },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1d1d1f',
    marginHorizontal: 20,
    letterSpacing: -0.5,
  },
  sectionSub: {
    fontSize: 14,
    color: '#6e6e73',
    marginHorizontal: 20,
    marginTop: 2,
  },
  emptyCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
  },
  emptyText: { fontSize: 14, color: '#6e6e73' },
  emptyHint: { fontSize: 13, color: ACCENT, fontWeight: '600', marginTop: 4 },
  citaCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: '#eee',
  },
  citaDateBadge: {
    width: 48, height: 48, borderRadius: 12,
    backgroundColor: '#f0f7e6',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  citaDay: { fontSize: 18, fontWeight: '800', color: ACCENT },
  citaMes: { fontSize: 10, fontWeight: '700', color: ACCENT },
  citaInfo: { flex: 1 },
  citaSucursal: { fontSize: 14, fontWeight: '700', color: '#1d1d1f' },
  citaHora: { fontSize: 13, color: '#6e6e73', marginTop: 1 },
  citaServicio: { fontSize: 12, color: '#6e6e73', marginTop: 1 },

  /* Servicios grid */
  serviciosGrid: {
    marginHorizontal: 20,
    gap: 20,
  },
  servicioCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  servicioImage: {
    width: '100%',
    height: 180,
  },
  servicioInfo: {
    padding: 16,
  },
  servicioTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1d1d1f',
    marginBottom: 6,
  },
  servicioDesc: {
    fontSize: 14,
    color: '#6e6e73',
    lineHeight: 20,
  },

  /* Centros grid */
  centrosGrid: {
    marginHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  centroCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#eee',
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
  footerCopyright: { fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 20 },
})
