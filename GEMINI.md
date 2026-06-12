# 🤖 GEMINI — Reglas del proyecto para agentes IA

> Este archivo define el flujo de trabajo que el agente DEBE seguir en este proyecto.
> Léelo completo al inicio de cada sesión antes de hacer cualquier cambio.

---

## ⚠️ REGLA #1 — Docker y Supabase local PRIMERO

**Antes de cualquier cambio en la base de datos o Edge Functions:**

1. **Verificar que Docker está corriendo.** Ejecutar:
   ```bash
   docker ps 2>&1 | head -5
   ```
   Si el comando falla o devuelve "Cannot connect", **DETENTE** y avisa al usuario:
   > "⚠️ Docker no está abierto. Ábrelo antes de continuar para poder probar los cambios localmente."

2. **Verificar que Supabase local está activo.** Ejecutar:
   ```bash
   npx supabase status 2>&1 | head -5
   ```
   Si no está corriendo, iniciar con:
   ```bash
   npx supabase start
   ```

---

## 🔄 REGLA #2 — Flujo obligatorio: Local → Producción

**NUNCA hacer push directo a producción sin probar localmente primero.**

### Para migraciones SQL (`supabase/migrations/`):

```
1. Crear el archivo de migración
        ↓
2. Aplicar SOLO en local:
   npx supabase db reset   ← resetea y aplica TODAS las migraciones (primer setup)
   — o —
   psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -f supabase/migrations/NUEVA.sql
        ↓
3. Verificar en Supabase Studio local (http://127.0.0.1:54323)
   - Confirmar que la función/tabla/política existe
   - Hacer una prueba manual si es posible
        ↓
4. Confirmar con el usuario: "✅ Probado en local. ¿Hago push a producción?"
        ↓
5. Push a producción SOLO con aprobación explícita:
   npx supabase db push
```

### Para Edge Functions (`supabase/functions/`):

```
1. Crear/editar la función
        ↓
2. Probar en local:
   npx supabase functions serve <nombre-funcion> --no-verify-jwt
        ↓
3. Hacer una prueba con curl o desde la app apuntando a local
        ↓
4. Confirmar con el usuario: "✅ Probada en local. ¿Hago deploy a producción?"
        ↓
5. Deploy a producción SOLO con aprobación explícita:
   npx supabase functions deploy <nombre-funcion>
```

### Para cambios de código frontend (apps/web, apps/mobile):

```
1. Editar archivos
        ↓
2. Compilar para verificar errores de TypeScript:
   cd apps/web && npm run build 2>&1 | tail -20
        ↓
3. Correr tests si los hay:
   cd apps/web && npm test
        ↓
4. Si hay errores → corregir antes de commitear
        ↓
5. Commit y push a git
```

---

## 🔍 REGLA #3 — Verificar migración aplicada en ambos entornos

Después de cualquier migración, verificar que local y remota están sincronizadas:

```bash
npx supabase migration list
```

La columna `Local` y `Remote` deben ser **idénticas**. Si hay diferencias, reportarlas al usuario antes de continuar.

---

## 📋 REGLA #4 — Checklist antes de cada sesión de DB

Al inicio de cualquier tarea que involucre la base de datos, ejecutar este checklist en orden:

```bash
# 1. ¿Docker corriendo?
docker ps --format "table {{.Names}}\t{{.Status}}" | grep supabase

# 2. ¿Supabase local activo?
npx supabase status 2>&1 | grep -E "(Studio|stopped|running)"

# 3. ¿Migraciones sincronizadas?
npx supabase migration list 2>&1 | tail -5
```

Si cualquier paso falla → **avisar al usuario y esperar antes de proceder**.

---

## 🚫 REGLA #5 — Comandos prohibidos sin confirmación previa

Los siguientes comandos NUNCA deben ejecutarse sin confirmación explícita del usuario:

| Comando | Riesgo | Acción requerida |
|---|---|---|
| `npx supabase db push` | Escribe en producción | Confirmación explícita del usuario |
| `npx supabase db reset` | Borra y recrea la BD local | Confirmar que el usuario es consciente |
| `npx supabase functions deploy` | Despliega a producción | Confirmación explícita del usuario |
| `DROP TABLE`, `TRUNCATE`, `DELETE` sin WHERE | Pérdida de datos | Nunca en producción, solo en local con aviso |

---

## 💡 Recordatorios automáticos

Al iniciar cualquier sesión de trabajo en este proyecto, el agente debe:

1. Recordar al usuario **abrir Docker** si no está confirmado que está activo.
2. Mencionar el flujo **local → producción** si la tarea involucra BD o funciones.
3. Correr los **tests** (`npm test`) después de cambios en lógica de negocio.

---

## 📁 Referencias rápidas

| Recurso | URL / Ruta |
|---|---|
| Supabase Studio local | http://127.0.0.1:54323 |
| API local | http://127.0.0.1:54321 |
| DB local (psql) | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` |
| Supabase Dashboard (prod) | https://supabase.com/dashboard/project/rpoimbevndgwdkxifmbw |
| Edge Functions (prod) | https://supabase.com/dashboard/project/rpoimbevndgwdkxifmbw/functions |
| Arquitectura del proyecto | `ARCHITECTURE.md` |
