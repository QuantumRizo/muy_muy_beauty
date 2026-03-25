import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Sidebar, { type Section } from './components/Layout/Sidebar'
import AgendaPage from './pages/AgendaPage'
import ClientesPage from './pages/ClientesPage'
import ProfesionalesPage from './pages/ProfesionalesPage'
import type { Cliente } from './types/database'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 1000 * 30 } },
})

export default function App() {
  const [section, setSection] = useState<Section>('agenda')
  const [pendingClient, setPendingClient] = useState<Cliente | null>(null)

  return (
    <QueryClientProvider client={queryClient}>
      <div className="app-shell">
        <Sidebar current={section} onChange={setSection} />
        <div className="main-area">
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
          {section === 'configuracion' && <ProfesionalesPage />}
        </div>
      </div>
    </QueryClientProvider>
  )
}
