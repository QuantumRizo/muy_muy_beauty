import { useState, useMemo } from 'react'
import { CheckSquare, Square, ChevronLeft, ChevronRight, FileCheck, User, Save, TrendingUp, AlertCircle } from 'lucide-react'
import { useEmpleadas } from '../hooks/useEmpleadas'
import { useEvaluacionesHoja, useGuardarEvaluacion, useComisionesHoja } from '../hooks/useHoja'
import { TABLA_COMISION } from '../lib/commissions'
import { useToast } from '../components/Common/Toast'

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

const fmt = (n: number) => n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function HojaPage() {
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* Header */}
      <div className="page-header" style={{ padding: '24px 24px 0', marginBottom: 16 }}>
        <div className="page-header-content">
          <h1 className="page-title">Evaluación de Hoja</h1>
          <p className="page-subtitle">
            Marca si cada profesional cumplió con sus metas del mes.
          </p>
        </div>

        <div className="page-header-actions" style={{ gap: 12, alignItems: 'center' }}>
          {/* Tabs */}
          <div style={{
            display: 'flex', background: 'var(--surface)', padding: 3,
            borderRadius: 10, border: '1px solid var(--border)'
          }}>
            <button onClick={() => setTab('evaluacion')} style={{
              padding: '5px 14px', borderRadius: 8, border: 'none', fontSize: 12, cursor: 'pointer',
              background: tab === 'evaluacion' ? 'var(--accent-light)' : 'transparent',
              color: tab === 'evaluacion' ? 'var(--accent)' : 'var(--text-2)',
              fontWeight: tab === 'evaluacion' ? 700 : 500, transition: 'all 0.15s'
            }}>Evaluación</button>
            <button onClick={() => setTab('comisiones')} style={{
              padding: '5px 14px', borderRadius: 8, border: 'none', fontSize: 12, cursor: 'pointer',
              background: tab === 'comisiones' ? 'var(--accent-light)' : 'transparent',
              color: tab === 'comisiones' ? 'var(--accent)' : 'var(--text-2)',
              fontWeight: tab === 'comisiones' ? 700 : 500, transition: 'all 0.15s'
            }}>Comisiones</button>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              borderRadius: 10, padding: '3px 6px', height: 38
            }}>
              <button className="btn-icon" onClick={prevMes} style={{ width: 26, height: 26 }}>
                <ChevronLeft size={14} />
              </button>
              <span style={{ fontSize: 13, fontWeight: 700, minWidth: 110, textAlign: 'center' }}>
                {MESES[mes - 1]} {anio}
              </span>
              <button className="btn-icon" onClick={nextMes} style={{ width: 26, height: 26 }}
                disabled={mes === now.getMonth() + 1 && anio === now.getFullYear()}>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {tab === 'evaluacion' && dirty && (
            <button className="btn-primary" onClick={handleGuardar} disabled={guardar.isPending} style={{ height: 38, padding: '0 20px', borderRadius: 10 }}>
              <Save size={15} /> {guardar.isPending ? '...' : 'Guardar'}
            </button>
          )}
        </div>
      </div>

      {/* ──────────────── TAB: EVALUACIÓN ──────────────── */}
      {tab === 'evaluacion' && (
        <>
          {/* KPIs */}
          <div style={{ padding: '0 24px 20px', display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: 'var(--surface)', padding: '10px 20px',
              borderRadius: 'var(--radius-md)', border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ color: 'var(--accent)', background: 'var(--accent-light)', padding: 8, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileCheck size={18} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-1)' }}>{cumplieronCount}</span>
                <span style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Con hoja</span>
              </div>
            </div>

            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: 'var(--surface)', padding: '10px 20px',
              borderRadius: 'var(--radius-md)', border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ color: 'var(--text-2)', background: 'var(--surface-2)', padding: 8, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={18} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-1)' }}>{empleadas.length - cumplieronCount}</span>
                <span style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sin hoja</span>
              </div>
            </div>

            <div style={{
              marginLeft: 'auto', fontSize: 11, color: 'var(--text-3)', fontWeight: 700,
              background: 'var(--surface-2)', padding: '6px 14px', borderRadius: 20,
              border: '1px solid var(--border)', textTransform: 'uppercase', letterSpacing: '0.5px'
            }}>
              Total: {empleadas.length} profesionales
            </div>
          </div>

          {/* Lista */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 24px' }}>
            {isLoading ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>Cargando...</div>
            ) : empleadas.length === 0 ? (
              <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-3)' }}>No hay profesionales registradas.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {empleadas.map(emp => {
                  const cumplió = getCumplió(emp.id)
                  const notas = getNotas(emp.id)
                  return (
                    <div key={emp.id} style={{
                      display: 'flex', alignItems: 'center', gap: 16,
                      padding: '16px 20px',
                      background: cumplió ? 'var(--success-bg)' : 'var(--surface)',
                      border: `1px solid ${cumplió ? 'var(--success)' : 'var(--border)'}`,
                      borderRadius: 12, transition: 'all 0.2s'
                    }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                        background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 18, fontWeight: 700, color: 'var(--accent)'
                      }}>
                        {(emp as any).foto_url
                          ? <img src={(emp as any).foto_url} alt={emp.nombre} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                          : emp.nombre.charAt(0).toUpperCase()
                        }
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-1)' }}>{emp.nombre}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{(emp as any).puesto || 'Profesional'}</div>
                      </div>

                      <input
                        type="text"
                        placeholder="Notas (opcional)..."
                        className="form-input"
                        style={{ maxWidth: 260, height: 34, fontSize: 12 }}
                        value={notas}
                        onChange={e => setNotasMap(prev => ({ ...prev, [emp.id]: e.target.value }))}
                      />

                      <button
                        onClick={() => toggle(emp.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
                          background: cumplió ? 'var(--success)' : 'var(--surface-2)',
                          color: cumplió ? '#fff' : 'var(--text-2)',
                          fontWeight: 700, fontSize: 13, transition: 'all 0.2s',
                          minWidth: 140, justifyContent: 'center'
                        }}
                      >
                        {cumplió ? <><CheckSquare size={17} /> Cumplió hoja</> : <><Square size={17} /> Sin hoja</>}
                      </button>
                    </div>
                  )
                })}
              </div>
            )}

            {dirty && (
              <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn-primary" onClick={handleGuardar} disabled={guardar.isPending} style={{ padding: '12px 28px' }}>
                  <Save size={16} /> {guardar.isPending ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* ──────────────── TAB: COMISIONES ──────────────── */}
      {tab === 'comisiones' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 24px' }}>

          {/* KPI total */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: 'var(--surface)', padding: '10px 20px',
              borderRadius: 'var(--radius-md)', border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ color: 'var(--accent)', background: 'var(--accent-light)', padding: 8, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={18} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-1)' }}>${fmt(totalComisiones)}</span>
                <span style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total comisiones del mes</span>
              </div>
            </div>

            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: 'var(--surface)', padding: '10px 20px',
              borderRadius: 'var(--radius-md)', border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ color: 'var(--text-2)', background: 'var(--surface-2)', padding: 8, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={18} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-1)' }}>{comisiones.length}</span>
                <span style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Profesionales con ventas</span>
              </div>
            </div>
          </div>

          {/* Nota aclaratoria */}
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            background: 'var(--accent-light)', border: '1px solid var(--accent-mid)',
            borderRadius: 'var(--radius-md)', padding: '10px 16px', marginBottom: 20, fontSize: 12, color: 'var(--text-2)'
          }}>
            <AlertCircle size={16} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 1 }} />
            <span>
              El <strong>tramo</strong> se determina por las ventas totales con IVA del mes. La comisión se calcula sobre la base <strong>sin IVA</strong> (÷ 1.16).
              El porcentaje depende de si la profesional <strong>cumplió su hoja</strong> ese mes.
            </span>
          </div>

          {loadingComisiones ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>Calculando comisiones...</div>
          ) : comisiones.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-3)' }}>
              No hay ventas registradas para {MESES[mes - 1]} {anio}.
            </div>
          ) : (
            <>
              {/* Tabla */}
              <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden' }}>
                {/* Encabezado tabla */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr 80px 1fr 1fr',
                  padding: '10px 20px',
                  background: 'var(--surface-2)',
                  borderBottom: '1px solid var(--border)',
                  fontSize: 10, fontWeight: 700, color: 'var(--text-3)',
                  textTransform: 'uppercase', letterSpacing: '0.5px'
                }}>
                  <span>Profesional</span>
                  <span style={{ textAlign: 'right' }}>Ventas (c/IVA)</span>
                  <span style={{ textAlign: 'right' }}>Base (s/IVA)</span>
                  <span style={{ textAlign: 'center' }}>Tramo</span>
                  <span style={{ textAlign: 'center' }}>% Aplicado</span>
                  <span style={{ textAlign: 'right' }}>Comisión</span>
                </div>

                {comisiones.map((c, i) => (
                  <div key={c.empleada_id} style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr 80px 1fr 1fr',
                    padding: '14px 20px',
                    borderBottom: i < comisiones.length - 1 ? '1px solid var(--border)' : 'none',
                    alignItems: 'center',
                    background: i % 2 === 0 ? 'var(--surface)' : 'var(--surface-2)'
                  }}>
                    {/* Nombre + hoja */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: '50%', background: 'var(--surface-2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, fontWeight: 700, color: 'var(--accent)', flexShrink: 0,
                        border: '1px solid var(--border)'
                      }}>
                        {c.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-1)' }}>{c.nombre}</div>
                        <div style={{
                          fontSize: 10, fontWeight: 700,
                          color: c.cumplioHoja ? 'var(--success)' : 'var(--text-3)',
                          display: 'flex', alignItems: 'center', gap: 3
                        }}>
                          {c.cumplioHoja ? <><FileCheck size={10} /> Con hoja</> : '· Sin hoja'}
                        </div>
                      </div>
                    </div>

                    {/* Ventas con IVA */}
                    <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 500, color: 'var(--text-1)' }}>
                      ${fmt(c.totalConIva)}
                    </div>

                    {/* Base sin IVA */}
                    <div style={{ textAlign: 'right', fontSize: 13, color: 'var(--text-2)' }}>
                      ${fmt(c.totalSinIva)}
                    </div>

                    {/* Tramo */}
                    <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-2)', fontWeight: 500 }}>
                      {c.tramoStr}
                    </div>

                    {/* % */}
                    <div style={{ textAlign: 'center' }}>
                      {c.porcentaje === 0 ? (
                        <span style={{ fontSize: 11, color: 'var(--text-3)', fontStyle: 'italic' }}>Sin tramo</span>
                      ) : (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          background: 'var(--accent-light)', color: 'var(--accent)',
                          borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 800
                        }}>
                          {c.porcentaje}%
                        </span>
                      )}
                    </div>

                    {/* Comisión final */}
                    <div style={{ textAlign: 'right', fontSize: 14, fontWeight: 800, color: c.comision > 0 ? 'var(--success)' : 'var(--text-3)' }}>
                      ${fmt(c.comision)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Tabla de referencia */}
              <details style={{ marginTop: 24 }}>
                <summary style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', cursor: 'pointer', marginBottom: 12 }}>
                  Ver tabla de comisiones de referencia
                </summary>
                <div style={{
                  background: 'var(--surface)', borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)', overflow: 'hidden', maxWidth: 400
                }}>
                  <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
                    padding: '8px 16px', background: 'var(--surface-2)',
                    borderBottom: '1px solid var(--border)',
                    fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase'
                  }}>
                    <span>Ventas c/IVA</span>
                    <span style={{ textAlign: 'center' }}>Con hoja</span>
                    <span style={{ textAlign: 'center' }}>Sin hoja</span>
                  </div>
                  {TABLA_COMISION.map((t, i) => (
                    <div key={t.umbral} style={{
                      display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
                      padding: '6px 16px', fontSize: 12,
                      borderBottom: i < TABLA_COMISION.length - 1 ? '1px solid var(--border)' : 'none',
                      background: i % 2 === 0 ? 'var(--surface)' : 'var(--surface-2)'
                    }}>
                      <span style={{ fontWeight: 600 }}>${t.umbral.toLocaleString('es-MX')}</span>
                      <span style={{ textAlign: 'center', color: 'var(--success)', fontWeight: 700 }}>{t.conHoja}%</span>
                      <span style={{ textAlign: 'center', color: 'var(--text-2)' }}>{t.sinHoja}%</span>
                    </div>
                  ))}
                </div>
              </details>
            </>
          )}
        </div>
      )}
    </div>
  )
}
