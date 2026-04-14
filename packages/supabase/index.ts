/**
 * @muymuy/supabase
 *
 * Cliente de Supabase compartido entre la web app y la app móvil.
 * Ambas apps importan desde aquí en lugar de tener su propio cliente.
 *
 * Uso en web:    import { supabase } from '@muymuy/supabase'
 * Uso en mobile: import { supabase } from '@muymuy/supabase'
 *
 * NOTA: Las variables de entorno deben estar definidas en cada app:
 *   - Web:    VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY  (vite)
 *   - Mobile: EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY (expo)
 *
 * Por esa razón, cada app mantiene su propio src/lib/supabase.ts que
 * lee sus variables de entorno locales e importa createClient de aquí.
 * Este archivo exporta el tipo Database y utilidades comunes.
 */

export { createClient } from '@supabase/supabase-js'
export type { SupabaseClient } from '@supabase/supabase-js'
