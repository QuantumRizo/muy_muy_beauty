import { Home, Calendar, Users, BarChart2, Package, Wallet, ShoppingCart, Megaphone, LogOut, Clock, Settings, Palmtree } from 'lucide-react'
import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useSucursales } from '../../hooks/useSucursales'
import { useAuthContext } from '../../context/AuthContext'
import { useSucursalContext } from '../../context/SucursalContext'

// Section type is still exported so other parts of the codebase can use it if needed
export type Section = 'inicio' | 'agenda' | 'asistencia' | 'clientes' | 'inventario' | 'documentos' | 'profesionales' | 'validacion' | 'cobro' | 'analisis' | 'caja' | 'venta-directa' | 'marketing' | 'seguridad' | 'administracion' | 'vacaciones'

interface NavItem {
  id: Section
  label: string
  Icon: any
  path: string
}

interface NavGroup {
  name: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    name: 'Operaciones',
    items: [
      { id: 'inicio',         label: 'Inicio',         Icon: Home,         path: '/admin/inicio'         },
      { id: 'agenda',         label: 'Agenda',         Icon: Calendar,     path: '/admin/agenda'         },
      { id: 'clientes',       label: 'Clientes',       Icon: Users,        path: '/admin/clientes'       },
      { id: 'asistencia',     label: 'Asistencia',     Icon: Clock,        path: '/admin/asistencia'     },
      { id: 'venta-directa',  label: 'Venta Directa',  Icon: ShoppingCart, path: '/admin/venta-directa'  },
      { id: 'caja',           label: 'Caja',           Icon: Wallet,       path: '/admin/caja'           },
      { id: 'vacaciones',     label: 'Vacaciones',     Icon: Palmtree,     path: '/admin/vacaciones'     },
    ]
  },
  {
    name: 'Análisis',
    items: [
      { id: 'analisis',       label: 'Análisis',       Icon: BarChart2,    path: '/admin/analisis'       },
    ]
  },
  {
    name: 'Configuración',
    items: [
      { id: 'administracion', label: 'Administración', Icon: Settings,     path: '/admin/administracion' },
      { id: 'inventario',     label: 'Inventario',     Icon: Package,      path: '/admin/inventario'     },
      { id: 'marketing',      label: 'Marketing',      Icon: Megaphone,    path: '/admin/marketing'      },
    ]
  }
]

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { data: sucursales = [] } = useSucursales()
  const { signOut, user, profile } = useAuthContext()
  const { selectedSucursalId, setSelectedSucursalId } = useSucursalContext()

  // Auto-select first sucursal if none selected
  useEffect(() => {
    if (!selectedSucursalId && sucursales.length > 0) {
      setSelectedSucursalId(sucursales[0].id)
    }
  }, [sucursales, selectedSucursalId, setSelectedSucursalId])

  // Derive active section from the current URL path
  const currentPath = location.pathname

  return (
    <nav className="sidebar">
      <div style={{ padding: '24px 20px 10px', textAlign: 'center' }}>
        <img
          src="/logo.jpeg"
          alt="MUYMUY Beauty Studio"
          style={{
            maxWidth: '100%',
            height: 'auto',
            borderRadius: '12px',
            marginBottom: '10px'
          }}
        />
      </div>
      <div style={{ padding: '10px 16px 8px' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.05em', marginBottom: 8 }}>SUCURSAL ACTIVA</div>
        <select
          value={selectedSucursalId}
          onChange={(e) => setSelectedSucursalId(e.target.value)}
          style={{
            width: '100%',
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            padding: '8px 12px',
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--text-1)',
            outline: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
          onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
        >
          {sucursales.map(s => (
            <option key={s.id} value={s.id}>{s.nombre}</option>
          ))}
        </select>
      </div>

      <div className="sidebar-nav" style={{ padding: '8px' }}>
        {navGroups.map((group, groupIndex) => {
          // Filter items based on user role
          const allowedItems = group.items.filter(({ id }) => {
            if (!profile || profile.rol === 'admin' || profile.rol === 'superadmin') return true
            const allowedForEmpleado: Section[] = ['clientes', 'agenda', 'asistencia', 'venta-directa', 'caja', 'vacaciones']
            return allowedForEmpleado.includes(id)
          })

          // If no items in this group are allowed, don't render the group at all
          if (allowedItems.length === 0) return null

          return (
            <div key={group.name} style={{ marginBottom: groupIndex < navGroups.length - 1 ? 16 : 0 }}>
              {/* Minimalist Separator for groups after the first one */}
              {groupIndex > 0 && (
                <div style={{ margin: '0 8px 16px 8px', borderTop: '1px solid var(--border)', opacity: 0.5 }}></div>
              )}

              {allowedItems.map(({ id, label, Icon, path }) => {
                const isActive = currentPath === path || currentPath.startsWith(path + '/')
                return (
                  <button
                    key={id}
                    onClick={() => navigate(path)}
                    className={`nav-item ${isActive ? 'active' : ''}`}
                  >
                    <Icon size={16} />
                    {label}
                  </button>
                )
              })}
            </div>
          )
        })}

        <div style={{ margin: '16px 8px', borderTop: '1px solid var(--border)', opacity: 0.5 }}></div>

        <button className="nav-item" onClick={signOut} style={{ color: 'var(--danger)' }}>
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </div>

      <div className="sidebar-footer">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 8 }}>
          <div style={{ fontWeight: 700, color: 'var(--text-1)', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {profile?.nombre || user?.email?.split('@')[0]}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {user?.email}
          </div>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
          {sucursales.length > 0
            ? `${sucursales.length} sucursal${sucursales.length !== 1 ? 'es' : ''} activa${sucursales.length !== 1 ? 's' : ''}`
            : 'Cargando...'}
        </div>
      </div>
    </nav>
  )
}
