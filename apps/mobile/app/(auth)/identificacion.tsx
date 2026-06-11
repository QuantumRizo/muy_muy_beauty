import { useEffect, useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert
} from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { supabase } from '../../lib/supabase'

type Paso = 'telefono' | 'registro' | 'codigo'

export default function IdentificacionScreen() {
  const router = useRouter()
  const params = useLocalSearchParams()
  const returnTo = params.returnTo as string

  function navigateBack() {
    if (returnTo === 'citas') router.replace('/(tabs)/citas')
    else if (returnTo === 'perfil') router.replace('/(tabs)/perfil')
    else router.replace('/(tabs)/inicio')
  }

  const [paso, setPaso] = useState<Paso>('telefono')
  const [loading, setLoading] = useState(false)
  const [telefono, setTelefono] = useState('')
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [codigo, setCodigo] = useState('')
  const [isExisting, setIsExisting] = useState(true)

  const sanitize = (val: string) => val.replace(/\D/g, '').slice(0, 10)

  // 1. Verificamos si existe y mandamos OTP
  async function handleContinuar() {
    const tel = telefono.trim()
    if (tel.length < 10) {
      Alert.alert('Teléfono inválido', 'Ingresa un número de 10 dígitos.')
      return
    }
    setLoading(true)
    try {
      // Checar si ya existe en nuestra tabla pública
      const { data: existing, error } = await supabase.rpc('verificar_cliente_por_telefono', { p_telefono: tel })
      if (error) throw error

      if (existing?.existe && existing.id) {
        setIsExisting(true)
        await enviarOtp(tel)
      } else {
        setIsExisting(false)
        setPaso('registro')
      }
    } catch {
      Alert.alert('Error', 'No pudimos verificar tu número. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  // 2. Si no existe, pedimos sus datos y luego mandamos OTP
  async function handleRegistrar() {
    if (!nombre.trim()) {
      Alert.alert('Falta tu nombre', 'Por favor ingresa tu nombre completo.')
      return
    }
    setLoading(true)
    try {
      await enviarOtp(telefono.trim())
    } catch {
      Alert.alert('Error', 'No pudimos enviar el código. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  // Llama a Supabase Auth para enviar el SMS
  async function enviarOtp(tel: string) {
    const { error } = await supabase.auth.signInWithOtp({
      phone: '+52' + tel,
    })
    if (error) {
      Alert.alert('Error', 'No se pudo enviar el SMS: ' + error.message)
      return
    }
    setPaso('codigo')
  }

  // 3. Verificamos el código OTP
  async function handleVerificarCodigo() {
    if (codigo.length < 6) {
      Alert.alert('Código incompleto', 'Ingresa los 6 dígitos que recibiste por SMS.')
      return
    }
    setLoading(true)
    try {
      // Validar con Supabase Auth
      const { data: { session }, error: authError } = await supabase.auth.verifyOtp({
        phone: '+52' + telefono.trim(),
        token: codigo.trim(),
        type: 'sms'
      })

      if (authError || !session) {
        throw new Error('Código incorrecto o expirado.')
      }

      // Una vez logueado, vinculamos el auth_user_id a nuestra tabla clientes
      const { data: bindData, error: bindError } = await supabase.rpc('vincular_cliente_auth', {
        p_nombre: isExisting ? null : nombre.trim(),
        p_email: isExisting ? null : email.trim() || null
      })

      if (bindError) throw bindError
      if (bindData?.error) throw new Error(bindData.error)

      // Éxito, regresar a la pantalla anterior
      navigateBack()
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Error al verificar el código.')
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
          if (paso === 'codigo' || paso === 'registro') setPaso('telefono')
          else if (router.canGoBack()) router.back()
          else router.replace('/(tabs)/inicio')
        }}>
          <Text style={styles.backText}>{paso === 'telefono' ? 'Cancelar' : 'Atrás'}</Text>
        </TouchableOpacity>

        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>MUYMUY</Text>
          <Text style={styles.logoSub}>Beauty Studio</Text>
        </View>

        {paso === 'telefono' && (
          <>
            <Text style={styles.title}>Identifícate</Text>
            <Text style={styles.subtitle}>
              Ingresa tu número de teléfono. Te enviaremos un código SMS para entrar de forma segura.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Número de teléfono celular</Text>
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
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Continuar</Text>}
            </TouchableOpacity>
          </>
        )}

        {paso === 'registro' && (
          <>
            <Text style={styles.title}>Nuevo cliente</Text>
            <Text style={styles.subtitle}>
              Es tu primera vez. Necesitamos tu nombre para crear tu expediente.
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
              <Text style={styles.label}>Correo electrónico (opcional)</Text>
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
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Enviar código SMS</Text>}
            </TouchableOpacity>
          </>
        )}

        {paso === 'codigo' && (
          <>
            <Text style={styles.title}>Verifica tu número</Text>
            <Text style={styles.subtitle}>
              Hemos enviado un código SMS de 6 dígitos al {telefono}.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Código SMS</Text>
              <TextInput
                style={[styles.input, { fontSize: 24, letterSpacing: 8, textAlign: 'center' }]}
                value={codigo}
                onChangeText={(v) => setCodigo(sanitize(v).slice(0, 6))}
                keyboardType="number-pad"
                placeholder="123456"
                placeholderTextColor="#d0d0d0"
                maxLength={6}
                autoFocus
              />
            </View>

            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={handleVerificarCodigo}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Entrar</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => enviarOtp(telefono)} style={styles.back} disabled={loading}>
              <Text style={styles.backAlt}>Reenviar código</Text>
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
