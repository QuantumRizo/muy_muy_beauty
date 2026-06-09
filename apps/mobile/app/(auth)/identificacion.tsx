import { useEffect, useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert
} from 'react-native'
import { useRouter } from 'expo-router'
import * as SecureStore from 'expo-secure-store'
import { supabase } from '../../lib/supabase'

type Paso = 'telefono' | 'registro'

export default function IdentificacionScreen() {
  const router = useRouter()
  const [paso, setPaso] = useState<Paso>('telefono')
  const [loading, setLoading] = useState(false)
  const [telefono, setTelefono] = useState('')
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')

  const sanitize = (val: string) => val.replace(/\D/g, '').slice(0, 10)

  async function handleContinuar() {
    const tel = telefono.trim()
    if (tel.length < 10) {
      Alert.alert('Telefono invalido', 'Ingresa un numero de 10 digitos.')
      return
    }
    setLoading(true)
    try {
      const { data: existing } = await supabase
        .from('clientes')
        .select('id, nombre_completo')
        .eq('telefono_cel', tel)
        .maybeSingle()

      if (existing) {
        await SecureStore.setItemAsync('cliente_id', existing.id)
        await SecureStore.setItemAsync('cliente_nombre', existing.nombre_completo)
        await SecureStore.setItemAsync('cliente_telefono', tel) // 🔧 BUG FIX: Persist phone so reservar.tsx can read it
        router.replace('/(tabs)/inicio')
      } else {
        setPaso('registro')
      }
    } catch {
      Alert.alert('Error', 'No pudimos verificar tu numero. Intentalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  async function handleRegistrar() {
    if (!nombre.trim()) {
      Alert.alert('Falta tu nombre', 'Por favor ingresa tu nombre completo.')
      return
    }
    setLoading(true)
    try {
      const { data: nuevo, error } = await supabase
        .from('clientes')
        .insert({
          nombre_completo: nombre.trim(),
          telefono_cel: telefono.trim(),
          email: email.trim() || null,
          datos_extra: {},
        })
        .select('id, nombre_completo')
        .single()

      if (error) throw error

      await SecureStore.setItemAsync('cliente_id', nuevo.id)
      await SecureStore.setItemAsync('cliente_nombre', nuevo.nombre_completo)
      await SecureStore.setItemAsync('cliente_telefono', telefono.trim()) // 🔧 BUG FIX: Persist phone so reservar.tsx can read it
      router.replace('/(tabs)/inicio')
    } catch {
      Alert.alert('Error', 'No pudimos crear tu perfil. Intentalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <TouchableOpacity style={styles.backBtn} onPress={() => {
          if (router.canGoBack()) router.back()
          else router.replace('/(tabs)/inicio')
        }}>
          <Text style={styles.backText}>Cancelar</Text>
        </TouchableOpacity>

        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>MUYMUY</Text>
          <Text style={styles.logoSub}>Beauty Studio</Text>
        </View>

        {paso === 'telefono' ? (
          <>
            <Text style={styles.title}>Identificate</Text>
            <Text style={styles.subtitle}>
              Ingresa tu numero de telefono. Si ya eres clienta, te reconoceremos al instante.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Numero de telefono</Text>
              <TextInput
                style={styles.input}
                value={telefono}
                onChangeText={(v) => setTelefono(sanitize(v))}
                keyboardType="phone-pad"
                placeholder="55 1234 5678"
                placeholderTextColor="#b0b0b0"
                maxLength={10}
                autoFocus
              />
            </View>

            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={handleContinuar}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnText}>Continuar</Text>
              }
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.title}>Nueva clienta</Text>
            <Text style={styles.subtitle}>
              Es tu primera vez. Solo necesitamos unos datos basicos.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nombre completo *</Text>
              <TextInput
                style={styles.input}
                value={nombre}
                onChangeText={setNombre}
                placeholder="Tu nombre"
                placeholderTextColor="#b0b0b0"
                autoFocus
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Correo electronico (opcional)</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                placeholder="tu@email.com"
                placeholderTextColor="#b0b0b0"
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={handleRegistrar}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnText}>Crear mi perfil</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setPaso('telefono')} style={styles.back}>
              <Text style={styles.backAlt}>Cambiar numero</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, paddingHorizontal: 28, paddingTop: 60, paddingBottom: 40 },
  backBtn: { marginBottom: 28, alignSelf: 'flex-start' },
  backText: { fontSize: 15, color: '#ff3b30', fontWeight: '600' },
  logoContainer: { marginBottom: 40 },
  logoText: { fontSize: 26, fontWeight: '800', color: '#88B04B', letterSpacing: -1 },
  logoSub: { fontSize: 13, color: '#6e6e73', marginTop: 2 },
  title: { fontSize: 26, fontWeight: '700', color: '#1d1d1f', marginBottom: 10, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: '#6e6e73', lineHeight: 22, marginBottom: 36 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#1d1d1f', marginBottom: 8 },
  input: {
    borderWidth: 1.5, borderColor: '#e5e7eb',
    borderRadius: 14, padding: 16, fontSize: 17,
    color: '#1d1d1f', backgroundColor: '#fafafa',
  },
  btn: { backgroundColor: '#1d1d1f', padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 8 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  back: { marginTop: 20, alignItems: 'center' },
  backAlt: { fontSize: 14, color: '#6e6e73' },
})
