import { Calendar, Users, Briefcase, BarChart2, Home, Package, FileText } from 'lucide-react'

export type Section = 'inicio' | 'agenda' | 'clientes' | 'inventario' | 'documentos' | 'configuracion' | 'validacion' | 'cobro' | 'estadisticas'



interface Props {
  current: Section
  onChange: (s: Section) => void
}

const items = [
  { id: 'inicio'        as Section, label: 'Inicio',       Icon: Home       },
  { id: 'clientes'      as Section, label: 'Clientes',     Icon: Users      },
  { id: 'agenda'        as Section, label: 'Agenda',       Icon: Calendar   },
  { id: 'estadisticas'  as Section, label: 'Estadísticas', Icon: BarChart2  },
  { id: 'configuracion' as Section, label: 'Profesionales', Icon: Briefcase  },
  { id: 'inventario'    as Section, label: 'Inventario',   Icon: Package    },
  { id: 'documentos'    as Section, label: 'Documentos',   Icon: FileText   },
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
