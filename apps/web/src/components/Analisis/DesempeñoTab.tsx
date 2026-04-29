import { useState, useMemo } from 'react'
import { CheckSquare, Square, ChevronLeft, ChevronRight, FileCheck, User, Save, TrendingUp, AlertCircle } from 'lucide-react'
import { useEmpleadas } from '../../hooks/useEmpleadas'
import { useEvaluacionesHoja, useGuardarEvaluacion, useComisionesHoja } from '../../hooks/useHoja'

import { useToast } from '../Common/Toast'

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

const fmt = (n: number) => n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function DesempeñoTab() {
  const toast = useToast()
  const now = new Date()

  const [tab, setTab] = useState<'evaluacion' | 'comisiones'>('evaluacion')
  const [mes, setMes] = useState(now.getMonth() + 1)
  const [anio, setAnio] = useState(now.getFullYear())

  const { data: empleadas = [] } = useEmpleadas()
  const { data: evaluaciones = [], isLoading } = useEvaluacionesHoja(mes, anio)
  const { data: comisiones = [], isLoading: loadingComisiones } = useComisionesHoja(mes, anio)
  const guardar = useGuardarEvaluacion()

  const [overrides, setOverrides] = useState<Record<string, boolean>>({})
  const [notasMap, setNotasMap] = useState<Record<string, string>>({})

  const getCumplió = (empId: string): boolean => {
    if (empId in overrides) return overrides[empId]
    const ev = evaluaciones.find((e: any) => e.empleada_id === empId)
    return ev?.cumplio_hoja ?? false
  }

  const getNotas = (empId: string): string => {
    if (empId in notasMap) return notasMap[empId]
    const ev = evaluaciones.find((e: any) => e.empleada_id === empId)
    return ev?.notas ?? ''
  }

  const toggle = (empId: string) => {
    setOverrides(prev => ({ ...prev, [empId]: !getCumplió(empId) }))
  }

  const dirty = useMemo(() => {
    return Object.keys(overrides).length > 0 || Object.keys(notasMap).length > 0
  }, [overrides, notasMap])

  const handleGuardar = async () => {
    const empleadasConCambio = new Set([...Object.keys(overrides), ...Object.keys(notasMap)])
    try {
      for (const empId of empleadasConCambio) {
        await guardar.mutateAsync({
          empleada_id: empId,
          sucursal_id: null as any,
          mes, anio,
          cumplio_hoja: getCumplió(empId),
          notas: getNotas(empId) || undefined
        })
      }
      setOverrides({})
      setNotasMap({})
      toast('Evaluaciones guardadas correctamente', 'success')
    } catch (e) {
      console.error(e)
      toast('Error al guardar', 'error')
    }
  }

  const prevMes = () => {
    if (mes === 1) { setMes(12); setAnio(a => a - 1) }
    else setMes(m => m - 1)
    setOverrides({})
    setNotasMap({})
  }

  const nextMes = () => {
    if (mes === 12) { setMes(1); setAnio(a => a + 1) }
    else setMes(m => m + 1)
    setOverrides({})
    setNotasMap({})
  }

  const cumplieronCount = empleadas.filter(e => getCumplió(e.id)).length
  const totalComisiones = comisiones.reduce((s, c) => s + c.comision, 0)

  return (
    <div className="animate-in">
        {/* Sub-header with month selector and mini-tabs */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', background: 'var(--surface)', padding: 3, borderRadius: 10, border: '1px solid var(--border)' }}>
            <button onClick={() => setTab('evaluacion')} className={`tab-item-sub ${tab === 'evaluacion' ? 'active' : ''}`} style={{ padding: '4px 12px', fontSize: 12 }}>Evaluación</button>
            <button onClick={() => setTab('comisiones')} className={`tab-item-sub ${tab === 'comisiones' ? 'active' : ''}`} style={{ padding: '4px 12px', fontSize: 12 }}>Comisiones</button>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, padding: '3px 6px' }}>
              <button className="btn-icon" onClick={prevMes} style={{ width: 26, height: 26 }}><ChevronLeft size={14} /></button>
              <span style={{ fontSize: 13, fontWeight: 700, minWidth: 110, textAlign: 'center' }}>{MESES[mes - 1]} {anio}</span>
              <button className="btn-icon" onClick={nextMes} style={{ width: 26, height: 26 }} disabled={mes === now.getMonth() + 1 && anio === now.getFullYear()}><ChevronRight size={14} /></button>
            </div>
            {tab === 'evaluacion' && dirty && (
              <button className="btn-primary" onClick={handleGuardar} disabled={guardar.isPending} style={{ height: 34, padding: '0 16px', borderRadius: 10 }}>
                <Save size={15} /> Guardar
              </button>
            )}
          </div>
        </div>

        {tab === 'evaluacion' ? (
          <>
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              <div className="mini-card-stat">
                <div className="icon-wrap"><FileCheck size={18} /></div>
                <div className="text-wrap">
                  <span className="value">{cumplieronCount}</span>
                  <span className="label">Con hoja</span>
                </div>
              </div>
              <div className="mini-card-stat">
                <div className="icon-wrap gray"><User size={18} /></div>
                <div className="text-wrap">
                  <span className="value">{empleadas.length - cumplieronCount}</span>
                  <span className="label">Sin hoja</span>
                </div>
              </div>
            </div>

            <div className="evaluation-list">
              {isLoading ? (
                <p className="loading-text">Cargando profesionales...</p>
              ) : (
                empleadas.map(emp => {
                  const cumplió = getCumplió(emp.id)
                  return (
                    <div key={emp.id} className={`eval-row ${cumplió ? 'success' : ''}`}>
                      <div className="avatar-sm">{emp.nombre.charAt(0)}</div>
                      <div className="info">
                        <div className="name">{emp.nombre}</div>
                        <div className="role">{(emp as any).puesto || 'Profesional'}</div>
                      </div>
                      <input
                        type="text"
                        placeholder="Notas (opcional)..."
                        className="form-input"
                        style={{ maxWidth: 260, height: 34, fontSize: 12 }}
                        value={getNotas(emp.id)}
                        onChange={e => setNotasMap(prev => ({ ...prev, [emp.id]: e.target.value }))}
                      />
                      <button onClick={() => toggle(emp.id)} className={`btn-status ${cumplió ? 'active' : ''}`}>
                        {cumplió ? <><CheckSquare size={16} /> Cumplió</> : <><Square size={16} /> Sin hoja</>}
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          </>
        ) : (
          <div className="comisiones-list">
             <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'stretch' }}>
               <div className="mini-card-stat" style={{ flex: 1, marginBottom: 0 }}>
                  <div className="icon-wrap"><TrendingUp size={18} /></div>
                  <div className="text-wrap">
                    <span className="value">${fmt(totalComisiones)}</span>
                    <span className="label">Total Comisiones del Mes</span>
                  </div>
                </div>
             </div>

              <div className="alert-info">
                <AlertCircle size={16} />
                <span>Base sin IVA (÷ 1.16). El % depende de si cumplió hoja.</span>
              </div>

              {loadingComisiones ? <p>Calculando...</p> : (
                <div className="comisiones-table-wrap">
                   <table className="data-table">
                     <thead>
                       <tr>
                         <th>Profesional</th>
                         <th style={{ textAlign: 'right' }}>Ventas</th>
                         <th style={{ textAlign: 'center' }}>%</th>
                         <th style={{ textAlign: 'right' }}>Comisión</th>
                       </tr>
                     </thead>
                     <tbody>
                       {comisiones.map(c => (
                         <tr key={c.empleada_id}>
                           <td>
                             <div style={{ fontWeight: 600 }}>{c.nombre}</div>
                             <div style={{ fontSize: 10, color: c.cumplioHoja ? 'var(--success)' : 'var(--text-3)' }}>
                               {c.cumplioHoja ? '✓ Con hoja' : '✗ Sin hoja'}
                             </div>
                           </td>
                           <td style={{ textAlign: 'right' }}>${fmt(c.totalConIva)}</td>
                           <td style={{ textAlign: 'center' }}>
                             <span className="porcentaje-pill">{c.porcentaje}%</span>
                           </td>
                           <td style={{ textAlign: 'right', fontWeight: 800 }}>${fmt(c.comision)}</td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                </div>
              )}
          </div>
        )}

      <style>{`
        .mini-card-stat {
          display: flex;
          align-items: center;
          gap: 12px;
          background: var(--surface);
          padding: 10px 20px;
          border-radius: 12px;
          border: 1px solid var(--border);
          box-shadow: var(--shadow-sm);
        }
        .icon-wrap { color: var(--accent); background: var(--accent-light); padding: 8px; border-radius: 10px; display: flex; }
        .icon-wrap.gray { color: var(--text-3); background: var(--surface-2); }
        .text-wrap { display: flex; flex-direction: column; line-height: 1.2; }
        .value { fontSize: 16px; fontWeight: 800; color: var(--text-1); }
        .label { fontSize: 10px; color: var(--text-3); fontWeight: 700; text-transform: uppercase; letter-spacing: 0.5px; }

        .eval-row {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 12px 16px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          margin-bottom: 8px;
          transition: all 0.2s;
        }
        .eval-row.success { background: var(--success-bg); border-color: var(--success); }
        .avatar-sm { width: 36px; height: 36px; border-radius: 50%; background: var(--surface-2); display: flex; align-items: center; justify-content: center; font-weight: 700; color: var(--accent); }
        .info { flex: 1; }
        .name { font-weight: 700; font-size: 13px; }
        .role { font-size: 11px; color: var(--text-3); }
        
        .btn-status {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          background: var(--surface-2);
          color: var(--text-2);
          font-weight: 700;
          font-size: 12px;
          min-width: 120px;
          justify-content: center;
        }
        .btn-status.active { background: var(--success); color: #fff; }

        .alert-info {
          display: flex;
          align-items: center;
          gap: 10px;
          background: var(--accent-light);
          padding: 10px 16px;
          border-radius: 10px;
          margin-bottom: 16px;
          font-size: 12px;
          color: var(--text-2);
        }
        .porcentaje-pill { background: var(--accent-light); color: var(--accent); padding: 2px 8px; border-radius: 12px; font-weight: 800; font-size: 11px; }

        .tab-item-sub { background: transparent; border: none; cursor: pointer; transition: all 0.2s; }
        .tab-item-sub.active { background: var(--accent-light); color: var(--accent); fontWeight: 700; }
      `}</style>
    </div>
  )
}
