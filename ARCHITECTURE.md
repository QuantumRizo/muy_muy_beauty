# 🏗️ MUYMUY Beauty — Arquitectura del Monorepo

## Estructura

```
muy_muy_beauty/
│
├── apps/
│   └── mobile/              ← App iPhone (Expo + React Native)
│
├── packages/                ← Código COMPARTIDO entre web y mobile
│   ├── supabase/            ← createClient re-exportado
│   ├── types/               ← Tipos TypeScript (fuente de verdad)
│   └── logic/               ← Lógica de negocio pura (comisiones, etc.)
│
├── src/                     ← Web app actual (Vite + React)
│   ├── components/
│   ├── pages/
│   ├── lib/
│   └── types/               ← ⚠️ Migrar a @muymuy/types (ver abajo)
│
├── pnpm-workspace.yaml      ← Define los workspaces
└── ARCHITECTURE.md          ← Este archivo
```

---

## Paquetes compartidos

| Paquete | Descripción | Importar como |
|---|---|---|
| `@muymuy/types` | Tipos TypeScript del esquema de Supabase | `import type { Cita } from '@muymuy/types'` |
| `@muymuy/logic` | Cálculo de comisiones, formatters | `import { calcularComision } from '@muymuy/logic'` |
| `@muymuy/supabase` | Re-exporta `createClient` de Supabase | Base para cada app |

---

## Cómo funciona el Supabase en cada app

Cada app tiene **su propio cliente** (distintas env vars), pero comparten el mismo proyecto de Supabase:

```
Web (Vite)              →  src/lib/supabase.ts  →  VITE_SUPABASE_URL
Mobile (Expo)           →  apps/mobile/lib/supabase.ts  →  EXPO_PUBLIC_SUPABASE_URL
```

Ambos apuntan al mismo Supabase. Las env vars son idénticas en valor, diferente en nombre (prefijo del bundler).

---

## Migración pendiente (cuando arranque mobile)

Cuando empiece el desarrollo de la app móvil, completar:

### Paso 1 — Mover web a `apps/web/`
```bash
mkdir -p apps/web
mv src public index.html vite.config.ts tsconfig*.json eslint.config.js apps/web/
mv package.json apps/web/package.json
# Crear nuevo package.json en raíz (workspace root)
```

### Paso 2 — Actualizar Vercel
En el dashboard de Vercel → Settings → General:
- **Root Directory:** `apps/web`
- **Build Command:** `npm run build` (sin cambios)
- **Output Directory:** `dist` (sin cambios)

### Paso 3 — Migrar imports de tipos en web
```ts
// ANTES (web actual):
import type { Cita } from '../types/database'

// DESPUÉS (cuando sea monorepo completo):
import type { Cita } from '@muymuy/types'
```

### Paso 4 — Inicializar Expo
```bash
cd apps/mobile
npx create-expo-app@latest . --template blank-typescript
```

---

## Decisiones de arquitectura

### ¿Por qué pnpm workspaces y no npm workspaces?
- pnpm es más eficiente en disco (hard links en node_modules)
- Mejor soporte para monorepos en el ecosistema React Native/Expo

### ¿Por qué no Turborepo?
- Para 2 apps, el overhead de configuración no vale la pena todavía
- Se puede agregar después sin romper nada

### ¿Por qué no un solo App.tsx para web y mobile?
- Web usa HTML/CSS, mobile usa View/StyleSheet — son incompatibles
- La lógica de negocio SÍ es compartible, la UI NO
