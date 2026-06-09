import { useState } from 'react'
import { Key, X, Info, CheckCircle, RefreshCw } from 'lucide-react'

interface ConfigFormProps {
  currentApiKey?: string
  currentAccountId?: string
  onSave: (apiKey: string, accountId: string) => Promise<boolean>
  saving: boolean
  onClose: () => void
}

export function ConfigForm({ currentApiKey, currentAccountId, onSave, saving, onClose }: ConfigFormProps) {
  const [apiKey, setApiKey]       = useState(currentApiKey ?? '')
  const [accountId, setAccountId] = useState(currentAccountId ?? '')
  const [showKey, setShowKey]     = useState(false)
  const [success, setSuccess]     = useState(false)

  async function handleSave() {
    if (!apiKey.trim() || !accountId.trim()) return
    const ok = await onSave(apiKey.trim(), accountId.trim())
    if (ok) setSuccess(true)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 200, padding: 16
    }}>
      <div style={{
        background: 'var(--surface)',
        borderRadius: 'var(--radius-lg)',
        width: '100%', maxWidth: 480,
        boxShadow: 'var(--shadow-lg)',
        overflow: 'hidden',
        animation: 'modalIn 0.18s ease'
      }}>
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Key size={15} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)' }}>Configurar Meta Ads</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Conecta tu cuenta publicitaria</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4, borderRadius: 4 }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Info box */}
          <div style={{ background: 'var(--accent-light)', border: '1px solid var(--accent-mid)', borderRadius: 'var(--radius-md)', padding: 12, display: 'flex', gap: 10 }}>
            <Info size={15} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6 }}>
              Obtén tu <strong style={{ color: 'var(--accent)' }}>Access Token</strong> desde el{' '}
              <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>
                Explorador de la API de Meta
              </a>{' '}
              y el <strong>Ad Account ID</strong> desde tu Business Manager (Ej: <code>1234567890</code>).
            </div>
          </div>

          {/* Access Token */}
          <div className="form-group">
            <label className="form-label">Access Token *</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showKey ? 'text' : 'password'}
                className="form-input"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="EAABsbCS0cBA..."
                style={{ fontFamily: showKey ? 'monospace' : 'inherit', fontSize: 12, paddingRight: 80 }}
              />
              <button
                onClick={() => setShowKey(v => !v)}
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: 'var(--text-3)', fontFamily: 'inherit' }}
              >
                {showKey ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
          </div>

          {/* Account ID */}
          <div className="form-group">
            <label className="form-label">Ad Account ID *</label>
            <input
              type="text"
              className="form-input"
              value={accountId}
              onChange={e => setAccountId(e.target.value)}
              placeholder="act_1234567890"
            />
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Puedes incluir "act_" o solo los números.</span>
          </div>

          {success && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--success-bg)', borderRadius: 'var(--radius-md)', color: 'var(--success)', fontSize: 13 }}>
              <CheckCircle size={15} />
              ¡Configuración guardada correctamente!
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={saving || !apiKey.trim() || !accountId.trim()}
            style={{ minWidth: 120 }}
          >
            {saving ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle size={14} />}
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}
