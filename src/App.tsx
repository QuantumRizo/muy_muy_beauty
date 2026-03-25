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
import DashboardPage from './pages/DashboardPage'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 1000 * 30 } },
})

export default function App() {
  const [section, setSection] = useState<Section>('inicio')
  const [pendingClient, setPendingClient] = useState<Cliente | null>(null)

  return (
    <QueryClientProvider client={queryClient}>
      <div className="app-shell">
        <Sidebar current={section} onChange={setSection} />
        <div className="main-area">
          {section === 'inicio'        && <DashboardPage />}
          {section === 'agenda'        && (
            <AgendaPage 
              preselectedCliente={pendingClient} 
              onClearPreselected={() => setPendingClient(null)} 
            />
          )}

          {section === 'clientes'      && (
            <ClientesPage onGoToAgenda={(c: Cliente) => {
              setPendingClient(c)
              setSection('agenda')
            }} />
          )}
          {section === 'inventario'    && <InventarioPage />}
          {section === 'documentos'    && <DocumentosPage />}
          {section === 'estadisticas'  && <EstadisticasPage />}
          {section === 'configuracion' && <ProfesionalesPage />}
        </div>
      </div>
    </QueryClientProvider>
  )
}
