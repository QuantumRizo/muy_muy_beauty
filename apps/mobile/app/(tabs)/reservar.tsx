import { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, Dimensions, SafeAreaView, KeyboardAvoidingView, Platform
} from 'react-native'
import { useRouter } from 'expo-router'
import * as SecureStore from 'expo-secure-store'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../../lib/supabase'
import {
  format, isSameDay, isToday, isBefore,
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, addMonths, subMonths, startOfDay
} from 'date-fns'
import { es } from 'date-fns/locale'

const { width } = Dimensions.get('window')

const START_HOUR = 9
const END_HOUR = 20
const ACCENT = '#88B04B'

const sanitizePhone = (val: string) => val.replace(/\D/g, '').slice(0, 10)

type Step = 'sucursal' | 'servicio' | 'fecha' | 'cliente' | 'confirmado'

export default function ReservarScreen() {
  const router = useRouter()
  
  const [step, setStep] = useState<Step>('sucursal')
  const [sucursales, setSucursales] = useState<any[]>([])
  const [servicios, setServicios] = useState<any[]>([])
  const [perfiles, setPerfiles] = useState<any[]>([])

  const [selectedSucursal, setSelectedSucursal] = useState<any | null>(null)
  const [selectedServicios, setSelectedServicios] = useState<any[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedTime, setSelectedTime] = useState<string | null>(null)

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [clientInfo, setClientInfo] = useState({ nombre: '', telefono: '', email: '', notas_cliente: '' })
  const [storedClienteId, setStoredClienteId] = useState<string | null>(null)
  const [isExistingClient, setIsExistingClient] = useState(false)

  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [fetchingSlots, setFetchingSlots] = useState(false)

  // 1. Initial Load
  useEffect(() => {
    async function fetchData() {
      // Check if logged in
      const id = await SecureStore.getItemAsync('cliente_id')
      if (id) {
        setStoredClienteId(id)
        const nom = await SecureStore.getItemAsync('cliente_nombre')
        const tel = await SecureStore.getItemAsync('cliente_telefono')
        setClientInfo({ nombre: nom || '', telefono: tel || '', email: '' })
      }

      const [resSuc, resSer] = await Promise.all([
        supabase.from('sucursales').select('*').order('nombre'),
        supabase.from('servicios').select('*').eq('activo', true).order('nombre')
      ])
      if (resSuc.data) setSucursales(resSuc.data)
      if (resSer.data) setServicios(resSer.data)
      setLoading(false)
    }
    fetchData()
  }, [])

  // 2. Load Professionals based on Branch
  useEffect(() => {
    if (selectedSucursal) {
      supabase.from('perfiles_empleadas')
        .select('*')
        .eq('activo', true)
        .then(({ data }) => {
          if (data) setPerfiles(data)
        })
    }
  }, [selectedSucursal])

  // 3. Check Availability
  useEffect(() => {
    if (selectedDate && selectedSucursal && selectedServicios.length > 0 && perfiles.length > 0) {
      async function checkAvailability() {
        setFetchingSlots(true)
        const dateStr = format(selectedDate!, 'yyyy-MM-dd')
        const totalDuration = selectedServicios.reduce((acc, s) => acc + s.duracion_slots, 0)

        try {
          const [resCitas, resBloqueos] = await Promise.all([
            supabase.from('citas')
              .select('bloque_inicio, duracion_manual_slots, empleada_id')
              .eq('fecha', dateStr)
              .neq('estado', 'Cancelada'),
            supabase.from('bloqueos_agenda')
              .select('hora_inicio, hora_fin, empleada_id')
              .eq('fecha', dateStr)
          ])

          const citas = resCitas.data || []
          const bloqueos = resBloqueos.data || []
          const slotsFound = new Set<string>()

          perfiles.forEach(emp => {
            const occupied = new Array(96).fill(false)
            citas.filter(c => c.empleada_id === emp.id).forEach(c => {
              const start = Math.floor(parseInt(c.bloque_inicio.split(':')[0]) * 4 + parseInt(c.bloque_inicio.split(':')[1]) / 15)
              const duration = c.duracion_manual_slots || 4
              for (let i = 0; i < duration; i++) if (start + i < 96) occupied[start + i] = true
            })
            bloqueos.filter(b => b.empleada_id === emp.id).forEach(b => {
              const start = Math.floor(parseInt(b.hora_inicio.split(':')[0]) * 4 + parseInt(b.hora_inicio.split(':')[1]) / 15)
              const end = Math.floor(parseInt(b.hora_fin.split(':')[0]) * 4 + parseInt(b.hora_fin.split(':')[1]) / 15)
              for (let i = start; i < end; i++) if (i < 96) occupied[i] = true
            })
            for (let h = START_HOUR; h < END_HOUR; h++) {
              for (let m = 0; m < 60; m += 15) {
                const sIndex = h * 4 + m / 15
                let canFit = true
                for (let i = 0; i < totalDuration; i++) {
                  if (sIndex + i >= 96 || occupied[sIndex + i]) {
                    canFit = false
                    break
                  }
                }
                if (canFit) {
                  slotsFound.add(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`)
                }
              }
            }
          })
          setAvailableSlots(Array.from(slotsFound).sort())
        } catch (err) {
          console.error(err)
        } finally {
          setFetchingSlots(false)
        }
      }
      checkAvailability()
    }
  }, [selectedDate, selectedSucursal, selectedServicios, perfiles])

  // 4. Check Existing Client
  useEffect(() => {
    if (clientInfo.telefono.length === 10 && !storedClienteId) {
      supabase.from('clientes').select('nombre_completo, email').eq('telefono_cel', clientInfo.telefono).maybeSingle()
        .then(({ data }) => {
          if (data) {
            setClientInfo(prev => ({ ...prev, nombre: data.nombre_completo, email: data.email || prev.email }))
            setIsExistingClient(true)
          } else {
            setIsExistingClient(false)
          }
        })
    } else {
      setIsExistingClient(false)
    }
  }, [clientInfo.telefono, storedClienteId])

  const toggleServicio = (s: any) => {
    setSelectedServicios(prev => {
      const exists = prev.find(item => item.id === s.id)
      if (exists) return prev.filter(item => item.id !== s.id)
      return [...prev, s]
    })
  }

  const goBack = () => {
    if (step === 'servicio') setStep('sucursal')
    if (step === 'fecha') setStep('servicio')
    if (step === 'cliente') setStep('fecha')
  }

  const handleConfirm = async () => {
    if (!selectedDate || !selectedTime || !selectedSucursal || selectedServicios.length === 0) return
    if (!storedClienteId && (!clientInfo.nombre || clientInfo.telefono.length !== 10)) {
      Alert.alert('Datos incompletos', 'Por favor completa tu nombre y un teléfono válido (10 dígitos).')
      return
    }

    setSubmitting(true)
    try {
      let clientId = storedClienteId
      if (!clientId) {
        const { data: existing } = await supabase.from('clientes').select('id').eq('telefono_cel', clientInfo.telefono).maybeSingle()
        if (existing) {
          clientId = existing.id
        } else {
          const { data: nuevo, error: e1 } = await supabase.from('clientes').insert({
            nombre_completo: clientInfo.nombre,
            telefono_cel: clientInfo.telefono,
            email: clientInfo.email,
            sucursal_id: selectedSucursal.id,
            datos_extra: {}
          }).select().single()
          if (e1) throw e1
          clientId = nuevo.id
        }
      }

      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      const totalDuration = selectedServicios.reduce((acc, s) => acc + s.duracion_slots, 0)
      const startTime = selectedTime
      const startIdx = parseInt(startTime.split(':')[0]) * 4 + parseInt(startTime.split(':')[1]) / 15
      let targetEmpleadaId = ''

      const { data: citas } = await supabase.from('citas').select('*').eq('fecha', dateStr).neq('estado', 'Cancelada')
      const { data: bloqueos } = await supabase.from('bloqueos_agenda').select('*').eq('fecha', dateStr)

      for (const emp of perfiles) {
        const occupied = new Array(96).fill(false)
        citas?.filter(c => c.empleada_id === emp.id).forEach(c => {
          const s = Math.floor(parseInt(c.bloque_inicio.split(':')[0]) * 4 + parseInt(c.bloque_inicio.split(':')[1]) / 15)
          const d = c.duracion_manual_slots || 4
          for (let i = 0; i < d; i++) if (s + i < 96) occupied[s + i] = true
        })
        bloqueos?.filter(b => b.empleada_id === emp.id).forEach(b => {
          const s = Math.floor(parseInt(b.hora_inicio.split(':')[0]) * 4 + parseInt(b.hora_inicio.split(':')[1]) / 15)
          const e = Math.floor(parseInt(b.hora_fin.split(':')[0]) * 4 + parseInt(b.hora_fin.split(':')[1]) / 15)
          for (let i = s; i < e; i++) if (i < 96) occupied[i] = true
        })
        let fits = true
        for (let i = 0; i < totalDuration; i++) {
          if (startIdx + i >= 96 || occupied[startIdx + i]) { fits = false; break; }
        }
        if (fits) { targetEmpleadaId = emp.id; break; }
      }
      if (!targetEmpleadaId) targetEmpleadaId = perfiles[0]?.id

      const { data: cita, error: e2 } = await supabase.from('citas').insert({
        cliente_id: clientId,
        sucursal_id: selectedSucursal.id,
        empleada_id: targetEmpleadaId,
        fecha: dateStr,
        bloque_inicio: startTime,
        estado: 'Programada',
        duracion_manual_slots: totalDuration,
        notas_cliente: clientInfo.notas_cliente || null
      }).select().single()

      if (e2) throw e2
      if (cita) {
        await supabase.from('cita_servicios').insert(selectedServicios.map(s => ({ cita_id: cita.id, servicio_id: s.id })))
      }
      setStep('confirmado')
    } catch (err: any) {
      console.error(err)
      Alert.alert('Error', 'Hubo un error al agendar la cita. Intenta de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleNextReserva = () => {
    setStep('sucursal');
    setSelectedSucursal(null);
    setSelectedServicios([]);
    setSelectedDate(null);
    setSelectedTime(null);
    router.push('/(tabs)/inicio');
  }

  const totalPrice = selectedServicios.reduce((acc, s) => acc + (parseFloat(s.precio) || 0), 0)
  const totalTime = selectedServicios.reduce((acc, s) => acc + s.duracion_slots * 15, 0)

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={ACCENT} />
      </View>
    )
  }

  // Generate calendar days
  const mStart = startOfMonth(currentMonth)
  const mEnd = endOfMonth(mStart)
  const sDate = startOfWeek(mStart)
  const eDate = endOfWeek(mEnd)
  const calendarDays = eachDayOfInterval({ start: sDate, end: eDate })

  // Groups families
  const familias = [...new Set(servicios.map(s => s.familia))]

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.safeArea}>
        
        {/* Header Navegación */}
        {step !== 'confirmado' && (
          <View style={styles.header}>
            {step !== 'sucursal' ? (
              <TouchableOpacity onPress={goBack} style={styles.btnBack}>
                <Ionicons name="chevron-back" size={24} color="#1d1d1f" />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 40 }} />
            )}
            <Text style={styles.headerTitle}>
              {step === 'sucursal' && 'Sucursales'}
              {step === 'servicio' && 'Servicios'}
              {step === 'fecha' && 'Fecha y Hora'}
              {step === 'cliente' && 'Tus Datos'}
            </Text>
            <View style={{ width: 40 }} />
          </View>
        )}

        {/* ProgressBar */}
        {step !== 'confirmado' && (
          <View style={styles.progressContainer}>
            {(['sucursal', 'servicio', 'fecha', 'cliente'] as Step[]).map((s, i) => (
              <View key={s} style={[styles.progressDot, step === s && styles.progressDotActive]} />
            ))}
          </View>
        )}

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          
          {/* SUCURSAL */}
          {step === 'sucursal' && (
            <View style={styles.stepContainer}>
              <Text style={styles.title}>¿A qué sucursal deseas ir?</Text>
              <Text style={styles.subtitle}>Elige tu estudio favorito en Polanco.</Text>
              
              <View style={styles.listContainer}>
                {sucursales.map(s => (
                  <TouchableOpacity
                    key={s.id}
                    onPress={() => { setSelectedSucursal(s); setStep('servicio'); }}
                    style={styles.cardSelect}
                  >
                    <View style={styles.cardIconBox}>
                      <Ionicons name="location-outline" size={22} color={ACCENT} />
                    </View>
                    <View style={styles.cardText}>
                      <Text style={styles.cardTitle}>{s.nombre}</Text>
                      <Text style={styles.cardSubtitle}>{s.direccion?.split(',')[0]}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#c7c7cc" />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* SERVICIOS */}
          {step === 'servicio' && (
            <View style={styles.stepContainer}>
              <Text style={styles.title}>Selecciona tus servicios</Text>
              <Text style={styles.subtitle}>Puedes elegir más de uno para tu sesión.</Text>
              
              {familias.map(family => (
                <View key={family} style={styles.familyGroup}>
                  <Text style={styles.familyTitle}>{family}</Text>
                  {servicios.filter(s => s.familia === family).map(s => {
                    const isSelected = selectedServicios.some(item => item.id === s.id)
                    return (
                      <TouchableOpacity
                        key={s.id}
                        onPress={() => toggleServicio(s)}
                        style={[styles.serviceCard, isSelected && styles.serviceCardActive]}
                      >
                        <View style={styles.serviceText}>
                          <Text style={[styles.serviceTitle, isSelected && { color: ACCENT }]}>{s.nombre}</Text>
                          <Text style={[styles.serviceSub, isSelected && { color: ACCENT }]}>{s.duracion_slots * 15} min • ${s.precio}</Text>
                        </View>
                        {isSelected ? (
                          <Ionicons name="checkmark-circle" size={26} color={ACCENT} />
                        ) : (
                          <View style={styles.emptyCircle} />
                        )}
                      </TouchableOpacity>
                    )
                  })}
                </View>
              ))}
            </View>
          )}

          {/* FECHA Y HORA */}
          {step === 'fecha' && (
            <View style={styles.stepContainer}>
              <Text style={styles.title}>¿Cuándo vienes?</Text>
              <Text style={styles.subtitle}>Total: {totalTime} min en MUYMUY {selectedSucursal?.nombre}</Text>

              {/* Calendario Custom */}
              <View style={styles.calendarCard}>
                <View style={styles.calendarHeader}>
                  <Text style={styles.calendarMonthName}>
                    {format(currentMonth, 'MMMM yyyy', { locale: es }).replace(/^\w/, c => c.toUpperCase())}
                  </Text>
                  <View style={styles.calendarArrows}>
                    <TouchableOpacity
                      onPress={() => setCurrentMonth(subMonths(currentMonth, 1))}
                      disabled={isBefore(startOfMonth(subMonths(currentMonth, 0)), startOfMonth(new Date()))}
                      style={[styles.calArrowBtn, isBefore(startOfMonth(subMonths(currentMonth, 0)), startOfMonth(new Date())) && { opacity: 0.3 }]}
                    >
                      <Ionicons name="chevron-back" size={20} color="#1d1d1f" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setCurrentMonth(addMonths(currentMonth, 1))} style={styles.calArrowBtn}>
                      <Ionicons name="chevron-forward" size={20} color="#1d1d1f" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.calDaysHeaderRow}>
                  {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((d, index) => (
                    <Text key={index} style={styles.calDayHeadText}>{d}</Text>
                  ))}
                </View>

                <View style={styles.calGrid}>
                  {calendarDays.map((day, i) => {
                    const isSelected = selectedDate && isSameDay(day, selectedDate)
                    const isOutside = !isSameDay(startOfMonth(day), mStart)
                    const isPast = isBefore(startOfDay(day), startOfDay(new Date()))

                    let txColor = isSelected ? '#fff' : (isOutside ? '#d2d2d7' : (isPast ? '#e5e5e5' : '#1d1d1f'))
                    let bgColor = isSelected ? ACCENT : 'transparent'
                    let weight: any = (isSelected || isToday(day)) ? '700' : '400'

                    return (
                      <TouchableOpacity
                        key={i}
                        disabled={isPast}
                        onPress={() => { setSelectedDate(day); setSelectedTime(null); }}
                        style={styles.calDayBtnContainer}
                      >
                        <View style={[styles.calDayBtn, { backgroundColor: bgColor }]}>
                          <Text style={{ color: txColor, fontWeight: weight, fontSize: 15 }}>{format(day, 'd')}</Text>
                          {isToday(day) && !isSelected && <View style={styles.calTodayDot} />}
                        </View>
                      </TouchableOpacity>
                    )
                  })}
                </View>
              </View>

              {/* Horarios */}
              {selectedDate && (
                <View style={styles.timeSection}>
                  <Text style={styles.timeTitle}>Horarios disponibles</Text>
                  {fetchingSlots ? (
                    <ActivityIndicator size="small" color={ACCENT} style={{ marginVertical: 30 }} />
                  ) : availableSlots.length > 0 ? (
                    <View style={styles.timeGrid}>
                      {availableSlots.map(time => (
                        <TouchableOpacity
                          key={time}
                          onPress={() => setSelectedTime(time)}
                          style={[styles.timeBtn, selectedTime === time && { backgroundColor: ACCENT, borderColor: ACCENT }]}
                        >
                          <Text style={[styles.timeBtnText, selectedTime === time && { color: '#fff' }]}>{time}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : (
                    <View style={styles.noTimesCard}>
                      <Text style={styles.noTimesText}>No hay espacios para esta combinación de servicios en la fecha seleccionada.</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          )}

          {/* CLIENTE (if needed) */}
          {step === 'cliente' && (
            <View style={styles.stepContainer}>
              <Text style={styles.title}>Tus datos</Text>
              <Text style={styles.subtitle}>Agenda lista, solo nos faltan tus detalles.</Text>
              
              {!storedClienteId ? (
                <>
                  {isExistingClient && (
                    <View style={styles.existingClientBanner}>
                      <Ionicons name="sparkles" size={18} color={ACCENT} />
                      <Text style={styles.existingClientText}>¡Hola de nuevo! Encontramos tu cuenta.</Text>
                    </View>
                  )}
                  <View style={styles.formCard}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Teléfono celular *</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="10 dígitos"
                        keyboardType="numeric"
                        value={clientInfo.telefono}
                        onChangeText={t => setClientInfo(prev => ({ ...prev, telefono: sanitizePhone(t) }))}
                      />
                    </View>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Nombre completo *</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Escribe tu nombre"
                        value={clientInfo.nombre}
                        onChangeText={t => setClientInfo(prev => ({ ...prev, nombre: t }))}
                        editable={!isExistingClient}
                      />
                    </View>
                    <View style={[styles.inputGroup, { borderBottomWidth: 0, paddingBottom: 0, marginBottom: 0 }]}>
                      <Text style={styles.inputLabel}>Email (Opcional)</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Correo electrónico"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={clientInfo.email}
                        onChangeText={t => setClientInfo(prev => ({ ...prev, email: t }))}
                        editable={!isExistingClient}
                      />
                    </View>
                  </View>
                  <View style={styles.formCard}>
                    <Text style={styles.inputLabel}>¿Deseas agregar una nota? (Opcional)</Text>
                    <TextInput
                      style={[styles.input, { height: 80, textAlignVertical: 'top', paddingTop: 8 }]}
                      placeholder="Ej: Alergias, detalles del servicio..."
                      multiline
                      value={clientInfo.notas_cliente}
                      onChangeText={t => setClientInfo(prev => ({ ...prev, notas_cliente: t }))}
                    />
                  </View>
                </>
              ) : (
                <View style={styles.formCard}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: ACCENT, marginBottom: 4 }}>Hola, {clientInfo.nombre}</Text>
                  <Text style={{ fontSize: 14, color: '#6e6e73' }}>Ya tenemos tus datos guardados.</Text>
                </View>
              )}

              {/* Summary */}
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Resumen</Text>
                {selectedServicios.map(s => (
                  <View key={s.id} style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>{s.nombre}</Text>
                    <Text style={styles.summaryValue}>${s.precio}</Text>
                  </View>
                ))}
                <View style={styles.summaryDivider} />
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total</Text>
                  <Text style={[styles.summaryValue, { fontSize: 20, color: ACCENT }]}>${totalPrice}</Text>
                </View>
              </View>

            </View>
          )}

          {/* CONFIRMADO */}
          {step === 'confirmado' && (
            <View style={styles.confirmContainer}>
              <View style={styles.confirmCircle}>
                <Ionicons name="checkmark" size={50} color="#fff" />
              </View>
              <Text style={styles.confirmTitle}>¡Cita agendada!</Text>
              <Text style={styles.confirmSubtitle}>
                Gracias {clientInfo.nombre}. Hemos reservado tu lugar para el {selectedDate && format(selectedDate, 'd MMMM', { locale: es })} a las {selectedTime}.
              </Text>

              <View style={styles.remindCard}>
                <View style={styles.remindHeaderRow}>
                  <Ionicons name="sparkles" size={18} color={ACCENT} />
                  <Text style={styles.remindHeadText}>Recordatorio Importante</Text>
                </View>
                <Text style={styles.remindText}>
                  Llega 10 minutos antes de tu cita en MUYMUY {selectedSucursal?.nombre}. Si necesitas cancelar, avísanos con 24 horas de antelación.
                </Text>
              </View>

              <TouchableOpacity style={styles.btnHome} onPress={handleNextReserva}>
                <Text style={styles.btnHomeText}>Volver al inicio</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Global Floating Actions */}
        {step === 'servicio' && selectedServicios.length > 0 && (
          <View style={styles.floatingBar}>
            <View>
              <Text style={styles.floatTextTotal}>${totalPrice}</Text>
              <Text style={styles.floatTextTime}>{totalTime} min</Text>
            </View>
            <TouchableOpacity style={styles.btnPrimary} onPress={() => setStep('fecha')}>
              <Text style={styles.btnPrimaryText}>Continuar</Text>
            </TouchableOpacity>
          </View>
        )}
        {step === 'fecha' && selectedTime && (
           <View style={styles.floatingBar}>
            <View>
              <Text style={styles.floatTextTotal}>{selectedTime}</Text>
              <Text style={styles.floatTextTime}>{format(selectedDate!, 'd MMM', { locale: es })}</Text>
            </View>
            <TouchableOpacity style={styles.btnPrimary} onPress={() => setStep('cliente')}>
              <Text style={styles.btnPrimaryText}>Continuar</Text>
            </TouchableOpacity>
          </View>
        )}
        {step === 'cliente' && (
          <View style={styles.floatingBar}>
            <TouchableOpacity style={[styles.btnPrimary, { width: '100%' }, submitting && { opacity: 0.7 }]} onPress={handleConfirm} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnPrimaryText}>Confirmar Reservación</Text>}
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fcfcfc' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
  },
  btnBack: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1d1d1f' },
  progressContainer: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 12 },
  progressDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#e5e5e5' },
  progressDotActive: { backgroundColor: ACCENT },
  
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 16 },
  
  stepContainer: { flex: 1 },
  title: { fontSize: 26, fontWeight: '800', color: '#1d1d1f', marginBottom: 6, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: '#6e6e73', marginBottom: 24 },

  /* List Sucursales */
  listContainer: { gap: 14 },
  cardSelect: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#efefef',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 6,
  },
  cardIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#f0f7e6', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 17, fontWeight: '600', color: '#1d1d1f', marginBottom: 2 },
  cardSubtitle: { fontSize: 13, color: '#86868b' },

  /* Servicios */
  familyGroup: { marginBottom: 24 },
  familyTitle: { fontSize: 12, fontWeight: '700', color: '#86868b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginLeft: 4 },
  serviceCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#efefef',
    marginBottom: 10,
  },
  serviceCardActive: { borderColor: ACCENT, backgroundColor: '#f9fcf5' },
  serviceText: { flex: 1 },
  serviceTitle: { fontSize: 15, fontWeight: '600', color: '#1d1d1f', marginBottom: 4 },
  serviceSub: { fontSize: 13, color: '#86868b' },
  emptyCircle: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#efefef' },

  /* Calendar */
  calendarCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#efefef',
  },
  calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  calendarMonthName: { fontSize: 16, fontWeight: '700', color: '#1d1d1f' },
  calendarArrows: { flexDirection: 'row', gap: 10 },
  calArrowBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#f5f5f7', justifyContent: 'center', alignItems: 'center' },
  calDaysHeaderRow: { flexDirection: 'row', marginBottom: 8 },
  calDayHeadText: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '700', color: '#86868b' },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calDayBtnContainer: { width: '14.28%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  calDayBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  calTodayDot: { position: 'absolute', bottom: 4, width: 4, height: 4, borderRadius: 2, backgroundColor: ACCENT },

  /* Times */
  timeSection: { marginTop: 24 },
  timeTitle: { fontSize: 14, fontWeight: '700', color: '#86868b', marginBottom: 12, marginLeft: 4 },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  timeBtn: { width: (width - 48 - 30) / 4, paddingVertical: 12, borderRadius: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: '#efefef', alignItems: 'center' },
  timeBtnText: { fontSize: 14, fontWeight: '600', color: '#1d1d1f' },
  noTimesCard: { backgroundColor: '#fff', padding: 24, borderRadius: 16, borderWidth: 1, borderColor: '#efefef', borderStyle: 'dashed', alignItems: 'center' },
  noTimesText: { color: '#86868b', fontSize: 14, textAlign: 'center' },

  /* Form & Summary */
  formCard: { backgroundColor: '#fff', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#efefef', marginBottom: 24 },
  inputGroup: { marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f2f2f2', paddingBottom: 6 },
  inputLabel: { fontSize: 11, fontWeight: '700', color: '#86868b', textTransform: 'uppercase', marginBottom: 6 },
  input: { fontSize: 16, color: '#1d1d1f', height: 40 },
  existingClientBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f7e6', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, marginBottom: 16 },
  existingClientText: { color: ACCENT, fontWeight: '600', fontSize: 14, marginLeft: 8 },
  
  summaryCard: { backgroundColor: '#f9fcf5', padding: 20, borderRadius: 16 },
  summaryTitle: { fontSize: 14, fontWeight: '700', color: ACCENT, marginBottom: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' },
  summaryLabel: { fontSize: 15, color: '#424245' },
  summaryValue: { fontSize: 15, fontWeight: '600', color: '#1d1d1f' },
  summaryDivider: { height: 1, backgroundColor: ACCENT, opacity: 0.15, marginVertical: 12 },

  /* Confirmado */
  confirmContainer: { flex: 1, alignItems: 'center', paddingTop: 20 },
  confirmCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: ACCENT, justifyContent: 'center', alignItems: 'center', marginBottom: 20, shadowColor: ACCENT, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10 },
  confirmTitle: { fontSize: 28, fontWeight: '800', color: '#1d1d1f', marginBottom: 12 },
  confirmSubtitle: { fontSize: 16, color: '#6e6e73', textAlign: 'center', lineHeight: 24, marginBottom: 32 },
  remindCard: { backgroundColor: '#fff', padding: 24, borderRadius: 20, borderWidth: 1, borderColor: '#efefef', width: '100%', marginBottom: 32 },
  remindHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  remindHeadText: { fontSize: 15, fontWeight: '700', color: '#1d1d1f' },
  remindText: { fontSize: 14, color: '#6e6e73', lineHeight: 22 },
  btnHome: { backgroundColor: '#f5f5f7', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 30 },
  btnHomeText: { fontSize: 15, fontWeight: '600', color: '#1d1d1f' },

  /* Floating Bar */
  floatingBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1, borderTopColor: '#f2f2f2',
    paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.05, shadowRadius: 10,
  },
  floatTextTotal: { fontSize: 18, fontWeight: '800', color: ACCENT },
  floatTextTime: { fontSize: 12, color: '#86868b', fontWeight: '600', marginTop: 2 },
  btnPrimary: { backgroundColor: '#1d1d1f', paddingVertical: 14, paddingHorizontal: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  btnPrimaryText: { color: '#fff', fontSize: 16, fontWeight: '700' },
})
