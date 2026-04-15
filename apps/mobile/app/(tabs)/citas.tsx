import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import { useRouter } from 'expo-router'
import { supabase } from '../../lib/supabase'

export default function CitasScreen() {
  const router = useRouter()
  const [citas, setCitas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const clienteId = await SecureStore.getItemAsync('cliente_id')
      if (!clienteId) { router.replace('/(auth)/identificacion'); return }

      const hoy = new Date().toISOString().split('T')[0]
      const { data } = await supabase
        .from('citas')
        .select('*, sucursal:sucursales(nombre), servicios:cita_servicios(servicio:servicios(nombre))')
        .eq('cliente_id', clienteId)
        .order('fecha', { ascending: false })
        .order('bloque_inicio', { ascending: false })
        .limit(30)

      setCitas(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const estadoColor: Record<string, { bg: string; text: string }> = {
    'Programada':  { bg: '#e6f4ea', text: '#1e8e3e' },
    'Finalizada':  { bg: '#f3f2ff', text: '#5c4dff' },
    'Cancelada':   { bg: '#fdecea', text: '#c62828' },
    'No asistió':  { bg: '#fff8e1', text: '#f57f17' },
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>Mis Citas</Text>
      <Text style={styles.pageSub}>Tus reservas vigentes y anteriores</Text>

      {loading ? (
        <ActivityIndicator color="#88B04B" style={{ marginTop: 40 }} />
      ) : citas.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No tienes citas registradas aún.</Text>
        </View>
      ) : (
        citas.map((cita) => {
          const styles2 = estadoColor[cita.estado] ?? { bg: '#f5f5f5', text: '#6e6e73' }
          return (
            <View key={cita.id} style={styles.citaCard}>
              <View style={styles.citaMeta}>
                <Text style={styles.citaFecha}>
                  {new Date(cita.fecha + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })} • {cita.bloque_inicio}
                </Text>
                <View style={[styles.badge, { backgroundColor: styles2.bg }]}>
                  <Text style={[styles.badgeText, { color: styles2.text }]}>{cita.estado}</Text>
                </View>
              </View>
              <Text style={styles.sucursal}>{cita.sucursal?.nombre ?? 'MUYMUY'}</Text>
              <Text style={styles.servicios} numberOfLines={1}>
                {cita.servicios?.map((s: any) => s.servicio?.nombre).filter(Boolean).join(', ') || 'Servicio'}
              </Text>
            </View>
          )
        })
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  content: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 40 },
  pageTitle: { fontSize: 28, fontWeight: '800', color: '#1d1d1f', letterSpacing: -0.5 },
  pageSub: { fontSize: 15, color: '#6e6e73', marginTop: 4, marginBottom: 28 },
  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyText: { fontSize: 15, color: '#6e6e73' },
  citaCard: {
    backgroundColor: '#fff', borderRadius: 16,
    padding: 16, marginBottom: 10,
    borderWidth: 1, borderColor: '#f0f0f0',
  },
  citaMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  citaFecha: { fontSize: 13, color: '#6e6e73' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  sucursal: { fontSize: 15, fontWeight: '700', color: '#1d1d1f', marginBottom: 2 },
  servicios: { fontSize: 13, color: '#6e6e73' },
})
