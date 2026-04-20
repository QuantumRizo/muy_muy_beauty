import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ToastProvider } from './components/Common/Toast'
import Sidebar, { type Section } from './components/Layout/Sidebar'
import AgendaPage from './pages/AgendaPage'
import ClientesPage from './pages/ClientesPage'
import InventarioPage from './pages/InventarioPage'
import AdministracionPage from './pages/AdministracionPage'
import type { Cliente } from './types/database'
import { AuthProvider, useAuthContext } from './context/AuthContext'
import { SucursalProvider } from './context/SucursalContext'
import LoginPage from './pages/LoginPage'
import LandingPage from './pages/LandingPage'
import BookingPage from './pages/BookingPage'
import { RefreshCw } from 'lucide-react'

import InicioPage from "./pages/InicioPage"
import AnalisisPage from './pages/AnalisisPage'
import CajaPage from './pages/CajaPage'
import VentaDirectaPage from './pages/VentaDirectaPage'
import MarketingPage from './pages/MarketingPage'
import AsistenciaPage from './pages/AsistenciaPage'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 0 } },
})

// ─── ADMIN SHELL (The Legacy System) ─────────────────────────────
function AdminShell() {
  const { session, loading, profile } = useAuthContext()
  const [section, setSection] = useState<Section>('inicio')
  const [pendingClient, setPendingClient] = useState<Cliente | null>(null)

  // 1. Aún no sabemos si hay sesión
  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <RefreshCw size={32} className="animate-spin" style={{ color: 'var(--accent)' }} />
    </div>
  )

  // 2. Sin sesión → Login
  if (!session) return <Navigate to="/login" replace />

  // 3. Sesión activa pero perfil todavía cargando (breve momento)
  if (profile === undefined) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <RefreshCw size={32} className="animate-spin" style={{ color: 'var(--accent)' }} />
    </div>
  )

  // Sección inicial según el rol (el perfil ya está garantizado aquí)
  const isEmpleado = profile?.rol === 'empleado'
  const effectiveSection = isEmpleado && section === 'inicio' ? 'agenda' : section

  return (
    <div className="app-shell">
      <Sidebar current={effectiveSection} onChange={setSection} />
      <div className="main-area">
        {effectiveSection === 'inicio'        && <InicioPage />}
        
        {effectiveSection === 'agenda' && (
          <AgendaPage 
            preselectedCliente={pendingClient} 
            onClearPreselected={() => setPendingClient(null)} 
          />
        )}

        {effectiveSection === 'asistencia'    && <AsistenciaPage />}
        {effectiveSection === 'clientes'      && (
          <ClientesPage onGoToAgenda={(c: Cliente) => { setPendingClient(c); setSection('agenda'); }} />
        )}
        {effectiveSection === 'inventario'    && <InventarioPage />}
        {effectiveSection === 'caja'          && <CajaPage />}
        {effectiveSection === 'venta-directa' && <VentaDirectaPage onFinish={() => setSection('inicio')} />}
        {effectiveSection === 'marketing'     && <MarketingPage />}
        {effectiveSection === 'analisis'      && <AnalisisPage />}
        {effectiveSection === 'administracion' && <AdministracionPage />}
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
