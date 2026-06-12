/**
 * Edge Function: meta-insights
 * ─────────────────────────────────────────────────────────────────────────────
 * Proxy seguro para la Graph API de Meta (Facebook Ads).
 *
 * POR QUÉ EXISTE ESTO:
 *   Llamar a la Meta Graph API directamente desde el browser expone el
 *   access_token en el tráfico de red (visible en DevTools). Esta función
 *   actúa como intermediario: el cliente envía sucursal_id, la función
 *   recupera el token desde la BD (nunca lo devuelve al cliente), hace la
 *   llamada a Meta y retorna solo los insights.
 *
 * SEGURIDAD:
 *   - Requiere sesión activa de Supabase (JWT en Authorization header).
 *   - Verifica que el usuario tenga rol admin/superadmin.
 *   - El api_key de Meta NUNCA sale de esta función hacia el cliente.
 *
 * ENDPOINT:
 *   POST /functions/v1/meta-insights
 *   Body: { sucursal_id: string, from?: string, to?: string }
 *   Response: { spend, impressions, clicks, reach, leads, ctr, cpl, cpc }
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { createClient } from 'jsr:@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  // ── Preflight CORS ──────────────────────────────────────────────
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    // ── 1. Autenticación: verificar JWT del usuario ───────────────
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return jsonError('Unauthorized: missing Authorization header', 401)
    }

    const supabaseUrl  = Deno.env.get('SUPABASE_URL')!
    const serviceKey   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anonKey      = Deno.env.get('SUPABASE_ANON_KEY')!

    // Cliente con el JWT del usuario para verificar identidad
    const supabaseUser = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser()
    if (authError || !user) {
      return jsonError('Unauthorized: invalid session', 401)
    }

    // ── 2. Autorización: solo admin/superadmin ────────────────────
    const supabaseAdmin = createClient(supabaseUrl, serviceKey)

    const { data: profile } = await supabaseAdmin
      .from('perfiles_usuario')
      .select('rol')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'superadmin'].includes(profile.rol)) {
      return jsonError('Forbidden: insufficient permissions', 403)
    }

    // ── 3. Parsear body ───────────────────────────────────────────
    const body = await req.json().catch(() => ({}))
    const { sucursal_id, from: dateFrom, to: dateTo } = body

    if (!sucursal_id) {
      return jsonError('Bad Request: sucursal_id is required', 400)
    }

    // ── 4. Recuperar api_key de la BD (nunca se retorna al cliente) ─
    const { data: config, error: configErr } = await supabaseAdmin
      .from('marketing_configs')
      .select('api_key, account_id')
      .eq('sucursal_id', sucursal_id)
      .eq('platform', 'meta')
      .eq('active', true)
      .maybeSingle()

    if (configErr) {
      return jsonError('Error fetching marketing config', 500)
    }

    if (!config?.api_key || !config?.account_id) {
      return jsonError('No Meta integration configured for this branch', 404)
    }

    // ── 5. Calcular rango de fechas por defecto (mes actual) ──────
    const now = new Date()
    const defaultFrom = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
    const defaultTo   = now.toISOString().slice(0, 10)

    const since = dateFrom ?? defaultFrom
    const until = dateTo   ?? defaultTo

    // ── 6. Llamar a Meta Graph API (server-side, token protegido) ─
    const metaUrl = new URL(`https://graph.facebook.com/v19.0/act_${config.account_id}/insights`)
    metaUrl.searchParams.set('access_token', config.api_key)   // ← Solo visible server-side
    metaUrl.searchParams.set('fields', 'spend,impressions,clicks,reach,actions')
    metaUrl.searchParams.set('time_range', JSON.stringify({ since, until }))
    metaUrl.searchParams.set('level', 'account')

    const metaRes = await fetch(metaUrl.toString())
    if (!metaRes.ok) {
      const errBody = await metaRes.json().catch(() => ({}))
      const message = errBody?.error?.message ?? `Meta API error: ${metaRes.status}`
      return jsonError(message, 502)
    }

    const metaJson = await metaRes.json()
    const data = metaJson.data?.[0] ?? {}

    // Extraer leads de actions array
    const leadsAction = (data.actions ?? []).find((a: { action_type: string }) => a.action_type === 'lead')
    const leads = leadsAction ? parseInt(leadsAction.value, 10) : 0

    const spend       = parseFloat(data.spend       ?? '0')
    const impressions = parseInt(data.impressions   ?? '0', 10)
    const clicks      = parseInt(data.clicks        ?? '0', 10)
    const reach       = parseInt(data.reach         ?? '0', 10)

    // ── 7. Retornar métricas (SIN el api_key) ────────────────────
    const insights = {
      spend,
      impressions,
      clicks,
      reach,
      leads,
      ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
      cpl: leads      > 0 ? spend / leads            : 0,
      cpc: clicks     > 0 ? spend / clicks           : 0,
    }

    return new Response(JSON.stringify({ data: insights }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return jsonError(message, 500)
  }
})

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    status,
  })
}
