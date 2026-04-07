import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Sidebar, { type Section } from './components/Layout/Sidebar'
import AgendaPage from './pages/AgendaPage'
import ClientesPage from './pages/ClientesPage'
import ProfesionalesPage from './pages/ProfesionalesPage'
import InventarioPage from './pages/InventarioPage'
import DocumentosPage from './pages/DocumentosPage'
import type { Cliente } from './types/database'

import EstadisticasPage from "./pages/EstadisticasPage"
import InicioPage from "./pages/InicioPage"
import ValidacionPage from './pages/ValidacionPage'
import TicketPage from './pages/TicketPage'
import ReportesPage from './pages/ReportesPage'
import FacturacionPage from './pages/FacturacionPage'
import CajaPage from './pages/CajaPage'
import type { Cita } from './types/database'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 1000 * 30 } },
})

export default function App() {
  const [section, setSection] = useState<Section>('inicio')
  const [pendingClient, setPendingClient] = useState<Cliente | null>(null)
  
  // Checkout flow states
  const [validatingCita, setValidatingCita] = useState<Cita | null>(null)
  const [ticketCita, setTicketCita] = useState<Cita | null>(null)

  return (
    <QueryClientProvider client={queryClient}>
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

          {section === 'clientes'      && (
            <ClientesPage onGoToAgenda={(c: Cliente) => {
              setPendingClient(c)
              setSection('agenda')
            }} />
          )}
          {section === 'inventario'    && <InventarioPage />}
          {section === 'caja'          && <CajaPage />}
          {section === 'documentos'    && <DocumentosPage />}
          {section === 'estadisticas'  && <EstadisticasPage />}
          {section === 'reportes'      && <ReportesPage />}
          {section === 'facturacion'   && <FacturacionPage />}
          {section === 'configuracion' && <ProfesionalesPage />}
        </div>
      </div>
    </QueryClientProvider>
  )
}
