import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ToastProvider } from './components/Common/Toast'
import ErrorBoundary from './components/Common/ErrorBoundary'
import Sidebar from './components/Layout/Sidebar'
import AgendaPage from './pages/AgendaPage'
import ClientesPage from './pages/ClientesPage'
import InventarioPage from './pages/InventarioPage'
import AdministracionPage from './pages/AdministracionPage'
import { AuthProvider, useAuthContext } from './context/AuthContext'
import { SucursalProvider } from './context/SucursalContext'
import LoginPage from './pages/LoginPage'
import LandingPage from './pages/LandingPage'
import BookingPage from './pages/BookingPage'
import ServiceFamilyPage from './pages/ServiceFamilyPage'
import { RefreshCw } from 'lucide-react'

import InicioPage from "./pages/InicioPage"
import AnalisisPage from './pages/AnalisisPage'
import CajaPage from './pages/CajaPage'
import VentaDirectaPage from './pages/VentaDirectaPage'
import MarketingPage from './pages/MarketingPage'
import AsistenciaPage from './pages/AsistenciaPage'
import VacacionesPage from './pages/VacacionesPage'
import SucursalGuard from './components/Common/SucursalGuard'
import type { Cliente } from './types/database'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 60_000 } }, // 1 min — evita refetch innecesario al navegar entre páginas
})

// ─── ADMIN LAYOUT SHELL ──────────────────────────────────────────
// Wraps all /admin/* routes — handles auth checks and renders Sidebar + Outlet
function AdminShell() {
  const { session, loading, profile } = useAuthContext()
  const location = useLocation()

  // 1. Auth state still loading
  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <RefreshCw size={32} className="animate-spin" style={{ color: 'var(--accent)' }} />
    </div>
  )

  // 2. No session → Login
  if (!session) return <Navigate to="/login" replace />

  // 3. Session active but profile still loading
  if (profile === undefined) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <RefreshCw size={32} className="animate-spin" style={{ color: 'var(--accent)' }} />
    </div>
  )

  // 4. Redirect /admin exactly → default section by role
  if (location.pathname === '/admin' || location.pathname === '/admin/') {
    const defaultPath = profile?.rol === 'empleado' ? '/admin/agenda' : '/admin/inicio'
    return <Navigate to={defaultPath} replace />
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-area">
        <Outlet />
      </div>
    </div>
  )
}

// ClientesPage needs to navigate to Agenda with a pre-selected client.
// We use router location.state for this.
function ClientesWrapper() {
  const navigate = useNavigate()
  return (
    <ClientesPage
      onGoToAgenda={(c: Cliente) => navigate('/admin/agenda', { state: { preselectedCliente: c } })}
    />
  )
}

// AgendaPage reads preselectedCliente from location.state and clears it after use
function AgendaWrapper() {
  const location = useLocation()
  const navigate = useNavigate()
  const preselectedCliente = (location.state as { preselectedCliente?: Cliente } | null)?.preselectedCliente ?? null

  // Clear the state from history so refresh doesn't re-apply it
  useEffect(() => {
    if (preselectedCliente) {
      navigate('/admin/agenda', { replace: true, state: {} })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <AgendaPage
      preselectedCliente={preselectedCliente}
      onClearPreselected={() => navigate('/admin/agenda', { replace: true, state: {} })}
    />
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
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider queryClient={queryClient}>
          <SucursalProvider>
            <ToastProvider>
              <BrowserRouter>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/servicios/:slug" element={<ServiceFamilyPage />} />
                  <Route path="/reservar" element={<BookingPage />} />
                  <Route path="/login" element={<AuthWrapper />} />

                  {/* Admin Routes — nested under AdminShell layout */}
                  <Route path="/admin" element={<AdminShell />}>
                    <Route path="inicio"        element={<InicioPage />} />
                    <Route path="agenda"        element={<AgendaWrapper />} />
                    <Route path="asistencia"    element={<SucursalGuard><AsistenciaPage /></SucursalGuard>} />
                    <Route path="clientes"      element={<ClientesWrapper />} />
                    <Route path="inventario"    element={<InventarioPage />} />
                    <Route path="caja"          element={<SucursalGuard><CajaPage /></SucursalGuard>} />
                    <Route path="venta-directa" element={<SucursalGuard><VentaDirectaPage /></SucursalGuard>} />
                    <Route path="marketing"     element={<MarketingPage />} />
                    <Route path="analisis"      element={<AnalisisPage />} />
                    <Route path="administracion" element={<AdministracionPage />} />
                    <Route path="vacaciones"    element={<SucursalGuard><VacacionesPage /></SucursalGuard>} />
                  </Route>

                  {/* Fallback */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </BrowserRouter>
            </ToastProvider>
          </SucursalProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
