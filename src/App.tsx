import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ToastProvider } from './components/Common/Toast'
import Sidebar, { type Section } from './components/Layout/Sidebar'
import AgendaPage from './pages/AgendaPage'
import ClientesPage from './pages/ClientesPage'
import ProfesionalesPage from './pages/ProfesionalesPage'
import InventarioPage from './pages/InventarioPage'
import DocumentosPage from './pages/DocumentosPage'
import type { Cliente } from './types/database'

import { AuthProvider, useAuthContext } from './context/AuthContext'
import { SucursalProvider } from './context/SucursalContext'
import LoginPage from './pages/LoginPage'
import { RefreshCw } from 'lucide-react'

import EstadisticasPage from "./pages/EstadisticasPage"
import InicioPage from "./pages/InicioPage"
import ValidacionPage from './pages/ValidacionPage'
import TicketPage from './pages/TicketPage'
import ReportesPage from './pages/ReportesPage'
import FacturacionPage from './pages/FacturacionPage'
import CajaPage from './pages/CajaPage'
import VentaDirectaPage from './pages/VentaDirectaPage'
import HojaPage from './pages/HojaPage'
import MarketingPage from './pages/MarketingPage'
import SeguridadPage from './pages/SeguridadPage'
import AsistenciaPage from './pages/AsistenciaPage'
import type { Cita } from './types/database'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 0 } },
})

function AppContent() {
  const { session, loading } = useAuthContext()
  const [section, setSection] = useState<Section>('inicio')
  const [pendingClient, setPendingClient] = useState<Cliente | null>(null)
  
  const [validatingCita, setValidatingCita] = useState<Cita | null>(null)
  const [ticketCita, setTicketCita] = useState<Cita | null>(null)

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <RefreshCw size={32} className="animate-spin" style={{ color: 'var(--accent)' }} />
      </div>
    )
  }

  if (!session) {
    return <LoginPage />
  }

  return (
    <ToastProvider>
      <div className="app-shell">
        <Sidebar current={section} onChange={setSection} />
        <div className="main-area">
          {section === 'inicio'        && <InicioPage />}

          {/* Agenda & Checkout Flow */}
          {section === 'agenda' && (
            <>
              {validatingCita ? (
                <ValidacionPage 
                  cita={validatingCita} 
                  onBack={() => setValidatingCita(null)}
                  onNext={(updated) => {
                    setTicketCita(updated)
                    setValidatingCita(null)
                  }}
                />
              ) : ticketCita ? (
                <TicketPage 
                  cita={ticketCita}
                  onBack={() => {
                    setValidatingCita(ticketCita)
                    setTicketCita(null)
                  }}
                  onFinish={() => {
                    setTicketCita(null)
                    setValidatingCita(null)
                  }}
                />
              ) : (
                <AgendaPage 
                  preselectedCliente={pendingClient} 
                  onClearPreselected={() => setPendingClient(null)} 
                  onValidarCita={(cita) => setValidatingCita(cita)}
                />
              )}
            </>
          )}

          {section === 'asistencia'    && <AsistenciaPage />}

          {section === 'clientes'      && (
            <ClientesPage onGoToAgenda={(c: Cliente) => {
              setPendingClient(c)
              setSection('agenda')
            }} />
          )}
          {section === 'inventario'    && <InventarioPage />}
          {section === 'caja'          && <CajaPage />}
          {section === 'venta-directa' && <VentaDirectaPage onFinish={() => setSection('inicio')} />}
          {section === 'hoja'          && <HojaPage />}
          {section === 'marketing'     && <MarketingPage />}
          {section === 'documentos'    && <DocumentosPage />}
          {section === 'estadisticas'  && <EstadisticasPage />}
          {section === 'reportes'      && <ReportesPage />}
          {section === 'facturacion'   && <FacturacionPage />}
          {section === 'configuracion' && <ProfesionalesPage />}
          {section === 'seguridad'     && <SeguridadPage />}
        </div>
      </div>
    </ToastProvider>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider queryClient={queryClient}>
        <SucursalProvider>
          <AppContent />
        </SucursalProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
