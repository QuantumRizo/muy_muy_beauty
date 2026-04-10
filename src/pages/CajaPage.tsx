import { useState } from 'react'
import { Wallet, DollarSign, CreditCard, CheckCircle, TrendingDown, TrendingUp, Clock, AlertTriangle } from 'lucide-react'
import { useCajaActiva, useAbrirCaja, useCerrarCaja, useCrearMovimientoCaja } from '../hooks/useCaja'
import { useTodasEmpleadas } from '../hooks/useEmpleadas'
import { useSucursalContext } from '../context/SucursalContext'
import { useToast } from '../components/Common/Toast'
import KPICard from '../components/Dashboard/KPICard'


export default function CajaPage() {
  const { selectedSucursalId: activeSucursal } = useSucursalContext()
  const toast = useToast()

  const { data: cajaInfo, isLoading } = useCajaActiva(activeSucursal)
  const [montoApertura, setMontoApertura] = useState(0)
  const [empleadaAperturaId, setEmpleadaAperturaId] = useState('')
  const abrirCaja = useAbrirCaja()

  // ─── Modal Gasto ─────────────────────────────────────────────
  const [showGastoModal, setShowGastoModal] = useState(false)
  const [gastoMonto, setGastoMonto] = useState(0)
  const [gastoConcepto, setGastoConcepto] = useState('')
  const [gastoEmpleadaId, setGastoEmpleadaId] = useState('')

  // ─── Modal Ingreso Extra ──────────────────────────────────────
  const [showIngresoModal, setShowIngresoModal] = useState(false)
  const [ingresoMonto, setIngresoMonto] = useState(0)
  const [ingresoConcepto, setIngresoConcepto] = useState('')
  const [ingresoEmpleadaId, setIngresoEmpleadaId] = useState('')

  const crearMovimiento = useCrearMovimientoCaja()

  // ─── Modal Cierre ─────────────────────────────────────────────
  const [showCierreModal, setShowCierreModal] = useState(false)
  const [showCierreConfirmModal, setShowCierreConfirmModal] = useState(false)
  const [montoReal, setMontoReal] = useState(0)
  const [notasCierre, setNotasCierre] = useState('')
  const cerrarCaja = useCerrarCaja()

  const { data: empleadas = [] } = useTodasEmpleadas()

  const handleAbrirCaja = async () => {
    if (montoApertura < 0) { toast('Monto inválido', 'warning'); return }
    if (!activeSucursal) { toast('Selecciona una sucursal', 'warning'); return }
    try {
      await abrirCaja.mutateAsync({ 
        sucursalId: activeSucursal, 
        montoEfectivo: montoApertura,
        empleadaId: empleadaAperturaId || undefined
      })
      setMontoApertura(0)
      setEmpleadaAperturaId('')
    } catch (e) {
      console.error(e)
      toast('Error abriendo caja', 'error')
    }
  }

  const handleGuardarGasto = async () => {
    if (!gastoConcepto || gastoMonto <= 0) { toast('Faltan datos en el gasto', 'warning'); return }
    try {
      if (!cajaInfo?.turno.id) return
      await crearMovimiento.mutateAsync({
        turno_caja_id: cajaInfo.turno.id,
        tipo: 'Gasto / Salida',
        monto: gastoMonto,
        concepto: gastoConcepto,
        empleada_id: gastoEmpleadaId || null
      })
      setShowGastoModal(false)
      setGastoMonto(0)
      setGastoConcepto('')
      setGastoEmpleadaId('')
    } catch (e) {
      console.error(e)
      toast('Error al registrar movimiento', 'error')
    }
  }

  const handleGuardarIngreso = async () => {
    if (!ingresoConcepto || ingresoMonto <= 0) { toast('Faltan datos del ingreso', 'warning'); return }
    try {
      if (!cajaInfo?.turno.id) return
      await crearMovimiento.mutateAsync({
        turno_caja_id: cajaInfo.turno.id,
        tipo: 'Ingreso Extra',
        monto: ingresoMonto,
        concepto: ingresoConcepto,
        empleada_id: ingresoEmpleadaId || null
      })
      setShowIngresoModal(false)
      setIngresoMonto(0)
      setIngresoConcepto('')
      setIngresoEmpleadaId('')
    } catch (e) {
      console.error(e)
      toast('Error al registrar ingreso', 'error')
    }
  }

  const handleCerrarCaja = async () => {
    try {
      if (!cajaInfo?.turno.id) return
      await cerrarCaja.mutateAsync({
        turnoId: cajaInfo.turno.id,
        resumen: cajaInfo.resumen,
        montoReal: montoReal,
        notas: notasCierre
      })
      setShowCierreConfirmModal(false)
      setShowCierreModal(false)
      toast('Caja cerrada correctamente', 'success')
    } catch (e) {
      console.error(e)
      toast('Error al cerrar caja', 'error')
    }
  }

  if (isLoading) {
    return <div className="page-container p-6">Cargando datos de caja...</div>
  }

  // --- VISTA CAJA CERRADA ---
  if (!cajaInfo || !cajaInfo.turno) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        <div className="page-header" style={{ padding: '18px 24px 0', marginBottom: 15 }}>
          <div className="page-header-content">
            <h1 className="page-title" style={{ fontSize: '24px', margin: 0 }}>Caja</h1>
            <p className="page-subtitle" style={{ fontSize: '12px', marginTop: '2px' }}>Gestión de caja y turnos</p>
          </div>
        </div>

        <div className="page-content" style={{ padding: '0 24px 24px', overflowY: 'auto', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="dash-placeholder" style={{ maxWidth: 450, width: '100%', margin: '0 auto' }}>
            <div className="dash-icon-box" style={{ width: 64, height: 64, margin: '0 auto 20px', borderRadius: '50%', background: 'var(--accent-light)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wallet size={32} />
            </div>

            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, textAlign: 'center' }}>Caja Cerrada</h2>
            <p style={{ color: 'var(--text-3)', fontSize: 13, marginBottom: 30, lineHeight: 1.6, textAlign: 'center' }}>
              El turno está cerrado en esta sucursal. Abre la caja para declarar el efectivo base (fondo fijo) 
              con el que arrancan operaciones en mostrador el día de hoy.
            </p>

            <div style={{ padding: 24, background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)', width: '100%' }}>
              
              {/* Empleada que abre */}
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-1)', marginBottom: 6 }}>
                  ¿Quién abre la caja?
                </label>
                <select 
                  className="form-input" 
                  value={empleadaAperturaId}
                  onChange={e => setEmpleadaAperturaId(e.target.value)}
                  style={{ height: '40px' }}
                >
                  <option value="">— Seleccionar empleada —</option>
                  {empleadas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-1)', marginBottom: 6 }}>
                  Fondo inicial (Efectivo)
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 15, top: 11, color: 'var(--text-3)', fontSize: '16px', fontWeight: 600 }}>$</span>
                  <input 
                    type="number" 
                    className="form-input" 
                    style={{ paddingLeft: 32, height: 44, fontSize: 18, fontWeight: 700, color: 'var(--accent)' }}
                    value={montoApertura}
                    onChange={e => setMontoApertura(Number(e.target.value))}
                    min="0" step="10"
                  />
                </div>
              </div>
              
              <button 
                className="btn-primary" 
                style={{ width: '100%', padding: '14px', borderRadius: '12px', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                onClick={handleAbrirCaja}
                disabled={abrirCaja.isPending}
              >
                <CheckCircle size={18} /> 
                {abrirCaja.isPending ? 'Abriendo...' : 'Abrir Turno de Caja'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // --- VISTA CAJA ABIERTA ---
  const t = cajaInfo.resumen

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header (Standardized) */}
      <div className="page-header" style={{ padding: '18px 24px 0', marginBottom: 15 }}>
        <div className="page-header-content">
          <h1 className="page-title" style={{ fontSize: '24px', margin: 0 }}>Turno de Caja</h1>
          <p className="page-subtitle" style={{ fontSize: '11px', marginTop: '2px', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Clock size={12} /> Abierto desde {new Date(`${cajaInfo.turno.fecha_apertura}T${cajaInfo.turno.hora_apertura}`).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })} 
            {cajaInfo.turno.empleada_abre && ` — Abierto por: ${(cajaInfo.turno.empleada_abre as any).nombre}`}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

          <button className="btn-secondary" style={{ height: '34px', fontSize: '11px', padding: '0 12px' }} onClick={() => setShowIngresoModal(true)}>
            <TrendingUp size={14} /> Ingreso
          </button>
          <button className="btn-secondary" style={{ height: '34px', fontSize: '11px', padding: '0 12px' }} onClick={() => setShowGastoModal(true)}>
            <TrendingDown size={14} /> Gasto
          </button>
          <button className="btn-primary" style={{ height: '34px', fontSize: '11px', padding: '0 12px', background: 'var(--accent)', borderColor: 'var(--accent)' }} onClick={() => {
            setMontoReal(t.efectivoEsperado)
            setShowCierreModal(true)
          }}>
            <Wallet size={14} /> Cerrar Caja
          </button>
        </div>
      </div>

      <div className="page-content" style={{ padding: '0 24px 24px', overflowY: 'auto', flex: 1 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Dashboard Metrics Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
            <KPICard 
              title="Ventas Efectivo" 
              value={new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(t.ventasEfectivo)}
              Icon={DollarSign}
              subtitle={`+ Fondo: $${t.fondoInicial.toFixed(0)}`}
              variant="accent"
            />
            <KPICard 
              title="Tarjeta / Otros" 
              value={new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(t.ventasTarjeta + t.ventasOtros)}
              Icon={CreditCard}
              subtitle={`T: $${t.ventasTarjeta.toFixed(0)} | O: $${t.ventasOtros.toFixed(0)}`}
              variant="accent"
            />
            <KPICard 
              title="Ingresos Extra" 
              value={new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(t.ingresosExtra)}
              Icon={TrendingUp}
              subtitle="Entradas de ayer/hoy"
              variant={t.ingresosExtra > 0 ? "success" : "white"}
            />
            <KPICard 
              title="Gastos del Turno" 
              value={new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(t.gastos)}
              Icon={TrendingDown}
              subtitle="Salidas registradas"
              variant={t.gastos > 0 ? "white" : "white"}
            />
          </div>

          {/* EFECTIVO ESPERADO (CAJÓN) PREMIUM CARD */}
          <div className="card" style={{ 
            background: 'var(--surface)', 
            borderRadius: 20, 
            padding: '30px 40px', 
            border: 'none', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            boxShadow: 'var(--shadow-lg)', 
            borderTop: '4px solid var(--accent)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                 <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)' }} />
                 <h2 style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--text-3)', fontWeight: 800, margin: 0 }}>
                  Efectivo Esperado en Cajón
                </h2>
              </div>
              <div style={{ fontSize: 48, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-2px', lineHeight: 1.1 }}>
                {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(t.efectivoEsperado)}
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 12, fontWeight: 500, opacity: 0.8 }}>
                Fondo Inicial + Ventas Efectivo + Entradas Extra - Gastos
              </p>
            </div>
            
            <div style={{ 
              background: 'var(--accent-light)', 
              color: 'var(--accent)', 
              width: 80, height: 80, 
              borderRadius: '24px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              transform: 'rotate(10deg)'
            }}>
              <Wallet size={40} />
            </div>

            {/* Background Decoration */}
            <div style={{ position: 'absolute', right: -50, bottom: -50, width: 200, height: 200, borderRadius: '50%', background: 'var(--accent-light)', opacity: 0.3, pointerEvents: 'none' }} />
          </div>

        {/* Movimientos del turno */}
        {(cajaInfo.movimientos || []).length > 0 && (
          <div style={{ background: 'var(--surface)', borderRadius: 16, padding: '24px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Movimientos del turno
              </h3>
              <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500 }}>
                ÚLTIMOS REGISTROS
              </div>
            </div>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  <th style={{ padding: '12px 10px', textAlign: 'left', fontSize: 11, color: 'var(--text-2)', textTransform: 'uppercase' }}>Hora</th>
                  <th style={{ padding: '12px 10px', textAlign: 'left', fontSize: 11, color: 'var(--text-2)', textTransform: 'uppercase' }}>Tipo</th>
                  <th style={{ padding: '12px 10px', textAlign: 'left', fontSize: 11, color: 'var(--text-2)', textTransform: 'uppercase' }}>Concepto</th>
                  <th style={{ padding: '12px 10px', textAlign: 'left', fontSize: 11, color: 'var(--text-2)', textTransform: 'uppercase' }}>Profesional</th>
                  <th style={{ padding: '12px 10px', textAlign: 'right', fontSize: 11, color: 'var(--text-2)', textTransform: 'uppercase' }}>Monto</th>
                </tr>
              </thead>
              <tbody>
                {cajaInfo.movimientos.map((m: any) => (
                  <tr key={m.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} className="table-hover-row">
                    <td style={{ padding: '12px 10px', fontSize: 12, color: 'var(--text-2)', fontWeight: 500 }}>{m.hora?.substring(0, 5)}</td>
                    <td style={{ padding: '12px 10px' }}>
                      <span style={{ 
                        fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 20,
                        background: m.tipo === 'Gasto / Salida' ? 'var(--danger-bg)' : 'var(--success-bg)',
                        color: m.tipo === 'Gasto / Salida' ? 'var(--danger)' : 'var(--success)',
                        textTransform: 'uppercase'
                      }}>
                        {m.tipo === 'Gasto / Salida' ? 'Egreso' : 'Ingreso'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 10px', fontSize: 13, color: 'var(--text-1)' }}>{m.concepto}</td>
                    <td style={{ padding: '12px 10px', fontSize: 12, color: 'var(--text-2)' }}>{m.empleada?.nombre || '—'}</td>
                    <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: 700, fontSize: 14, color: m.tipo === 'Gasto / Salida' ? 'var(--danger)' : 'var(--success)' }}>
                      {m.tipo === 'Gasto / Salida' ? '-' : '+'}${Number(m.monto).toFixed(0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>


      {/* ─── MODALES ─────────────────────────────────────────────── */}

      {/* Modal Gasto */}
      {showGastoModal && (
        <div className="modal-overlay" onClick={() => setShowGastoModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Registrar Gasto (Salida de Efectivo)</h3>
            </div>
            <div className="modal-body p-5">
              <div className="form-group mb-4">
                <label>Concepto / Motivo</label>
                <input type="text" className="form-input" placeholder="Ej. Compra de material..." value={gastoConcepto} onChange={e => setGastoConcepto(e.target.value)} autoFocus />
              </div>
              <div className="form-group mb-4">
                <label>Monto extraído ($)</label>
                <input type="number" className="form-input" value={gastoMonto} onChange={e => setGastoMonto(Number(e.target.value))} min="0" step="10" />
              </div>
              <div className="form-group">
                <label>Empleada que retira (Opcional)</label>
                <select className="form-input" value={gastoEmpleadaId} onChange={e => setGastoEmpleadaId(e.target.value)}>
                  <option value="">-- Seleccionar --</option>
                  {empleadas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowGastoModal(false)}>Cancelar</button>
              <button className="btn-danger" onClick={handleGuardarGasto} disabled={crearMovimiento.isPending}>
                Registrar Gasto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ingreso Extra */}
      {showIngresoModal && (
        <div className="modal-overlay" onClick={() => setShowIngresoModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Registrar Ingreso Extra</h3>
            </div>
            <div className="modal-body p-5">
              <div className="form-group mb-4">
                <label>Concepto / Descripción</label>
                <input type="text" className="form-input" placeholder="Ej. Cambio de billete, depósito..." value={ingresoConcepto} onChange={e => setIngresoConcepto(e.target.value)} autoFocus />
              </div>
              <div className="form-group mb-4">
                <label>Monto ingresado ($)</label>
                <input type="number" className="form-input" value={ingresoMonto} onChange={e => setIngresoMonto(Number(e.target.value))} min="0" step="10" />
              </div>
              <div className="form-group">
                <label>Empleada responsable (Opcional)</label>
                <select className="form-input" value={ingresoEmpleadaId} onChange={e => setIngresoEmpleadaId(e.target.value)}>
                  <option value="">-- Seleccionar --</option>
                  {empleadas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowIngresoModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={handleGuardarIngreso} disabled={crearMovimiento.isPending}>
                <TrendingUp size={16} /> Registrar Ingreso
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cierre (Paso 1: ingresar monto) */}
      {showCierreModal && (
        <div className="modal-overlay" onClick={() => setShowCierreModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Cierre de Caja (Corte)</h3>
            </div>
            <div className="modal-body p-6" style={{ background: 'var(--bg)' }}>
              
              <div style={{ padding: 15, background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border)', marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-2)' }}>Fondo Inicial:</span>
                  <span style={{ fontWeight: 600 }}>${t.fondoInicial.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-2)' }}>Ventas Efectivo:</span>
                  <span style={{ fontWeight: 600 }}>${t.ventasEfectivo.toFixed(2)}</span>
                </div>
                {t.ingresosExtra > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-2)' }}>Ingresos Extra:</span>
                    <span style={{ fontWeight: 600, color: 'var(--success)' }}>+${t.ingresosExtra.toFixed(2)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-2)' }}>Gastos / Retiros:</span>
                  <span style={{ fontWeight: 600, color: 'var(--danger)' }}>-${t.gastos.toFixed(2)}</span>
                </div>
                <div style={{ borderTop: '1px solid var(--border)', margin: '10px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700, color: 'var(--accent)' }}>
                  <span>Efectivo Total Esperado:</span>
                  <span>${t.efectivoEsperado.toFixed(2)}</span>
                </div>
              </div>

              <div className="form-group mb-4">
                <label style={{ fontSize: 14, fontWeight: 600 }}>¿Cuánto efectivo real hay en caja?</label>
                <div style={{ position: 'relative', marginTop: 8 }}>
                  <span style={{ position: 'absolute', left: 15, top: 12, color: 'var(--text-3)', fontSize: 18 }}>$</span>
                  <input 
                    type="number" 
                    className="form-input" 
                    style={{ paddingLeft: 35, height: 50, fontSize: 24, fontWeight: 700, color: 'var(--text-1)' }}
                    value={montoReal} 
                    onChange={e => setMontoReal(Number(e.target.value))} 
                  />
                </div>
                {montoReal !== t.efectivoEsperado && (
                  <div style={{ marginTop: 8, fontSize: 12, color: montoReal > t.efectivoEsperado ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                    Diferencia de: ${(montoReal - t.efectivoEsperado).toFixed(2)} MXN
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Notas de Cierre (Opcional)</label>
                <textarea 
                  className="form-input" 
                  rows={2}
                  placeholder="Justificación de faltantes/sobrantes..." 
                  value={notasCierre} 
                  onChange={e => setNotasCierre(e.target.value)} 
                />
              </div>

            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowCierreModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={() => {
                setShowCierreModal(false)
                setShowCierreConfirmModal(true)
              }}>
                <Wallet size={16} /> Continuar → Confirmar Cierre
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cierre (Paso 2: Confirmación visual) */}
      {showCierreConfirmModal && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: 400 }}>
            <div className="modal-header" style={{ background: 'var(--danger-bg)', borderBottom: '1px solid var(--danger)' }}>
              <AlertTriangle size={20} color="var(--danger)" />
              <h3 className="modal-title" style={{ color: 'var(--danger)' }}>Confirmar Cierre de Caja</h3>
            </div>
            <div className="modal-body p-6">
              <p style={{ marginBottom: 20, fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6 }}>
                Estás a punto de cerrar el turno de caja. Esta acción <strong>no se puede revertir</strong>.
              </p>
              <div style={{ padding: 15, background: 'var(--surface-2)', borderRadius: 8, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>Efectivo esperado:</span>
                  <span style={{ fontWeight: 700 }}>${t.efectivoEsperado.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>Efectivo contado:</span>
                  <span style={{ fontWeight: 700 }}>${montoReal.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 15, color: montoReal >= t.efectivoEsperado ? 'var(--success)' : 'var(--danger)' }}>
                  <span>Diferencia:</span>
                  <span>{montoReal >= t.efectivoEsperado ? '+' : ''}{(montoReal - t.efectivoEsperado).toFixed(2)}</span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => {
                setShowCierreConfirmModal(false)
                setShowCierreModal(true)
              }}>← Volver</button>
              <button className="btn-danger" onClick={handleCerrarCaja} disabled={cerrarCaja.isPending}>
                {cerrarCaja.isPending ? 'Cerrando...' : 'Confirmar Cierre'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
