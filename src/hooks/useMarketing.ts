import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
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

  // ─── Fetch Insights from Meta API ────────────────────────────
  // Llama a la Graph API de Meta para obtener métricas de la cuenta
  const fetchInsights = useCallback(async (
    dateRange?: { from: string; to: string }
  ): Promise<void> => {
    if (!config?.api_key || !config?.account_id) return
    setLoadingInsights(true)
    setError(null)

    try {
      const today = new Date()
      const from = dateRange?.from ?? new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
      const to   = dateRange?.to   ?? today.toISOString().split('T')[0]

      // Meta Graph API endpoint for account insights
      const url = new URL(`https://graph.facebook.com/v19.0/act_${config.account_id}/insights`)
      url.searchParams.set('access_token', config.api_key)
      url.searchParams.set('fields', 'spend,impressions,clicks,reach,actions')
      url.searchParams.set('time_range', JSON.stringify({ since: from, until: to }))
      url.searchParams.set('level', 'account')

      const res = await fetch(url.toString())
      if (!res.ok) {
        const errJSON = await res.json().catch(() => ({}))
        throw new Error(errJSON?.error?.message || `Error de Meta API: ${res.status}`)
      }

      const json = await res.json()
      const data = json.data?.[0] ?? {}
      
      // Extract leads from actions array
      const leadsAction = (data.actions ?? []).find((a: any) => a.action_type === 'lead')
      const leads = leadsAction ? parseInt(leadsAction.value, 10) : 0

      const spend       = parseFloat(data.spend ?? '0')
      const impressions = parseInt(data.impressions ?? '0', 10)
      const clicks      = parseInt(data.clicks ?? '0', 10)
      const reach       = parseInt(data.reach ?? '0', 10)

      setInsights({
        spend,
        impressions,
        clicks,
        leads,
        reach,
        ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
        cpl: leads > 0 ? spend / leads : 0,
        cpc: clicks > 0 ? spend / clicks : 0,
      })
    } catch (err: any) {
      setError(err.message || 'No se pudo conectar con la API de Meta')
    } finally {
      setLoadingInsights(false)
    }
  }, [config])

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
