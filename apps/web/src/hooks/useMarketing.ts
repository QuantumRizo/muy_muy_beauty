import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { hoyMX, inicioMesMX } from '../lib/dateUtils'
import type { MarketingConfig, MarketingCampana, MarketingPlatform } from '../types/database'

// ─── Hook: useMarketing ────────────────────────────────────────────
// Gestiona la configuración de integraciones y campañas de marketing.

export interface MarketingInsights {
  spend: number
  impressions: number
  clicks: number
  leads: number
  reach: number
  ctr: number  // Click-Through Rate %
  cpl: number  // Cost per Lead
  cpc: number  // Cost per Click
}

interface UseMarketingResult {
  config: MarketingConfig | null
  campanas: MarketingCampana[]
  insights: MarketingInsights | null
  loading: boolean
  saving: boolean
  loadingInsights: boolean
  error: string | null
  saveConfig: (platform: MarketingPlatform, apiKey: string, accountId: string) => Promise<boolean>
  addCampana: (data: Partial<MarketingCampana>) => Promise<boolean>
  updateCampana: (id: string, data: Partial<MarketingCampana>) => Promise<boolean>
  deleteCampana: (id: string) => Promise<boolean>
  fetchInsights: (dateRange?: { from: string; to: string }) => Promise<void>
  refresh: () => void
}

export function useMarketing(sucursalId: string, platform: MarketingPlatform = 'meta'): UseMarketingResult {
  const [config, setConfig] = useState<MarketingConfig | null>(null)
  const [campanas, setCampanas] = useState<MarketingCampana[]>([])
  const [insights, setInsights] = useState<MarketingInsights | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loadingInsights, setLoadingInsights] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshTick, setRefreshTick] = useState(0)

  const refresh = useCallback(() => setRefreshTick(t => t + 1), [])

  // ─── Load Config & Campaigns ──────────────────────────────────
  useEffect(() => {
    if (!sucursalId) return
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      try {
        // Load marketing config
        const { data: configData, error: configErr } = await supabase
          .from('marketing_configs')
          .select('*')
          .eq('sucursal_id', sucursalId)
          .eq('platform', platform)
          .eq('active', true)
          .maybeSingle()

        if (configErr) throw configErr

        // Load campaigns for this sucursal
        const { data: campanasData, error: campanasErr } = await supabase
          .from('marketing_campanas')
          .select('*')
          .eq('sucursal_id', sucursalId)
          .order('created_at', { ascending: false })

        if (campanasErr) throw campanasErr

        if (!cancelled) {
          setConfig(configData ?? null)
          setCampanas(campanasData ?? [])
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Error cargando la configuración de marketing')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [sucursalId, platform, refreshTick])

  // ─── Save Config (API Key + Account ID) ──────────────────────
  const saveConfig = useCallback(async (
    plat: MarketingPlatform,
    apiKey: string,
    accountId: string
  ): Promise<boolean> => {
    if (!sucursalId) return false
    setSaving(true)
    setError(null)

    try {
      if (config) {
        // Update existing config
        const { error: err } = await supabase
          .from('marketing_configs')
          .update({ api_key: apiKey, account_id: accountId, updated_at: new Date().toISOString() })
          .eq('id', config.id)

        if (err) throw err
      } else {
        // Insert new config
        const { error: err } = await supabase
          .from('marketing_configs')
          .insert({
            sucursal_id: sucursalId,
            platform: plat,
            api_key: apiKey,
            account_id: accountId,
            active: true
          })

        if (err) throw err
      }

      refresh()
      return true
    } catch (err: any) {
      setError(err.message || 'Error guardando la configuración')
      return false
    } finally {
      setSaving(false)
    }
  }, [config, sucursalId, refresh])

  // ─── Add Campaign ─────────────────────────────────────────────
  const addCampana = useCallback(async (data: Partial<MarketingCampana>): Promise<boolean> => {
    if (!sucursalId) return false
    setSaving(true)
    setError(null)

    try {
      const { error: err } = await supabase
        .from('marketing_campanas')
        .insert({
          sucursal_id: sucursalId,
          config_id: config?.id ?? null,
          nombre: data.nombre ?? 'Nueva campaña',
          platform: data.platform ?? platform,
          estado: data.estado ?? 'activa',
          fecha_inicio: data.fecha_inicio ?? null,
          fecha_fin: data.fecha_fin ?? null,
          presupuesto: data.presupuesto ?? 0,
          gasto: data.gasto ?? 0,
          impresiones: data.impresiones ?? 0,
          clics: data.clics ?? 0,
          leads: data.leads ?? 0,
          platform_id: data.platform_id ?? null
        })

      if (err) throw err
      refresh()
      return true
    } catch (err: any) {
      setError(err.message || 'Error al crear la campaña')
      return false
    } finally {
      setSaving(false)
    }
  }, [config, sucursalId, platform, refresh])

  // ─── Update Campaign ──────────────────────────────────────────
  const updateCampana = useCallback(async (id: string, data: Partial<MarketingCampana>): Promise<boolean> => {
    setSaving(true)
    setError(null)

    try {
      const { error: err } = await supabase
        .from('marketing_campanas')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (err) throw err
      refresh()
      return true
    } catch (err: any) {
      setError(err.message || 'Error al actualizar la campaña')
      return false
    } finally {
      setSaving(false)
    }
  }, [refresh])

  // ─── Delete Campaign ──────────────────────────────────────────
  const deleteCampana = useCallback(async (id: string): Promise<boolean> => {
    setSaving(true)
    setError(null)

    try {
      const { error: err } = await supabase
        .from('marketing_campanas')
        .delete()
        .eq('id', id)

      if (err) throw err
      refresh()
      return true
    } catch (err: any) {
      setError(err.message || 'Error al eliminar la campaña')
      return false
    } finally {
      setSaving(false)
    }
  }, [refresh])

  // ─── Fetch Insights vía Edge Function (proxy seguro) ──────────
  // La Edge Function recupera el api_key desde la BD y llama a Meta
  // server-side. El token NUNCA viaja al navegador del usuario.
  const fetchInsights = useCallback(async (
    dateRange?: { from: string; to: string }
  ): Promise<void> => {
    // Solo necesitamos que haya config en BD (la Edge Function lee el api_key)
    if (!config) return
    setLoadingInsights(true)
    setError(null)

    try {
      const from = dateRange?.from ?? inicioMesMX()
      const to   = dateRange?.to   ?? hoyMX()

      // Obtener la sesión activa para pasar el JWT a la Edge Function
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Sesión no activa')

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
      const res = await fetch(`${supabaseUrl}/functions/v1/meta-insights`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // JWT del usuario — la Edge Function verifica rol antes de ejecutar
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          sucursal_id: sucursalId,
          from,
          to,
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json?.error || `Error al conectar con Meta: ${res.status}`)
      }

      setInsights(json.data)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'No se pudo conectar con la API de Meta'
      setError(message)
    } finally {
      setLoadingInsights(false)
    }
  }, [config, sucursalId])

  return {
    config,
    campanas,
    insights,
    loading,
    saving,
    loadingInsights,
    error,
    saveConfig,
    addCampana,
    updateCampana,
    deleteCampana,
    fetchInsights,
    refresh
  }
}
