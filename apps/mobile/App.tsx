/**
 * MUYMUY Beauty — App Mobile
 * Entry point de la aplicación Expo
 *
 * ⚠️  PLACEHOLDER — Pendiente de inicializar
 *
 * Para arrancar el desarrollo:
 *   1. Ve a apps/mobile/
 *   2. pnpm install
 *   3. pnpm ios
 */
import { Text, View } from 'react-native'

export default function App() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
      <Text style={{ fontSize: 32, fontWeight: '800', color: '#88B04B' }}>MUYMUY</Text>
      <Text style={{ fontSize: 16, color: '#6e6e73', marginTop: 8 }}>Beauty Studio</Text>
      <Text style={{ fontSize: 12, color: '#b0b0b0', marginTop: 24 }}>
        App en desarrollo — próximamente en App Store
      </Text>
    </View>
  )
}
