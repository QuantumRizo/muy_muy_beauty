/**
 * Cliente Supabase para la app móvil (Expo).
 *
 * Lee las variables de entorno de Expo (EXPO_PUBLIC_*).
 * Las variables deben estar en apps/mobile/.env.local
 *
 * EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
 * EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
 */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
