# 📱 MUYMUY Beauty — App Mobile

App de iPhone para MUYMUY Beauty Studio, construida con **Expo + React Native**.

## Stack

| Tecnología | Rol |
|---|---|
| Expo ~52 | Build y distribución iOS |
| expo-router | Navegación entre pantallas |
| @supabase/supabase-js | Mismo backend que el web admin |
| Zustand | Estado global |
| @muymuy/types | Tipos compartidos con la web |
| @muymuy/logic | Comisiones y lógica de negocio compartida |

---

## Cómo arrancar el desarrollo

### 1. Prerequisitos
```bash
# Instalar Expo CLI globalmente
npm install -g expo-cli

# Tener Xcode instalado (solo macOS, para iOS simulator)
```

### 2. Variables de entorno
Crea el archivo `apps/mobile/.env.local`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

> Son las mismas claves que están en el `.env` de la raíz (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).
> Solo cambia el prefijo de `VITE_` a `EXPO_PUBLIC_`.

### 3. Instalar y correr
```bash
cd apps/mobile
pnpm install
pnpm ios        # Abre el simulador de iPhone
pnpm android    # Abre el simulador de Android
```

---

## Estructura de carpetas (a construir)

```
apps/mobile/
├── app/                  ← Pantallas (expo-router, basado en archivos)
│   ├── (auth)/
│   │   └── login.tsx     ← Login con Supabase Auth
│   ├── (tabs)/
│   │   ├── agenda.tsx    ← Ver mis citas del día
│   │   ├── clientes.tsx  ← Buscar clientes
│   │   └── perfil.tsx    ← Mi perfil
│   └── _layout.tsx       ← Layout raíz
├── components/           ← Componentes nativos (View, Text, etc.)
├── lib/
│   └── supabase.ts       ← Cliente Supabase (ya creado)
├── App.tsx               ← Entry point (placeholder actual)
├── app.json              ← Config Expo
└── package.json
```

---

## Código compartido con la web

Los paquetes en `packages/` son usados tanto por la web como por esta app:

```ts
// Tipos (misma base de datos, mismos tipos)
import type { Cita, Cliente, Ticket } from '@muymuy/types'

// Lógica de comisiones (idéntica en web y mobile)
import { calcularComision, TABLA_COMISION } from '@muymuy/logic'

// El supabase client es independiente por app (distintas env vars)
import { supabase } from '../lib/supabase'
```

---

## Publicación en App Store

1. Crear cuenta en [Apple Developer Program](https://developer.apple.com) (~$99 USD/año)
2. `expo build:ios` o usar **EAS Build** (servicio de Expo)
3. Subir el `.ipa` con Xcode o Transporter
4. Enviar para revisión de Apple (~24-48h)
