import { Home, Calendar, Users, Briefcase, BarChart2, Package, Wallet, FileDown, FolderOpen, Receipt, ShoppingCart, ClipboardList, Megaphone, LogOut, Key, Clock } from 'lucide-react'
import { useEffect } from 'react'
import { useSucursales } from '../../hooks/useSucursales'
import { useAuthContext } from '../../context/AuthContext'
import { useSucursalContext } from '../../context/SucursalContext'

export type Section = 'inicio' | 'agenda' | 'asistencia' | 'clientes' | 'inventario' | 'documentos' | 'configuracion' | 'validacion' | 'cobro' | 'estadisticas' | 'reportes' | 'facturacion' | 'caja' | 'venta-directa' | 'hoja' | 'marketing' | 'seguridad'

interface Props {
  current: Section
  onChange: (s: Section) => void
}

const items: { id: Section; label: string; Icon: any }[] = [
  { id: 'inicio',         label: 'Inicio',         Icon: Home         },
  { id: 'clientes',       label: 'Clientes',       Icon: Users        },
  { id: 'agenda',         label: 'Agenda',         Icon: Calendar     },
  { id: 'asistencia',     label: 'Asistencia',     Icon: Clock        },
  { id: 'venta-directa',  label: 'Venta Directa',  Icon: ShoppingCart },
  { id: 'estadisticas',   label: 'Estadísticas',   Icon: BarChart2    },
  { id: 'reportes',       label: 'Reportes',       Icon: FileDown     },
  { id: 'hoja',           label: 'Eval. de Hoja',  Icon: ClipboardList },
  { id: 'configuracion',  label: 'Profesionales',  Icon: Briefcase    },
  { id: 'inventario',     label: 'Inventario',     Icon: Package      },
  { id: 'facturacion',    label: 'Facturación',    Icon: Receipt      },
  { id: 'caja',           label: 'Caja',           Icon: Wallet       },
  { id: 'marketing',      label: 'Marketing',      Icon: Megaphone    },
  { id: 'documentos',     label: 'Documentos',     Icon: FolderOpen   },
  { id: 'seguridad',      label: 'Seguridad',      Icon: Key          },
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
        {items.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`nav-item ${current === id ? 'active' : ''}`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
        
        <div style={{ margin: '12px 0', borderTop: '1px solid var(--border)' }}></div>
        
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
