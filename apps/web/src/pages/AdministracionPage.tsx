import { useState } from 'react'
import { Shield, FolderOpen, Users } from 'lucide-react'
import StaffTab from '../components/Administracion/StaffTab'
import SeguridadTab from '../components/Administracion/SeguridadTab'
import DocumentosTab from '../components/Administracion/DocumentosTab'

type AdministracionTab = 'staff' | 'seguridad' | 'documentos'

export default function AdministracionPage() {
  const [activeTab, setActiveTab] = useState<AdministracionTab>('staff')

  const tabs: { id: AdministracionTab; label: string; Icon: any }[] = [
    { id: 'staff',     label: 'Sucursales y Staff', Icon: Users },
    { id: 'seguridad', label: 'Seguridad',      Icon: Shield },
    { id: 'documentos', label: 'Documentos',    Icon: FolderOpen },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div className="page-header" style={{ padding: '24px 24px 0', borderBottom: 'none' }}>
        <div className="page-header-content">
          <h1 className="page-title">Panel de Administración</h1>
          <p className="page-subtitle">Gestiona sucursales, personal, seguridad y documentación del estudio.</p>
        </div>

        {/* Tab Navigation */}
        <div className="admin-tabs-nav" style={{ display: 'flex', gap: 32, marginTop: 24, borderBottom: '1px solid var(--border)' }}>
          {tabs.map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`admin-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            >
              <tab.Icon size={17} /> {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="page-content" style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        <div className="animate-in">
          {activeTab === 'staff' && <StaffTab />}
          {activeTab === 'seguridad' && <SeguridadTab />}
          {activeTab === 'documentos' && <DocumentosTab />}
        </div>
      </div>

      <style>{`
        .admin-tab-btn {
          background: transparent;
          border: none;
          padding: 12px 4px;
          font-size: 14px;
          font-weight: 600;
          color: var(--text-3);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 10px;
          position: relative;
          transition: all 0.2s;
        }

        .admin-tab-btn:hover { color: var(--text-1); }
        .admin-tab-btn.active { color: var(--accent); }
        
        .admin-tab-btn.active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 3px;
          background: var(--accent);
          border-radius: 3px 3px 0 0;
        }

        .animate-in {
          animation: fadeIn 0.3s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
