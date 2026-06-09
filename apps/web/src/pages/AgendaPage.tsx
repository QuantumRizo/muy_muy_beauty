import { useState } from 'react'
import { startOfWeek, addDays, addWeeks, subWeeks, format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Calendar, CalendarPlus, X, AlertTriangle, LogIn, Users } from 'lucide-react'
import AgendaGrid from '../components/Agenda/AgendaGrid'
import BuscadorModal from '../components/Clientes/BuscadorModal'
import FormularioCliente from '../components/Clientes/FormularioCliente'
import NuevaCitaModal from '../components/Citas/NuevaCitaModal'
import GestionCitaModal from '../components/Citas/GestionCitaModal'
import BloqueoModal from '../components/Agenda/BloqueoModal'
import BloqueoInfoModal from '../components/Agenda/BloqueoInfoModal'
import DesbloqueoModal from '../components/Agenda/DesbloqueoModal'
import CheckoutFlow from '../components/Citas/CheckoutFlow'
import { useSucursalContext } from '../context/SucursalContext'
import { useEmpleadas } from '../hooks/useEmpleadas'
import { useSucursales } from '../hooks/useSucursales'
import { useCitasSemana, useBloqueosSemana, useEliminarBloqueo } from '../hooks/useCitas'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Cliente, Cita, SlotInfo, BloqueoAgenda } from '../types/database'
import { useToast } from '../components/Common/Toast'
import { useAuthContext } from '../context/AuthContext'

type Modal =
  | { type: 'none' }
  | { type: 'buscar';       slot: SlotInfo }
  | { type: 'nuevo-cliente'; slot: SlotInfo }
  | { type: 'nueva-cita';   slot: SlotInfo; cliente: Cliente }
  | { type: 'gestion';      cita: Cita }
  | { type: 'bloquear' }
  | { type: 'desbloquear' }
  | { type: 'bloqueo-info'; bloqueo: BloqueoAgenda }
  | { type: 'checkout';     cita: Cita }
  | { type: 'registrar-entrada'; empleadaId: string; nombre: string }

function getWeekDates(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
}

interface Props {
  preselectedCliente?: Cliente | null
  onClearPreselected?: () => void
}

export default function AgendaPage({ preselectedCliente, onClearPreselected }: Props) {

  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  )
  const { selectedSucursalId: sucursalId } = useSucursalContext()
  const { profile } = useAuthContext()
  const [modal, setModal] = useState<Modal>({ type: 'none' })
  const toast = useToast()
  const eliminarBloqueo = useEliminarBloqueo()
  const queryClient = useQueryClient()

  const weekDates   = getWeekDates(weekStart)
  const inicioStr   = format(weekDates[0], 'yyyy-MM-dd')
  const finStr      = format(weekDates[6], 'yyyy-MM-dd')
  const weekLabel   = `${format(weekDates[0], 'd MMM', { locale: es })} – ${format(weekDates[6], 'd MMM yyyy', { locale: es })}`

  const activeSucursal            = sucursalId
  const { data: sucursales = [] }  = useSucursales()
  const activeSucursalObj          = sucursales.find(s => s.id === activeSucursal) ?? null
  const { data: empleadas = [], isLoading: isLoadingEmpleadas }  = useEmpleadas(activeSucursal || undefined)
  const { data: citas = [] }      = useCitasSemana(inicioStr, finStr, activeSucursal)
  const { data: bloqueos = [] }   = useBloqueosSemana(inicioStr, finStr)

  // ─── Asistencia hoy: qué empleadas registraron Entrada ──────
  const hoy = format(new Date(), 'yyyy-MM-dd')
  const { data: asistenciaHoy = [] } = useQuery({
    queryKey: ['asistencia_hoy', hoy, activeSucursal],
    queryFn: async () => {
      let q = supabase
        .from('asistencia')
        .select('empleada_id, tipo')
        .gte('created_at', `${hoy}T00:00:00`)
        .lte('created_at', `${hoy}T23:59:59`)
      if (activeSucursal) q = q.eq('sucursal_id', activeSucursal)
      const { data } = await q
      return data ?? []
    },
    // Refresca cada 2 minutos para captar nuevas entradas
    refetchInterval: 2 * 60 * 1000,
  })

  // Set de empleadas que registraron al menos una Entrada hoy
  // Con margen de tolerancia de 10 min: solo se muestra el bloqueo si ya pasaron
  // 10 minutos desde la apertura de la sucursal
  const TOLERANCIA_MIN = 10
  const ahoraMin = new Date().getHours() * 60 + new Date().getMinutes()
  const aperturaMin = (() => {
    const hoy = new Date()
    const dow = hoy.getDay()
    const hpd = activeSucursalObj?.horarios_por_dia
    if (hpd && hpd[dow] && !hpd[dow].cerrado) {
      const h = parseInt((hpd[dow].apertura as string).split(':')[0])
      const m = parseInt((hpd[dow].apertura as string).split(':')[1] || '0')
      return h * 60 + m
    }
    return 10 * 60 // fallback 10:00
  })()
  const dentroDeTolerancia = ahoraMin < aperturaMin + TOLERANCIA_MIN

  const empleadasConEntrada = new Set(
    asistenciaHoy.filter((a: any) => a.tipo === 'Entrada').map((a: any) => a.empleada_id)
  )

  // Si aún estamos dentro del margen de tolerancia, no bloqueamos a nadie
  const empleadasSinEntrada: Set<string> = dentroDeTolerancia
    ? new Set()
    : new Set(
        empleadas
          .filter(e => !empleadasConEntrada.has(e.id))
          .map(e => e.id)
      )

  const prevWeek  = () => setWeekStart((w) => subWeeks(w, 1))
  const nextWeek  = () => setWeekStart((w) => addWeeks(w, 1))
  const thisWeek  = () => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))

  const handleSlotClick = async (empleadaId: string, hora: string, fecha: string) => {
    if (preselectedCliente) {
      setModal({ type: 'nueva-cita', slot: { empleadaId, hora, fecha }, cliente: preselectedCliente })
      onClearPreselected?.()
    } else {
      setModal({ type: 'buscar', slot: { empleadaId, hora, fecha } })
    }
  }

  const handleClienteSelect = (cliente: Cliente) => {
    if (modal.type !== 'buscar') return
    setModal({ type: 'nueva-cita', slot: modal.slot, cliente })
  }

  const handleNuevoCliente = () => {
    if (modal.type !== 'buscar') return
    setModal({ type: 'nuevo-cliente', slot: modal.slot })
  }

  const handleClienteCreado = (cliente: Cliente) => {
    if (modal.type !== 'nuevo-cliente') return
    setModal({ type: 'nueva-cita', slot: modal.slot, cliente })
  }

  const closeModal = () => setModal({ type: 'none' })

  const handleDeleteBloqueo = async (id: string) => {
    try {
      await eliminarBloqueo.mutateAsync(id)
    } catch (err) {
      toast('Error al eliminar bloqueo', 'error')
    }
  }

  return (
    <div className="agenda-page-wrap">
      <style>{`
        @keyframes pulse-opacity {
          0% { opacity: 0.6; transform: scale(0.95); }
          50% { opacity: 1; transform: scale(1.05); }
          100% { opacity: 0.6; transform: scale(0.95); }
        }
        .pulse-icon {
          animation: pulse-opacity 2s infinite ease-in-out;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>

      {/* Preselected Client Notice */}
      {preselectedCliente && (
        <div style={{ background: 'var(--accent)', color: '#fff', padding: '8px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, fontWeight: 500 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CalendarPlus size={16} />
            <span>Agendando cita para: <strong>{preselectedCliente.nombre_completo}</strong></span>
          </div>
          <button 
            onClick={onClearPreselected}
            style={{ padding: 4, background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 4, cursor: 'pointer', color: '#fff' }}
            title="Cancelar selección"
          >
            <X size={16} />
          </button>
        </div>
      )}


      {/* Cross-branch warning for employees */}
      {profile?.sucursal_id && sucursalId && profile.sucursal_id !== sucursalId && (
        <div style={{ 
          background: 'rgba(245, 158, 11, 0.1)', 
          color: '#d97706', 
          padding: '10px 20px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: 10, 
          fontSize: 13, 
          fontWeight: 600,
          borderBottom: '1px solid rgba(245, 158, 11, 0.2)'
        }}>
          <AlertTriangle size={18} />
          <span>
            Estás viendo la agenda de <strong style={{ color: 'var(--text-1)' }}>{activeSucursalObj?.nombre}</strong>. 
            Tu sucursal base es <strong style={{ color: 'var(--text-1)' }}>{sucursales.find(s => s.id === profile.sucursal_id)?.nombre}</strong>.
          </span>
        </div>
      )}

      {/* ── Topbar ───────────────────────────────────────────── */}
      <div className="page-header" style={{ padding: '24px 24px 0', marginBottom: 24 }}>
        <div className="page-header-content">
          <h1 className="page-title">Agenda semanal</h1>
          <p className="page-subtitle">Gestiona citas, bloqueos y disponibilidad por sucursal</p>
        </div>

        <div className="page-header-actions">
          {(profile?.rol === 'admin' || profile?.rol === 'superadmin') && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button 
                className="btn-secondary" 
                style={{ padding: '8px 14px', fontSize: 13, background: 'var(--surface)', border: '1px solid var(--border)' }}
                onClick={() => setModal({ type: 'desbloquear' })}
              >
                Desbloqueo Horarios Masivo
              </button>
              <button 
                className="btn-primary" 
                style={{ padding: '8px 14px', fontSize: 13 }}
                onClick={() => setModal({ type: 'bloquear' })}
              >
                Bloquear Horario
              </button>
            </div>
          )}
        </div>

          {/* Week nav */}
          <div className="date-nav">
            <button onClick={prevWeek}  className="date-nav-btn"><ChevronLeft size={16} /></button>
            <button onClick={thisWeek}  className="date-nav-today">
              <Calendar size={13} /> Hoy
            </button>
            <span className="date-nav-label">{weekLabel}</span>
            <button onClick={nextWeek}  className="date-nav-btn"><ChevronRight size={16} /></button>
          </div>
        </div>

      {/* ── Grid ─────────────────────────────────────────────── */}
      <AgendaGrid
        key={activeSucursal ?? 'none'}
        weekDates={weekDates}
        empleadas={empleadas}
        sucursal={activeSucursalObj}
        isLoading={isLoadingEmpleadas}
        citas={citas}
        bloqueos={bloqueos}
        empleadasConEntrada={empleadasSinEntrada}
        onSinEntradaClick={(empleadaId) => {
          const emp = empleadas.find(e => e.id === empleadaId)
          if (emp) setModal({ type: 'registrar-entrada', empleadaId, nombre: emp.nombre })
        }}
        onSlotClick={handleSlotClick}
        onCitaClick={(c) => setModal({ type: 'gestion', cita: c })}
        onBloqueoClick={(b) => setModal({ type: 'bloqueo-info', bloqueo: b })}
      />

      {/* ── Modals ───────────────────────────────────────────── */}
      {modal.type === 'buscar' && (
        <BuscadorModal
          onSelect={handleClienteSelect}
          onNuevoCliente={handleNuevoCliente}
          onClose={closeModal}
        />
      )}
      {modal.type === 'nuevo-cliente' && (
        <FormularioCliente
          onCreated={(cliente) => {
            if (cliente) handleClienteCreado(cliente)
          }}
          onClose={closeModal}
        />
      )}
      {modal.type === 'nueva-cita' && (
        <NuevaCitaModal
          cliente={modal.cliente}
          empleadaId={modal.slot.empleadaId}
          horaInicio={modal.slot.hora}
          fecha={modal.slot.fecha}
          sucursalId={activeSucursal}
          onClose={closeModal}
          onCreated={closeModal}
        />
      )}
      {modal.type === 'gestion' && (
        <GestionCitaModal 
          cita={modal.cita} 
          onClose={closeModal} 
          onValidar={() => setModal({ type: 'checkout', cita: modal.cita })}
        />
      )}

      {modal.type === 'checkout' && (
        <CheckoutFlow
          cita={modal.cita}
          onClose={closeModal}
          onFinish={closeModal}
        />
      )}

      {modal.type === 'bloquear' && (
        <BloqueoModal
          empleadas={empleadas}
          onClose={closeModal}
        />
      )}
      {modal.type === 'desbloquear' && (
        <DesbloqueoModal
          empleadas={empleadas}
          onClose={closeModal}
        />
      )}
      {modal.type === 'bloqueo-info' && (
        <BloqueoInfoModal
          bloqueo={modal.bloqueo}
          empleadas={empleadas}
          onClose={closeModal}
          onDelete={handleDeleteBloqueo}
        />
      )}

      {/* Modal: Registrar Entrada Manual */}
      {modal.type === 'registrar-entrada' && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={closeModal}
        >
          <div
            style={{ background: 'var(--surface)', borderRadius: 20, padding: 32, maxWidth: 380, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{ background: 'rgba(220,38,38,0.1)', borderRadius: 12, padding: 10 }}>
                <LogIn size={22} color="var(--danger)" />
              </div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-1)' }}>Registrar Entrada</div>
                <div style={{ fontSize: 13, color: 'var(--text-3)' }}>Registro manual desde la agenda</div>
              </div>
            </div>

            <div style={{ background: 'var(--surface-2)', borderRadius: 12, padding: '14px 16px', margin: '20px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Users size={16} color="var(--text-3)" />
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)' }}>{modal.nombre}</span>
            </div>

            <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 24, lineHeight: 1.5 }}>
              Esto registrará una entrada con la hora actual y desbloqueará la columna de la profesional en la agenda.
            </p>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="btn-secondary"
                style={{ flex: 1, padding: '12px' }}
                onClick={closeModal}
              >
                Cancelar
              </button>
              <button
                className="btn-primary"
                style={{ flex: 1, padding: '12px', background: 'var(--success)', borderColor: 'var(--success)', gap: 8 }}
                onClick={async () => {
                  try {
                    const { error } = await supabase.from('asistencia').insert({
                      sucursal_id: activeSucursal,
                      empleada_id: modal.empleadaId,
                      tipo: 'Entrada',
                    })
                    if (error) throw error
                    const hoy = format(new Date(), 'yyyy-MM-dd')
                    queryClient.invalidateQueries({ queryKey: ['asistencia_hoy', hoy, activeSucursal] })
                    toast(`Entrada registrada para ${modal.nombre}`, 'success')
                    closeModal()
                  } catch (err: any) {
                    toast('Error al registrar: ' + err.message, 'error')
                  }
                }}
              >
                <LogIn size={16} /> Confirmar Entrada
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
