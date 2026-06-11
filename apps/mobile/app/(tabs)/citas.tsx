import { useEffect, useState, useCallback } from 'react'
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, Alert, TouchableOpacity } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import { useRouter, useFocusEffect } from 'expo-router'
import { supabase } from '../../lib/supabase'

export default function CitasScreen() {
  const router = useRouter()
  const [citas, setCitas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(false)
  const [clienteId, setClienteId] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) { router.replace('/(auth)/identificacion?returnTo=citas'); return }

    const { data: cliente, error: cliErr } = await supabase
      .from('clientes')
      .select('id')
      .eq('auth_user_id', session.user.id)
      .single()

    if (cliErr || !cliente) {
      setError(true)
      setLoading(false)
      return
    }

    setClienteId(cliente.id)

    const { data, error: err } = await supabase
      .from('citas')
      .select('*, sucursal:sucursales(nombre), servicios:cita_servicios(servicio:servicios(nombre))')
      .eq('cliente_id', cliente.id)
      .order('fecha', { ascending: false })
      .order('bloque_inicio', { ascending: false })
      .limit(30)

    if (err) {
      setError(true)
    } else {
      setCitas(data ?? [])
      setError(false)
    }
    setLoading(false)
  }, [router])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }, [loadData])

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

    if (cita.estado === 'Programada') {
      Alert.alert(
        'Detalles de tu cita',
        detalleMsg,
        [
          { text: 'Cancelar Cita', style: 'destructive', onPress: () => confirmCancel(cita.id) },
          { text: 'Reagendar', onPress: () => Alert.alert('Reagendar', 'Para reagendar, por favor cancela esta cita y elige un nuevo horario en la pestaña Reservar.') },
          { text: 'Cerrar', style: 'cancel' }
        ]
      )
    } else {
      Alert.alert(
        'Detalles de la cita',
        `Esta cita está ${cita.estado}.\n\nServicios:\n• ${serviciosStr}\n\nPara volver a agendar, dirígete a la pestaña de Reservar.`,
        [
          { text: 'Ir a Reservar', onPress: () => router.push('/(tabs)/reservar') },
          { text: 'Cerrar', style: 'cancel' }
        ]
      )
    }
  }

  const estadoColor: Record<string, { bg: string; text: string }> = {
    'Programada':  { bg: '#e6f4ea', text: '#1e8e3e' },
    'Finalizada':  { bg: '#f3f2ff', text: '#5c4dff' },
    'Cancelada':   { bg: '#fdecea', text: '#c62828' },
    'No asistió':  { bg: '#fff8e1', text: '#f57f17' },
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#88B04B" />}
    >
      <Text style={styles.pageTitle}>Mis Citas</Text>
      <Text style={styles.pageSub}>Tus reservas vigentes y anteriores</Text>

      {loading ? (
        <ActivityIndicator color="#88B04B" style={{ marginTop: 40 }} />
      ) : error ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No se pudo cargar tus citas.</Text>
          <Text style={[styles.emptyText, { color: '#88B04B', marginTop: 4 }]}>Desliza hacia abajo para reintentar.</Text>
        </View>
      ) : citas.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No tienes citas registradas aún.</Text>
        </View>
      ) : (
        citas.map((cita) => {
          const styles2 = estadoColor[cita.estado] ?? { bg: '#f5f5f5', text: '#6e6e73' }
          return (
            <TouchableOpacity key={cita.id} style={styles.citaCard} onPress={() => handlePressCita(cita)} activeOpacity={0.7}>
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
            </TouchableOpacity>
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
