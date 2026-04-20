import { Home, Calendar, Users, BarChart2, Package, Wallet, ShoppingCart, Megaphone, LogOut, Clock, Settings } from 'lucide-react'
import { useEffect } from 'react'
import { useSucursales } from '../../hooks/useSucursales'
import { useAuthContext } from '../../context/AuthContext'
import { useSucursalContext } from '../../context/SucursalContext'

export type Section = 'inicio' | 'agenda' | 'asistencia' | 'clientes' | 'inventario' | 'documentos' | 'profesionales' | 'validacion' | 'cobro' | 'analisis' | 'caja' | 'venta-directa' | 'marketing' | 'seguridad' | 'administracion'

interface Props {
  current: Section
  onChange: (s: Section) => void
}

interface NavItem {
  id: Section
  label: string
  Icon: any
}

interface NavGroup {
  name: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    name: 'Operaciones',
    items: [
      { id: 'inicio',         label: 'Inicio',         Icon: Home         },
      { id: 'agenda',         label: 'Agenda',         Icon: Calendar     },
      { id: 'clientes',       label: 'Clientes',       Icon: Users        },
      { id: 'asistencia',     label: 'Asistencia',     Icon: Clock        },
      { id: 'venta-directa',  label: 'Venta Directa',  Icon: ShoppingCart },
      { id: 'caja',           label: 'Caja',           Icon: Wallet       },
    ]
  },
  {
    name: 'Análisis',
    items: [
      { id: 'analisis',       label: 'Análisis',       Icon: BarChart2    },
    ]
  },
  {
    name: 'Configuración',
    items: [
      { id: 'administracion', label: 'Administración', Icon: Settings      },
      { id: 'inventario',     label: 'Inventario',     Icon: Package       },
      { id: 'marketing',      label: 'Marketing',      Icon: Megaphone     },
    ]
  }
]

export default function Sidebar({ current, onChange }: Props) {
  const { data: sucursales = [] } = useSucursales()
  const { signOut, user, profile } = useAuthContext()
  const { selectedSucursalId, setSelectedSucursalId } = useSucursalContext()

  // Auto-select first sucursal if none selected
  useEffect(() => {
    if (!selectedSucursalId && sucursales.length > 0) {
      setSelectedSucursalId(sucursales[0].id)
    }
  }, [sucursales, selectedSucursalId, setSelectedSucursalId])

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
            const allowedForEmpleado: Section[] = ['clientes', 'agenda', 'asistencia', 'venta-directa', 'caja']
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
              
              {allowedItems.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => onChange(id)}
                  className={`nav-item ${current === id ? 'active' : ''}`}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
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
