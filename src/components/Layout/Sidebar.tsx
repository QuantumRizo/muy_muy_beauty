import { Home, Calendar, Users, Briefcase, BarChart2, Package, FileText, Wallet, FileDown } from 'lucide-react'

export type Section = 'inicio' | 'agenda' | 'clientes' | 'inventario' | 'documentos' | 'configuracion' | 'validacion' | 'cobro' | 'estadisticas' | 'reportes' | 'facturacion' | 'caja'

interface Props {
  current: Section
  onChange: (s: Section) => void
}

const items: { id: Section; label: string; Icon: any }[] = [
  { id: 'inicio',       label: 'Inicio',       Icon: Home       },
  { id: 'clientes',     label: 'Clientes',     Icon: Users      },
  { id: 'agenda',       label: 'Agenda',       Icon: Calendar   },
  { id: 'estadisticas', label: 'Estadísticas', Icon: BarChart2  },
  { id: 'reportes',     label: 'Reportes',     Icon: FileDown   },
  { id: 'configuracion',label: 'Profesionales', Icon: Briefcase  },
  { id: 'inventario',   label: 'Inventario',   Icon: Package    },
  { id: 'facturacion',  label: 'Facturación',  Icon: FileText   },
  { id: 'caja',         label: 'Caja',         Icon: Wallet     },
  { id: 'documentos',   label: 'Documentos',   Icon: FileText   },

]



export default function Sidebar({ current, onChange }: Props) {
  return (
    <nav className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-text">D-Uñas</div>
      </div>


      <div className="sidebar-nav">
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
      </div>

      <div className="sidebar-footer">
        4 sucursales activas
      </div>
    </nav>
  )
}
