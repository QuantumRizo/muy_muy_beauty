import { useState, useEffect } from 'react'
import {
  Megaphone, Target, BarChart2, Plus, ExternalLink, Activity,
  Users, DollarSign, Eye, MousePointerClick,
  Settings, CheckCircle, AlertCircle, RefreshCw,
  X, Key, Zap, ChevronRight, ArrowUpRight
} from 'lucide-react'
import { useMarketing } from '../hooks/useMarketing'
import { useSucursales } from '../hooks/useSucursales'
import type { MarketingCampana } from '../types/database'
import { KpiCard } from '../components/Marketing/KpiCard'
import { ConfigForm } from '../components/Marketing/ConfigForm'
import { CampanaModal } from '../components/Marketing/CampanaModal'
import { CampanaRow, PLATFORM_COLORS, ESTADO_STYLES } from '../components/Marketing/CampanaRow'

// ─── Helpers ────────────────────────────────────────────────────
const fmt = (n: number, decimals = 2) =>
  new Intl.NumberFormat('es-MX', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(n)

const fmtMoney = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 }).format(n)

const fmtBig = (n: number) => {
  if (n >= 1_000_000) return `${fmt(n / 1_000_000, 1)}M`
  if (n >= 1_000)     return `${fmt(n / 1_000, 1)}K`
  return fmt(n, 0)
}

// ─── Main Page ───────────────────────────────────────────────────
type Tab = 'dashboard' | 'campaigns' | 'integrations'

export default function MarketingPage() {
  const { data: sucursales = [] } = useSucursales()
  const [sucursalId, setSucursalId] = useState('')
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const [showConfigForm, setShowConfigForm] = useState(false)
  const [showCampanaModal, setShowCampanaModal] = useState(false)
  const [editingCampana, setEditingCampana] = useState<MarketingCampana | null>(null)

  useEffect(() => {
    if (sucursales.length > 0 && !sucursalId) setSucursalId(sucursales[0].id)
  }, [sucursales, sucursalId])

  const { config, campanas, insights, loading, saving, loadingInsights, error,
    saveConfig, addCampana, updateCampana, deleteCampana, fetchInsights, refresh
  } = useMarketing(sucursalId, 'meta')

  const isConnected = !!config?.api_key

  // Summary from manual campaigns (when no API)
  const summaryFromCampanas = {
    gasto:       campanas.reduce((s, c) => s + c.gasto, 0),
    leads:       campanas.reduce((s, c) => s + c.leads, 0),
    impresiones: campanas.reduce((s, c) => s + c.impresiones, 0),
    clics:       campanas.reduce((s, c) => s + c.clics, 0),
  }

  const displayInsights = insights ?? {
    spend:       summaryFromCampanas.gasto,
    impressions: summaryFromCampanas.impresiones,
    clicks:      summaryFromCampanas.clics,
    leads:       summaryFromCampanas.leads,
    reach:       0,
    ctr:         summaryFromCampanas.impresiones > 0 ? (summaryFromCampanas.clics / summaryFromCampanas.impresiones) * 100 : 0,
    cpl:         summaryFromCampanas.leads > 0 ? summaryFromCampanas.gasto / summaryFromCampanas.leads : 0,
    cpc:         summaryFromCampanas.clics > 0 ? summaryFromCampanas.gasto / summaryFromCampanas.clics : 0,
  }

  const activeCampanas   = campanas.filter(c => c.estado === 'activa').length
  const presupuestoTotal = campanas.reduce((s, c) => s + c.presupuesto, 0)

  const tabs: { id: Tab; label: string }[] = [
    { id: 'dashboard',    label: 'Dashboard' },
    { id: 'campaigns',    label: `Campañas ${campanas.length > 0 ? `(${campanas.length})` : ''}` },
    { id: 'integrations', label: 'Integración API' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: 'var(--bg)' }}>
      {/* Header ─────────────────────────────────────────────── */}
      <div style={{ padding: '20px 24px 0', flexShrink: 0, background: 'var(--bg)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h1 className="page-title">Marketing</h1>
            <p className="page-subtitle">Campañas y rendimiento publicitario</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {sucursales.length > 1 && (
              <select className="form-input" value={sucursalId} onChange={e => setSucursalId(e.target.value)} style={{ width: 160 }}>
                {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
            )}
            {isConnected && (
              <button
                className="btn-secondary"
                onClick={() => fetchInsights()}
                disabled={loadingInsights}
                style={{ height: 34, gap: 6 }}
              >
                <RefreshCw size={13} className={loadingInsights ? 'animate-spin' : ''} />
                Sincronizar
              </button>
            )}
            {activeTab === 'campaigns' && (
              <button className="btn-primary" style={{ height: 34 }} onClick={() => { setEditingCampana(null); setShowCampanaModal(true) }}>
                <Plus size={14} /> Nueva Campaña
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              padding: '8px 18px',
              border: 'none', background: 'transparent',
              color: activeTab === t.id ? 'var(--accent)' : 'var(--text-2)',
              fontWeight: activeTab === t.id ? 600 : 500,
              fontSize: 13,
              cursor: 'pointer',
              borderBottom: activeTab === t.id ? '2px solid var(--accent)' : '2px solid transparent',
              marginBottom: -1,
              transition: 'all 0.15s',
              fontFamily: 'inherit'
            }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content ──────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px 24px' }}>

        {/* Error banner */}
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--danger-bg)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 'var(--radius-md)', marginBottom: 16, color: 'var(--danger)', fontSize: 13 }}>
            <AlertCircle size={15} />
            <span style={{ flex: 1 }}>{error}</span>
            <button onClick={() => refresh()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}><X size={14} /></button>
          </div>
        )}

        {/* ─── DASHBOARD TAB ──────────────────────────────────── */}
        {activeTab === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Connection banner if not connected */}
            {!isConnected && (
              <div style={{
                background: 'linear-gradient(135deg, var(--accent) 0%, #7a8a43 100%)',
                borderRadius: 'var(--radius-lg)',
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'center',
                gap: 20,
                color: '#fff'
              }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Zap size={24} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Sin integración de API</div>
                  <div style={{ fontSize: 13, opacity: 0.85, lineHeight: 1.5 }}>
                    Conecta tu cuenta de Meta Ads para obtener métricas en tiempo real. Mientras tanto, puedes registrar tus campañas manualmente.
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('integrations')}
                  style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 'var(--radius-sm)', color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, fontFamily: 'inherit' }}
                >
                  Configurar <ChevronRight size={14} />
                </button>
              </div>
            )}

            {/* Connected badge */}
            {isConnected && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: 'var(--success-bg)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(22,163,74,0.2)', alignSelf: 'flex-start' }}>
                <CheckCircle size={14} style={{ color: 'var(--success)' }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--success)' }}>
                  Meta Ads conectado · act_{config?.account_id}
                </span>
                <button onClick={() => fetchInsights()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, fontFamily: 'inherit' }}>
                  <ArrowUpRight size={11} /> Ver datos en vivo
                </button>
              </div>
            )}

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
              <KpiCard icon={<DollarSign size={16} />} label="Inversión Total"       value={fmtMoney(displayInsights.spend)}                                                     gradient="linear-gradient(135deg, var(--accent) 0%, #7a8a43 100%)" loading={loadingInsights} />
              <KpiCard icon={<Users size={16} />}       label="Leads Generados"       value={fmtBig(displayInsights.leads)}                                                       gradient="linear-gradient(135deg, var(--kpi) 0%, #0f7a35 100%)"    loading={loadingInsights} />
              <KpiCard icon={<Activity size={16} />}    label="Costo por Lead (CPL)"  value={displayInsights.cpl > 0 ? fmtMoney(displayInsights.cpl) : '—'}                      loading={loadingInsights} />
              <KpiCard icon={<Eye size={16} />}         label="Impresiones"           value={fmtBig(displayInsights.impressions)}                                                  loading={loadingInsights} />
              <KpiCard icon={<MousePointerClick size={16} />} label="Clics"           value={fmtBig(displayInsights.clicks)} sub={displayInsights.ctr > 0 ? `CTR ${fmt(displayInsights.ctr, 2)}%` : undefined} loading={loadingInsights} />
              <KpiCard icon={<Target size={16} />}      label="Campañas Activas"      value={String(activeCampanas)} sub={presupuestoTotal > 0 ? `Presupuesto: ${fmtMoney(presupuestoTotal)}` : undefined} loading={loading} />
            </div>

            {/* Resumen de campañas */}
            {campanas.length > 0 && (
              <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>Campañas Recientes</span>
                  <button onClick={() => setActiveTab('campaigns')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontSize: 12, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>
                    Ver todas <ChevronRight size={12} />
                  </button>
                </div>
                <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {campanas.slice(0, 3).map(c => {
                    const pStyle = PLATFORM_COLORS[c.platform] ?? PLATFORM_COLORS['otro']
                    const eStyle = ESTADO_STYLES[c.estado]     ?? ESTADO_STYLES['finalizada']
                    return (
                      <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 6px', borderRadius: 'var(--radius-sm)' }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: pStyle.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Target size={13} color={pStyle.color} />
                        </div>
                        <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.nombre}</span>
                        <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: eStyle.bg, color: eStyle.color, fontWeight: 700 }}>{c.estado}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', width: 80, textAlign: 'right' }}>{fmtMoney(c.gasto)}</span>
                        <span style={{ fontSize: 12, color: 'var(--success)', width: 60, textAlign: 'right' }}>{c.leads > 0 ? `${c.leads} leads` : '—'}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {campanas.length === 0 && !loading && (
              <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border-2)', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)' }}>
                  <Megaphone size={24} />
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)' }}>Sin datos de campañas</div>
                <p style={{ fontSize: 13, color: 'var(--text-2)', maxWidth: 380, lineHeight: 1.5 }}>
                  Registra tus campañas manualmente en la pestaña <strong>Campañas</strong> o conecta la API en <strong>Integración</strong>.
                </p>
                <button className="btn-primary" style={{ height: 36 }} onClick={() => setActiveTab('campaigns')}>
                  <Plus size={14} /> Agregar primera campaña
                </button>
              </div>
            )}
          </div>
        )}

        {/* ─── CAMPAIGNS TAB ────────────────────────────────────── */}
        {activeTab === 'campaigns' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {loading && (
              [...Array(3)].map((_, i) => (
                <div key={i} style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', padding: '14px 18px', height: 70, animation: 'pulse 1.5s infinite' }} />
              ))
            )}

            {!loading && campanas.length === 0 && (
              <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border-2)', padding: '60px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)' }}>
                  <Megaphone size={28} />
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-1)' }}>No hay campañas registradas</div>
                <p style={{ fontSize: 13, color: 'var(--text-2)', maxWidth: 400, lineHeight: 1.5 }}>
                  Crea tu primera campaña para llevar un control del gasto, prospectos y costo por lead.
                </p>
                <button className="btn-primary" style={{ height: 36 }} onClick={() => { setEditingCampana(null); setShowCampanaModal(true) }}>
                  <Plus size={14} /> Nueva campaña
                </button>
              </div>
            )}

            {!loading && campanas.map(c => (
              <CampanaRow
                key={c.id}
                c={c}
                onEdit={() => { setEditingCampana(c); setShowCampanaModal(true) }}
                onDelete={() => deleteCampana(c.id)}
                onToggle={() => updateCampana(c.id, { estado: c.estado === 'activa' ? 'pausada' : 'activa' })}
              />
            ))}
          </div>
        )}

        {/* ─── INTEGRATIONS TAB ─────────────────────────────────── */}
        {activeTab === 'integrations' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 680 }}>
            {/* Meta Ads Card */}
            <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: isConnected ? '1px solid rgba(22,163,74,0.4)' : '1px solid var(--border)', padding: 24, boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: '#1877F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Target size={26} color="#fff" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text-1)' }}>Meta Ads</h3>
                    {isConnected && (
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: 'var(--success-bg)', color: 'var(--success)' }}>
                        CONECTADO
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '2px 0 0 0' }}>Facebook & Instagram Ads</p>
                </div>
              </div>

              {isConnected ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-md)', padding: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ color: 'var(--text-3)' }}>Account ID:</span>
                      <span style={{ fontWeight: 600, color: 'var(--text-1)', fontFamily: 'monospace' }}>act_{config?.account_id}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ color: 'var(--text-3)' }}>Token:</span>
                      <span style={{ fontWeight: 600, color: 'var(--text-1)', fontFamily: 'monospace' }}>
                        {config?.api_key?.slice(0, 12)}••••••••
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn-secondary" style={{ flex: 1, justifyContent: 'center', height: 36 }} onClick={() => setShowConfigForm(true)}>
                      <Settings size={13} /> Editar configuración
                    </button>
                    <button className="btn-primary" style={{ flex: 1, justifyContent: 'center', height: 36 }} onClick={() => fetchInsights()}>
                      <RefreshCw size={13} className={loadingInsights ? 'animate-spin' : ''} />
                      {loadingInsights ? 'Sincronizando...' : 'Sincronizar datos'}
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, margin: 0 }}>
                    Conecta tu cuenta publicitaria para visualizar métricas como gasto, impresiones, clics y leads directamente en el Dashboard.
                  </p>
                  <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-md)', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Cómo obtener el access token</div>
                    {[
                      'Ve a developers.facebook.com/tools/explorer/',
                      'Selecciona tu App y genera un token con permisos de "ads_read"',
                      'Copia el token y pégalo en el campo de configuración',
                      'Obtén tu Ad Account ID desde tu Business Manager'
                    ].map((step, i) => (
                      <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 12, color: 'var(--text-2)' }}>
                        <span style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
                        {step}
                      </div>
                    ))}
                  </div>
                  <button className="btn-primary" style={{ height: 38, justifyContent: 'center' }} onClick={() => setShowConfigForm(true)}>
                    <Key size={14} /> Ingresar credenciales
                  </button>
                </div>
              )}
            </div>

            {/* Google Ads Card — Coming Soon */}
            <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: 24, opacity: 0.6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: '#EA4335', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BarChart2 size={26} color="#fff" />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text-1)' }}>Google Ads</h3>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: 'var(--surface-2)', color: 'var(--text-3)' }}>PRÓXIMAMENTE</span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '2px 0 0 0' }}>Búsqueda & Display</p>
                </div>
              </div>
            </div>

            {/* Link to Meta */}
            <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--accent)', textDecoration: 'none', alignSelf: 'flex-start' }}>
              <ExternalLink size={12} /> Abrir el Explorador de API de Meta
            </a>
          </div>
        )}
      </div>

      {/* Modals */}
      {showConfigForm && (
        <ConfigForm
          currentApiKey={config?.api_key}
          currentAccountId={config?.account_id ?? ''}
          onSave={(apiKey, accountId) => saveConfig('meta', apiKey, accountId)}
          saving={saving}
          onClose={() => setShowConfigForm(false)}
        />
      )}

      {showCampanaModal && (
        <CampanaModal
          initial={editingCampana ?? undefined}
          onSave={editingCampana
            ? (data) => updateCampana(editingCampana.id, data)
            : addCampana
          }
          saving={saving}
          onClose={() => { setShowCampanaModal(false); setEditingCampana(null) }}
        />
      )}
    </div>
  )
}
