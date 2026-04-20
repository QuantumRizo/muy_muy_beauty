import { useState } from 'react'
import { BarChart2, Receipt, ClipboardList } from 'lucide-react'
import VentasTab from '../components/Analisis/VentasTab'
import IndicadoresTab from '../components/Analisis/IndicadoresTab'
import DesempeñoTab from '../components/Analisis/DesempeñoTab'

type AnalisisTab = 'ventas' | 'indicadores' | 'desempeño'

export default function AnalisisPage() {
  const [activeTab, setActiveTab] = useState<AnalisisTab>('ventas')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header unificado */}
      <div className="page-header" style={{ padding: '24px 24px 0', borderBottom: 'none' }}>
        <div className="page-header-content">
          <h1 className="page-title">Centro de Análisis</h1>
          <p className="page-subtitle">Gestiona ventas, indicadores clave y desempeño del equipo en un solo lugar.</p>
        </div>

        {/* Tab Navigation (Main) */}
        <div className="analisis-tabs-nav" style={{ display: 'flex', gap: 32, marginTop: 24, borderBottom: '1px solid var(--border)' }}>
          <button 
            onClick={() => setActiveTab('ventas')}
            className={`analisis-tab-btn ${activeTab === 'ventas' ? 'active' : ''}`}
          >
            <Receipt size={17} /> Ventas y Cajas
          </button>
          <button 
            onClick={() => setActiveTab('indicadores')}
            className={`analisis-tab-btn ${activeTab === 'indicadores' ? 'active' : ''}`}
          >
            <BarChart2 size={17} /> Estadísticas y Reportes
          </button>
          <button 
            onClick={() => setActiveTab('desempeño')}
            className={`analisis-tab-btn ${activeTab === 'desempeño' ? 'active' : ''}`}
          >
            <ClipboardList size={17} /> Desempeño y Comisiones
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="page-content" style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        {activeTab === 'ventas' && <VentasTab />}
        {activeTab === 'indicadores' && <IndicadoresTab />}
        {activeTab === 'desempeño' && <DesempeñoTab />}
      </div>

      <style>{`
        .analisis-tab-btn {
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

        .analisis-tab-btn:hover { color: var(--text-1); }
        .analisis-tab-btn.active { color: var(--accent); }
        
        .analisis-tab-btn.active::after {
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
