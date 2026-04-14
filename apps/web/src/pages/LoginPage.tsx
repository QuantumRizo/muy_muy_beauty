import { useState } from 'react'
import { Mail, Lock, ArrowRight, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function LoginPage() {
  const [view, setView] = useState<'login' | 'recovery'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Credenciales inválidas o error de conexión.')
      setLoading(false)
    }
  }

  const handleRecovery = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/recovery',
    })

    if (error) {
      setError('No se pudo enviar el correo de recuperación.')
    } else {
      setSuccess('Se ha enviado un enlace a tu correo electrónico.')
    }
    setLoading(false)
  }

  return (
    <div className="auth-page">
      <div className="auth-blob auth-blob-1"></div>
      <div className="auth-blob auth-blob-2"></div>

      <div className="auth-card">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
          <img src="/logoVertical.png" alt="Logo" style={{ maxWidth: '180px', height: 'auto' }} />
        </div>
        <div className="auth-header">
          <h1 className="auth-title">
            {view === 'login' ? 'Bienvenido de nuevo' : 'Recuperar acceso'}
          </h1>
          <p className="auth-subtitle">
            {view === 'login'
              ? 'Ingresa tus credenciales para administrar el sistema.'
              : 'Te enviaremos un enlace para restablecer tu contraseña.'}
          </p>
        </div>

        {error && (
          <div className="auth-error">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {success && (
          <div style={{
            background: 'var(--success-bg)',
            border: '1px solid var(--success)',
            color: 'var(--success)',
            padding: '12px',
            borderRadius: '10px',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckCircle2 size={18} />
            {success}
          </div>
        )}

        {view === 'login' ? (
          <form className="auth-form" onSubmit={handleLogin}>
            <div className="auth-input-group">
              <label>Correo electrónico</label>
              <div className="auth-input-wrapper">
                <Mail size={16} />
                <input
                  type="email"
                  className="auth-input"
                  placeholder="admin@ejemplo.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="auth-input-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label>Contraseña</label>
                <span className="auth-link" style={{ fontSize: '11px' }} onClick={() => { setView('recovery'); setError(null); setSuccess(null); }}>
                  ¿Olvidaste tu contraseña?
                </span>
              </div>
              <div className="auth-input-wrapper">
                <Lock size={16} />
                <input
                  type="password"
                  className="auth-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button className="auth-btn" type="submit" disabled={loading}>
              {loading ? <RefreshCw size={18} className="animate-spin" /> : <>Entrar <ArrowRight size={18} /></>}
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleRecovery}>
            <div className="auth-input-group">
              <label>Correo electrónico</label>
              <div className="auth-input-wrapper">
                <Mail size={16} />
                <input
                  type="email"
                  className="auth-input"
                  placeholder="admin@ejemplo.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <button className="auth-btn" type="submit" disabled={loading}>
              {loading ? <RefreshCw size={18} className="animate-spin" /> : 'Enviar enlace'}
            </button>

            <div className="auth-footer" style={{ marginTop: '10px' }}>
              <span className="auth-link" onClick={() => { setView('login'); setError(null); setSuccess(null); }}>
                Volver al inicio de sesión
              </span>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
