import { Calendar, Users, Briefcase } from 'lucide-react'

export type Section = 'agenda' | 'clientes' | 'configuracion'

interface Props {
  current: Section
  onChange: (s: Section) => void
}

const items = [
  { id: 'agenda'        as Section, label: 'Agenda',       Icon: Calendar  },
  { id: 'clientes'      as Section, label: 'Clientes',     Icon: Users     },
  { id: 'configuracion' as Section, label: 'Profesionales', Icon: Briefcase },
]

export default function Sidebar({ current, onChange }: Props) {
  return (
    <nav className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-text">sistemaNails</div>
        <div className="sidebar-logo-sub">Gestión de citas</div>
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
