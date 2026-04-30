import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthContext } from '../context/AuthContext'
import { useSucursalContext } from '../context/SucursalContext'
import { useToast } from '../components/Common/Toast'
import { format, differenceInCalendarDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { PalmtreeIcon, Clock, CheckCircle, XCircle, Plus, CalendarRange, ChevronDown, AlertTriangle, User } from 'lucide-react'
import type { SolicitudVacaciones, Empleada } from '../types/database'

const ESTADO_BADGE: Record<string, { label: string; color: string }> = {
  pendiente:  { label: 'Pendiente',  color: '#F59E0B' },
  aprobada:   { label: 'Aprobada',   color: '#10B981' },
  rechazada:  { label: 'Rechazada',  color: '#EF4444' },
}

// ─── Helpers ──────────────────────────────────────────────────────
function diasHabiles(inicio: string, fin: string) {
  return Math.max(0, differenceInCalendarDays(new Date(fin), new Date(inicio)) + 1)
}

// ─── Formulario de solicitud ─────────────────────────────────────
function FormularioSolicitud({
  sucursalId,
  tipo,
  padreId,
  padreHasta,
  onDone,
}: {
  sucursalId: string
  tipo: 'nueva' | 'extension'
  padreId?: string
  padreHasta?: string
  onDone: () => void
}) {
  const toast = useToast()
  const qc = useQueryClient()
  const today = format(new Date(), 'yyyy-MM-dd')
  const minStart = padreHasta
    ? format(new Date(new Date(padreHasta).getTime() + 86_400_000), 'yyyy-MM-dd')
    : today

  const [empleadaId, setEmpleadaId] = useState('')
  const [fechaInicio, setFechaInicio] = useState(minStart)
  const [fechaFin, setFechaFin] = useState(minStart)
  const [notas, setNotas] = useState('')
  const [loading, setLoading] = useState(false)

  const { data: empleadas = [] } = useQuery<Empleada[]>({
    queryKey: ['empleadas_sucursal', sucursalId],
    queryFn: async () => {
      const { data } = await supabase
        .from('perfiles_empleadas')
        .select('id, nombre, sucursal_id, activo')
        .eq('sucursal_id', sucursalId)
        .eq('activo', true)
        .order('nombre')
      return data ?? []
    },
    enabled: !!sucursalId,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!empleadaId) return toast('Selecciona una empleada', 'error')
    if (fechaFin < fechaInicio) return toast('La fecha fin no puede ser anterior al inicio', 'error')
    setLoading(true)
    try {
      const { error } = await supabase.from('solicitudes_vacaciones').insert({
        empleada_id: empleadaId,
        sucursal_id: sucursalId,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        tipo,
        solicitud_padre_id: padreId ?? null,
        notas_empleada: notas || null,
      })
      if (error) throw error
      toast('Solicitud enviada correctamente', 'success')
      qc.invalidateQueries({ queryKey: ['solicitudes_vacaciones'] })
      onDone()
    } catch (err: any) {
      toast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="filter-field">
        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6, display: 'block' }}>Empleada</label>
        <div style={{ position: 'relative' }}>
          <select 
            value={empleadaId} 
            onChange={e => setEmpleadaId(e.target.value)} 
            required
            className="premium-input"
            style={{ 
              width: '100%', 
              padding: '10px 14px 10px 36px', 
              borderRadius: 10, 
              border: '1px solid var(--border)', 
              background: 'var(--surface-2)', 
              color: 'var(--text-1)', 
              fontSize: 14, 
              appearance: 'none',
              cursor: 'pointer',
              outline: 'none',
              transition: 'all 0.2s'
            }}
          >
            <option value="">— Selecciona —</option>
            {empleadas.map(e => (
              <option key={e.id} value={e.id}>{e.nombre}</option>
            ))}
          </select>
          <User size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
          <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="filter-field">
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6, display: 'block' }}>Fecha inicio</label>
          <input 
            type="date" 
            value={fechaInicio} 
            min={minStart} 
            onChange={e => setFechaInicio(e.target.value)} 
            required 
            className="premium-input"
            style={{ 
              width: '100%', 
              padding: '10px 14px', 
              borderRadius: 10, 
              border: '1px solid var(--border)', 
              background: 'var(--surface-2)', 
              color: 'var(--text-1)', 
              fontSize: 14, 
              outline: 'none',
              transition: 'all 0.2s'
            }}
          />
        </div>
        <div className="filter-field">
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6, display: 'block' }}>Fecha fin</label>
          <input 
            type="date" 
            value={fechaFin} 
            min={fechaInicio} 
            onChange={e => setFechaFin(e.target.value)} 
            required 
            className="premium-input"
            style={{ 
              width: '100%', 
              padding: '10px 14px', 
              borderRadius: 10, 
              border: '1px solid var(--border)', 
              background: 'var(--surface-2)', 
              color: 'var(--text-1)', 
              fontSize: 14, 
              outline: 'none',
              transition: 'all 0.2s'
            }}
          />
        </div>
      </div>

      {fechaInicio && fechaFin && fechaFin >= fechaInicio && (
        <div style={{ fontSize: 13, color: 'var(--text-3)', display: 'flex', gap: 6, alignItems: 'center' }}>
          <CalendarRange size={14} />
          <span>{diasHabiles(fechaInicio, fechaFin)} día(s) de vacaciones</span>
        </div>
      )}

      <div className="filter-field">
        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6, display: 'block' }}>Notas (opcional)</label>
        <textarea
          value={notas}
          onChange={e => setNotas(e.target.value)}
          placeholder="Motivo o comentario..."
          rows={3}
          className="premium-input"
          style={{ 
            resize: 'vertical', 
            width: '100%', 
            background: 'var(--surface-2)', 
            border: '1px solid var(--border)', 
            borderRadius: 10, 
            padding: '12px 14px', 
            color: 'var(--text-1)', 
            fontSize: 14,
            outline: 'none',
            transition: 'all 0.2s'
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button type="button" className="btn-secondary" onClick={onDone} style={{ padding: '8px 16px', fontSize: 13 }}>Cancelar</button>
        <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '8px 16px', fontSize: 13 }}>
          {loading ? 'Enviando...' : 'Enviar Solicitud'}
        </button>
      </div>
    </form>
  )
}

// ─── Modal Admin: Aprobar / Rechazar ─────────────────────────────
function ModalAccion({
  solicitud,
  accion,
  onDone,
}: {
  solicitud: SolicitudVacaciones
  accion: 'aprobada' | 'rechazada'
  onDone: () => void
}) {
  const toast = useToast()
  const qc = useQueryClient()
  const { user } = useAuthContext()
  const [notas, setNotas] = useState('')
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    setLoading(true)
    try {
      if (accion === 'aprobada') {
        const { error } = await supabase.rpc('aprobar_vacaciones', {
          p_solicitud_id: solicitud.id,
          p_admin_id: user!.id,
          p_notas: notas || null,
        })
        if (error) throw error
        toast('Vacaciones aprobadas y agenda bloqueada', 'success')
      } else {
        const { error } = await supabase.rpc('rechazar_vacaciones', {
          p_solicitud_id: solicitud.id,
          p_admin_id: user!.id,
          p_notas: notas || null,
        })
        if (error) throw error
        toast('Solicitud rechazada', 'success')
      }
      qc.invalidateQueries({ queryKey: ['solicitudes_vacaciones'] })
      onDone()
    } catch (err: any) {
      toast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onDone}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <h3 style={{ marginBottom: 8, color: accion === 'aprobada' ? '#10B981' : '#EF4444' }}>
          {accion === 'aprobada' ? '✓ Aprobar vacaciones' : '✕ Rechazar solicitud'}
        </h3>
        <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 16 }}>
          <strong>{solicitud.empleada?.nombre}</strong> · {format(new Date(solicitud.fecha_inicio + 'T12:00'), 'dd MMM', { locale: es })} – {format(new Date(solicitud.fecha_fin + 'T12:00'), 'dd MMM yyyy', { locale: es })} ({diasHabiles(solicitud.fecha_inicio, solicitud.fecha_fin)} días)
        </p>
        {accion === 'aprobada' && (
          <div style={{ background: '#10B98115', border: '1px solid #10B981', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: 'var(--text-2)', marginBottom: 16 }}>
            Se bloquearán automáticamente esos días en la agenda de {solicitud.empleada?.nombre}.
          </div>
        )}
        <div className="filter-field" style={{ marginBottom: 16 }}>
          <label>Nota para la empleada (opcional)</label>
          <textarea
            value={notas}
            onChange={e => setNotas(e.target.value)}
            rows={3}
            style={{ resize: 'vertical', width: '100%', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', color: 'var(--text-1)', fontSize: 13 }}
          />
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn-secondary" onClick={onDone} style={{ padding: '8px 16px', fontSize: 13 }}>Cancelar</button>
          <button
            className="btn-primary"
            disabled={loading}
            onClick={handleConfirm}
            style={{ padding: '8px 16px', fontSize: 13, background: accion === 'aprobada' ? '#10B981' : '#EF4444' }}
          >
            {loading ? 'Procesando...' : accion === 'aprobada' ? 'Sí, aprobar' : 'Sí, rechazar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Tarjeta de solicitud ──────────────────────────────────────
function TarjetaSolicitud({
  sol,
  isAdmin,
  onAccion,
  onExtension,
}: {
  sol: SolicitudVacaciones
  isAdmin: boolean
  onAccion: (s: SolicitudVacaciones, a: 'aprobada' | 'rechazada') => void
  onExtension: (s: SolicitudVacaciones) => void
}) {
  const badge = ESTADO_BADGE[sol.estado]
  const dias = diasHabiles(sol.fecha_inicio, sol.fecha_fin)

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px',
      display: 'flex', flexDirection: 'column', gap: 10
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-1)' }}>{sol.empleada?.nombre ?? '—'}</div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
            {sol.tipo === 'extension' ? 'Extensión · ' : ''}
            {format(new Date(sol.fecha_inicio + 'T12:00'), 'dd MMM', { locale: es })} – {format(new Date(sol.fecha_fin + 'T12:00'), 'dd MMM yyyy', { locale: es })} · {dias} día(s)
          </div>
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color: badge.color, background: badge.color + '18', padding: '3px 10px', borderRadius: 20 }}>
          {badge.label}
        </span>
      </div>

      {sol.notas_empleada && (
        <div style={{ fontSize: 12, color: 'var(--text-3)', fontStyle: 'italic' }}>Nota: "{sol.notas_empleada}"</div>
      )}
      {sol.notas_admin && sol.estado !== 'pendiente' && (
        <div style={{ fontSize: 12, color: 'var(--text-2)' }}>Admin: "{sol.notas_admin}"</div>
      )}

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        {isAdmin && sol.estado === 'pendiente' && (
          <>
            <button onClick={() => onAccion(sol, 'rechazada')} style={{ fontSize: 12, padding: '5px 12px', border: '1px solid #EF4444', color: '#EF4444', background: 'transparent', borderRadius: 8, cursor: 'pointer' }}>
              Rechazar
            </button>
            <button onClick={() => onAccion(sol, 'aprobada')} style={{ fontSize: 12, padding: '5px 12px', background: '#10B981', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
              Aprobar
            </button>
          </>
        )}
        {sol.estado === 'aprobada' && !isAdmin && (
          <button onClick={() => onExtension(sol)} style={{ fontSize: 12, padding: '5px 12px', border: '1px solid var(--accent)', color: 'var(--accent)', background: 'transparent', borderRadius: 8, cursor: 'pointer' }}>
            Solicitar extensión
          </button>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// PAGE PRINCIPAL
// ═══════════════════════════════════════════════════════════════
export default function VacacionesPage() {
  const { profile } = useAuthContext()
  const { selectedSucursalId: sucursalId } = useSucursalContext()
  const isAdmin = profile?.rol === 'admin' || profile?.rol === 'superadmin'

  const [showForm, setShowForm] = useState(false)
  const [formTipo, setFormTipo] = useState<'nueva' | 'extension'>('nueva')
  const [padreExtension, setPadreExtension] = useState<SolicitudVacaciones | null>(null)
  const [accionModal, setAccionModal] = useState<{ sol: SolicitudVacaciones; accion: 'aprobada' | 'rechazada' } | null>(null)
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')

  const { data: solicitudes = [], isLoading } = useQuery<SolicitudVacaciones[]>({
    queryKey: ['solicitudes_vacaciones', isAdmin ? 'all' : sucursalId],
    queryFn: async () => {
      let q = supabase
        .from('solicitudes_vacaciones')
        .select('*, empleada:perfiles_empleadas(id,nombre), sucursal:sucursales(id,nombre)')
        .order('created_at', { ascending: false })
      if (!isAdmin && sucursalId) q = q.eq('sucursal_id', sucursalId)
      const { data, error } = await q
      if (error) throw error
      return data ?? []
    },
    enabled: isAdmin || !!sucursalId,
  })

  const filtered = filtroEstado === 'todos' ? solicitudes : solicitudes.filter(s => s.estado === filtroEstado)

  const pendientesCount = solicitudes.filter(s => s.estado === 'pendiente').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <style>{`
        .premium-input:focus {
          border-color: var(--accent) !important;
          box-shadow: 0 0 0 4px var(--accent-light) !important;
          background: var(--surface) !important;
        }
        .premium-input:hover {
          border-color: var(--text-3);
        }
      `}</style>
      {/* Header */}
      <div className="page-header" style={{ padding: '24px 24px 0' }}>
        <div className="page-header-content">
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            Vacaciones
          </h1>
          <p className="page-subtitle">
            {isAdmin
              ? `Gestiona las solicitudes de vacaciones de tu equipo · ${pendientesCount} pendiente(s)`
              : 'Solicita y consulta el estado de tus vacaciones'}
          </p>
        </div>
        <div className="page-header-actions">
          {isAdmin && pendientesCount > 0 && (
            <span style={{ fontSize: 12, background: '#F59E0B', color: '#fff', borderRadius: 20, padding: '3px 10px', fontWeight: 700 }}>
              {pendientesCount} pendiente(s)
            </span>
          )}
          {!isAdmin && (
            <button
              className="btn-primary"
              style={{ padding: '8px 16px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
              onClick={() => { setFormTipo('nueva'); setPadreExtension(null); setShowForm(true) }}
            >
              <Plus size={15} /> Nueva Solicitud
            </button>
          )}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        {/* Formulario inline */}
        {showForm && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 24 }}>
            <h3 style={{ marginBottom: 16, fontSize: 15, color: 'var(--text-1)' }}>
              {formTipo === 'extension'
                ? `Extensión de vacaciones de ${padreExtension?.empleada?.nombre}`
                : 'Nueva solicitud de vacaciones'}
            </h3>
            <FormularioSolicitud
              sucursalId={sucursalId ?? ''}
              tipo={formTipo}
              padreId={padreExtension?.id}
              padreHasta={padreExtension?.fecha_fin}
              onDone={() => setShowForm(false)}
            />
          </div>
        )}

        {/* Filtro */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {['todos', 'pendiente', 'aprobada', 'rechazada'].map(f => (
            <button
              key={f}
              onClick={() => setFiltroEstado(f)}
              style={{
                fontSize: 12, padding: '5px 14px', borderRadius: 20, cursor: 'pointer',
                fontWeight: filtroEstado === f ? 700 : 400,
                background: filtroEstado === f ? 'var(--accent)' : 'var(--surface)',
                color: filtroEstado === f ? '#fff' : 'var(--text-2)',
                border: `1px solid ${filtroEstado === f ? 'var(--accent)' : 'var(--border)'}`,
                transition: 'all 0.15s',
              }}
            >
              {f === 'todos' ? 'Todas' : ESTADO_BADGE[f]?.label}
            </button>
          ))}
        </div>

        {/* Lista */}
        {isLoading && <div style={{ textAlign: 'center', color: 'var(--text-3)', padding: 40 }}>Cargando...</div>}
        {!isLoading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-3)' }}>
            <p style={{ marginTop: 12 }}>No hay solicitudes {filtroEstado !== 'todos' ? `con estado "${ESTADO_BADGE[filtroEstado]?.label}"` : ''}</p>
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(sol => (
            <TarjetaSolicitud
              key={sol.id}
              sol={sol}
              isAdmin={isAdmin}
              onAccion={(s, a) => setAccionModal({ sol: s, accion: a })}
              onExtension={(s) => { setPadreExtension(s); setFormTipo('extension'); setShowForm(true) }}
            />
          ))}
        </div>
      </div>

      {/* Modal aprobar/rechazar */}
      {accionModal && (
        <ModalAccion
          solicitud={accionModal.sol}
          accion={accionModal.accion}
          onDone={() => setAccionModal(null)}
        />
      )}
    </div>
  )
}
