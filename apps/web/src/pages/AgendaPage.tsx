import { useState } from 'react'
import { startOfWeek, addDays, addWeeks, subWeeks, format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Calendar, CalendarPlus, X } from 'lucide-react'
import AgendaGrid from '../components/Agenda/AgendaGrid'
import BuscadorModal from '../components/Clientes/BuscadorModal'
import FormularioCliente from '../components/Clientes/FormularioCliente'
import NuevaCitaModal from '../components/Citas/NuevaCitaModal'
import GestionCitaModal from '../components/Citas/GestionCitaModal'
import BloqueoModal from '../components/Agenda/BloqueoModal'
import BloqueoInfoModal from '../components/Agenda/BloqueoInfoModal'
import DesbloqueoModal from '../components/Agenda/DesbloqueoModal'
import { useSucursalContext } from '../context/SucursalContext'
import { useEmpleadas } from '../hooks/useEmpleadas'
import { useSucursales } from '../hooks/useSucursales'
import { useCitasSemana, useBloqueosSemana, useEliminarBloqueo } from '../hooks/useCitas'
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

function getWeekDates(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
}

interface Props {
  preselectedCliente?: Cliente | null
  onClearPreselected?: () => void
  onValidarCita?: (cita: Cita) => void
}


export default function AgendaPage({ preselectedCliente, onClearPreselected, onValidarCita }: Props) {

  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  )
  const { selectedSucursalId: sucursalId } = useSucursalContext()
  const { profile } = useAuthContext()
  const [modal, setModal] = useState<Modal>({ type: 'none' })
  const toast = useToast()
  const eliminarBloqueo = useEliminarBloqueo()

  const weekDates   = getWeekDates(weekStart)
  const inicioStr   = format(weekDates[0], 'yyyy-MM-dd')
  const finStr      = format(weekDates[6], 'yyyy-MM-dd')
  const weekLabel   = `${format(weekDates[0], 'd MMM', { locale: es })} – ${format(weekDates[6], 'd MMM yyyy', { locale: es })}`

  const activeSucursal            = sucursalId
  const { data: sucursales = [] }  = useSucursales()
  const activeSucursalObj          = sucursales.find(s => s.id === activeSucursal) ?? null
  const { data: empleadas = [] }  = useEmpleadas(activeSucursal || undefined)
  const { data: citas = [] }      = useCitasSemana(inicioStr, finStr, activeSucursal)
  const { data: bloqueos = [] }   = useBloqueosSemana(inicioStr, finStr)

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
        citas={citas}
        bloqueos={bloqueos}
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
          onValidar={onValidarCita ? () => {
            closeModal()
            onValidarCita?.(modal.cita)
          } : undefined}
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
    </div>
  )
}
