import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ToastProvider } from './components/Common/Toast'
import Sidebar, { type Section } from './components/Layout/Sidebar'
import AgendaPage from './pages/AgendaPage'
import ClientesPage from './pages/ClientesPage'
import ProfesionalesPage from './pages/ProfesionalesPage'
import InventarioPage from './pages/InventarioPage'
import DocumentosPage from './pages/DocumentosPage'
import type { Cliente, Cita } from './types/database'
import { AuthProvider, useAuthContext } from './context/AuthContext'
import { SucursalProvider } from './context/SucursalContext'
import LoginPage from './pages/LoginPage'
import LandingPage from './pages/LandingPage'
import BookingPage from './pages/BookingPage'
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

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 0 } },
})

// ─── ADMIN SHELL (The Legacy System) ─────────────────────────────
function AdminShell() {
  const { session, loading, profile } = useAuthContext()
  const [section, setSection] = useState<Section>('inicio')
  const [pendingClient, setPendingClient] = useState<Cliente | null>(null)
  const [validatingCita, setValidatingCita] = useState<Cita | null>(null)
  const [ticketCita, setTicketCita] = useState<Cita | null>(null)

  // Muestra spinner si:
  // 1. Aún no sabemos si hay sesión (loading)
  // 2. Hay sesión pero el perfil/rol del usuario aún no se ha cargado
  if (loading || (session && !profile)) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <RefreshCw size={32} className="animate-spin" style={{ color: 'var(--accent)' }} />
    </div>
  )

  if (!session) return <Navigate to="/login" replace />

  // Sección inicial según el rol (el perfil ya está garantizado aquí)
  const isEmpleado = profile?.rol === 'empleado'
  const effectiveSection = isEmpleado && section === 'inicio' ? 'agenda' : section

  return (
    <div className="app-shell">
      <Sidebar current={effectiveSection} onChange={setSection} />
      <div className="main-area">
        {effectiveSection === 'inicio'        && <InicioPage />}
        
        {effectiveSection === 'agenda' && (
          <>
            {validatingCita ? (
              <ValidacionPage 
                cita={validatingCita} 
                onBack={() => setValidatingCita(null)}
                onNext={(updated) => { setTicketCita(updated); setValidatingCita(null); }}
              />
            ) : ticketCita ? (
              <TicketPage 
                cita={ticketCita}
                onBack={() => { setValidatingCita(ticketCita); setTicketCita(null); }}
                onFinish={() => { setTicketCita(null); setValidatingCita(null); }}
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

        {effectiveSection === 'asistencia'    && <AsistenciaPage />}
        {effectiveSection === 'clientes'      && (
          <ClientesPage onGoToAgenda={(c: Cliente) => { setPendingClient(c); setSection('agenda'); }} />
        )}
        {effectiveSection === 'inventario'    && <InventarioPage />}
        {effectiveSection === 'caja'          && <CajaPage />}
        {effectiveSection === 'venta-directa' && <VentaDirectaPage onFinish={() => setSection('inicio')} />}
        {effectiveSection === 'hoja'          && <HojaPage />}
        {effectiveSection === 'marketing'     && <MarketingPage />}
        {effectiveSection === 'documentos'    && <DocumentosPage />}
        {effectiveSection === 'estadisticas'  && <EstadisticasPage />}
        {effectiveSection === 'reportes'      && <ReportesPage />}
        {effectiveSection === 'facturacion'   && <FacturacionPage />}
        {effectiveSection === 'configuracion' && <ProfesionalesPage />}
        {effectiveSection === 'seguridad'     && <SeguridadPage />}
      </div>
    </div>
  )
}

function AuthWrapper() {
  const { session, loading } = useAuthContext()
  if (loading) return null
  if (session) return <Navigate to="/admin" replace />
  return <LoginPage />
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider queryClient={queryClient}>
        <SucursalProvider>
          <ToastProvider>
            <BrowserRouter>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/reservar" element={<BookingPage />} />
                <Route path="/login" element={<AuthWrapper />} />
                
                {/* Admin Routes */}
                <Route path="/admin" element={<AdminShell />} />
                
                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </ToastProvider>
        </SucursalProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
