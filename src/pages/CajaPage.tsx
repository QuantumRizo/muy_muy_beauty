import { useState } from 'react'
import { Wallet, DollarSign, CreditCard, CheckCircle, TrendingDown, Clock } from 'lucide-react'
import { useCajaActiva, useAbrirCaja, useCerrarCaja, useCrearMovimientoCaja } from '../hooks/useCaja'
import { useTodasEmpleadas } from '../hooks/useEmpleadas'
import { useSucursales } from '../hooks/useSucursales'

export default function CajaPage() {
  const { data: sucursales = [] } = useSucursales()
  const [activeSucursal, setActiveSucursal] = useState<string>('')
  
  if (!activeSucursal && sucursales.length > 0) {
    setActiveSucursal(sucursales[0].id)
  }

  const { data: cajaInfo, isLoading } = useCajaActiva(activeSucursal)
  const [montoApertura, setMontoApertura] = useState(0)
  const abrirCaja = useAbrirCaja()

  const [showGastoModal, setShowGastoModal] = useState(false)
  const [gastoMonto, setGastoMonto] = useState(0)
  const [gastoConcepto, setGastoConcepto] = useState('')
  const [gastoEmpleadaId, setGastoEmpleadaId] = useState('')
  const crearMovimiento = useCrearMovimientoCaja()

  const [showCierreModal, setShowCierreModal] = useState(false)
  const [montoReal, setMontoReal] = useState(0)
  const [notasCierre, setNotasCierre] = useState('')
  const cerrarCaja = useCerrarCaja()

  const { data: empleadas = [] } = useTodasEmpleadas()

  const handleAbrirCaja = async () => {
    if (montoApertura < 0) return alert('Monto inválido')
    try {
      if (!activeSucursal) return alert('Selecciona una sucursal')
      await abrirCaja.mutateAsync({ sucursalId: activeSucursal, montoEfectivo: montoApertura })
      setMontoApertura(0)
    } catch (e) {
      console.error(e)
      alert("Error abriendo caja")
    }
  }

  const handleGuardarGasto = async () => {
    if (!gastoConcepto || gastoMonto <= 0) return alert('Faltan datos en el gasto')
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
    } catch (e) {
      console.error(e)
      alert("Error al registrar movimiento")
    }
  }

  const handleCerrarCaja = async () => {
    if (montoReal < 0) return alert('Por favor ingresa un monto válido')
    try {
      if (!cajaInfo?.turno.id) return
      
      const confirmacion = window.confirm(
        `Efectivo esperado: $${cajaInfo.resumen.efectivoEsperado.toFixed(2)}\nEfectivo contado: $${montoReal.toFixed(2)}\nDiferencia: $${(montoReal - cajaInfo.resumen.efectivoEsperado).toFixed(2)}\n\n¿Estás segura de cerrar la caja?`
      )

      if (!confirmacion) return

      await cerrarCaja.mutateAsync({
        turnoId: cajaInfo.turno.id,
        resumen: cajaInfo.resumen,
        montoReal: montoReal,
        notas: notasCierre
      })
      setShowCierreModal(false)
    } catch (e) {
      console.error(e)
      alert("Error al cerrar caja")
    }
  }

  if (isLoading) {
    return <div className="page-container p-6">Cargando datos de caja...</div>
  }

  // --- VISTA CAJA CERRADA ---
  if (!cajaInfo || !cajaInfo.turno) {
    return (
      <div className="page-container p-6 bg-gray-50 flex items-center justify-center">
        <div className="dash-placeholder" style={{ maxWidth: 450, width: '100%', marginTop: '10vh' }}>
          <div className="dash-icon-box" style={{ width: 64, height: 64, margin: '0 auto 20px', borderRadius: '50%' }}>
            <Wallet size={32} />
          </div>

          <div style={{ marginBottom: 20 }}>
             <select
               value={activeSucursal}
               onChange={(e) => setActiveSucursal(e.target.value)}
               className="form-input"
               style={{ textAlign: 'center', fontSize: 16, fontWeight: 600 }}
             >
               {sucursales.map((s) => (
                 <option key={s.id} value={s.id}>{s.nombre}</option>
               ))}
             </select>
          </div>

          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Caja Cerrada</h2>
          <p style={{ color: 'var(--text-3)', fontSize: 13, marginBottom: 30, lineHeight: 1.6 }}>
            El turno está cerrado en esta sucursal. Abre la caja para declarar el efectivo base (fondo fijo) 
            con el que arrancan operaciones en mostrador el día de hoy.
          </p>

          <div style={{ padding: 20, background: 'var(--surface-2)', borderRadius: 12, border: '1px solid var(--border-2)', width: '100%' }}>
            <label style={{ display: 'block', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>
              Fondo inicial (Efectivo)
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 15, top: 12, color: 'var(--text-3)' }}>$</span>
              <input 
                type="number" 
                className="form-input" 
                style={{ paddingLeft: 30, height: 44, fontSize: 18, fontWeight: 600 }}
                value={montoApertura}
                onChange={e => setMontoApertura(Number(e.target.value))}
                min="0" step="10"
              />
            </div>
            
            <button 
              className="btn-primary" 
              style={{ width: '100%', padding: '12px', marginTop: 15, fontSize: 14 }}
              onClick={handleAbrirCaja}
              disabled={abrirCaja.isPending}
            >
              <CheckCircle size={18} /> 
              {abrirCaja.isPending ? 'Abriendo...' : 'Abrir Turno'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // --- VISTA CAJA ABIERTA ---
  const t = cajaInfo.resumen

  return (
    <div className="page-container p-6" style={{ overflowY: 'auto', background: 'var(--bg)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginBottom: 10 }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.5px', margin: 0 }}>Turno de Caja</h1>
            <select
               value={activeSucursal}
               onChange={(e) => setActiveSucursal(e.target.value)}
               className="form-input"
               style={{ padding: '4px 30px 4px 10px', height: 32, fontSize: 13, minWidth: 150 }}
            >
               {sucursales.map((s) => (
                 <option key={s.id} value={s.id}>{s.nombre}</option>
               ))}
            </select>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Clock size={14} /> Abierto desde {new Date(`${cajaInfo.turno.fecha_apertura}T${cajaInfo.turno.hora_apertura}`).toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short' })}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-secondary" onClick={() => setShowGastoModal(true)}>
            <TrendingDown size={16} /> Registrar Gasto
          </button>
          <button className="btn-primary" onClick={() => {
            setMontoReal(t.efectivoEsperado) // auto set expected initially for ease
            setShowCierreModal(true)
          }}>
            <Wallet size={16} /> Cerrar Caja (Corte)
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 30 }}>
        {/* Metric 1 */}
        <div className="dash-card">
          <div className="dash-card-header">
            <span className="dash-card-title">Ventas Efectivo</span>
            <div className="dash-icon-box"><DollarSign size={18} /></div>
          </div>
          <div>
            <div className="dash-card-value">${t.ventasEfectivo.toFixed(2)}</div>
            <div className="dash-card-subvalue" style={{ marginTop: 4 }}>
              + Fondo Fijo de ${t.fondoInicial.toFixed(2)}
            </div>
          </div>
        </div>
        
        {/* Metric 2 */}
        <div className="dash-card">
          <div className="dash-card-header">
            <span className="dash-card-title">Ventas Tarjeta / Otros</span>
            <div className="dash-icon-box"><CreditCard size={18} /></div>
          </div>
          <div>
            <div className="dash-card-value">${(t.ventasTarjeta + t.ventasOtros).toFixed(2)}</div>
            <div className="dash-card-subvalue" style={{ marginTop: 4 }}>
              Tarjetas: ${t.ventasTarjeta.toFixed(2)} | Otros: ${t.ventasOtros.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="dash-card" style={{ borderColor: 'var(--danger)', background: 'var(--bg)' }}>
          <div className="dash-card-header">
            <span className="dash-card-title">Gastos del Turno</span>
            <div className="dash-icon-box" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}>
              <TrendingDown size={18} />
            </div>
          </div>
          <div>
            <div className="dash-card-value" style={{ color: 'var(--danger)' }}>-${t.gastos.toFixed(2)}</div>
            <div className="dash-card-subvalue" style={{ marginTop: 4, color: 'var(--text-3)' }}>
              Salidas en efectivo registradas
            </div>
          </div>
        </div>
      </div>

      {/* EFECTIVO ESPERADO (CAJÓN) */}
      <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 30, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', marginBottom: 30 }}>
        <div>
          <h2 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-3)', fontWeight: 700, marginBottom: 5 }}>
            Total Esperado en Cajón (Efectivo)
          </h2>
          <div style={{ fontSize: 42, fontWeight: 300, color: 'var(--accent)', letterSpacing: '-1px' }}>
            ${t.efectivoEsperado.toFixed(2)}
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 8 }}>
            (Fondo Inicial + Ventas Efectivo + Entradas Extra - Gastos)
          </p>
        </div>
        <div style={{ opacity: 0.1 }}><Wallet size={100} /></div>
      </div>


      {/* MODALES */}
      {showGastoModal && (
        <div className="modal-overlay" onClick={() => setShowGastoModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Registrar Gasto (Salida de Efectivo)</h3>
            </div>
            <div className="modal-body p-5">
              <div className="form-group mb-4">
                <label>Concepto / Motivo</label>
                <input type="text" className="form-input" placeholder="Ej. Compra de material..." value={gastoConcepto} onChange={e => setGastoConcepto(e.target.value)} />
              </div>
              <div className="form-group mb-4">
                <label>Monto extraído</label>
                <input type="number" className="form-input" value={gastoMonto} onChange={e => setGastoMonto(Number(e.target.value))} />
              </div>
              <div className="form-group">
                <label>Comprobante / Empleada que retira (Opcional)</label>
                <select className="form-input" value={gastoEmpleadaId} onChange={e => setGastoEmpleadaId(e.target.value)}>
                  <option value="">-- Seleccionar --</option>
                  {empleadas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowGastoModal(false)}>Cancelar</button>
              <button className="btn-danger" onClick={handleGuardarGasto} disabled={crearMovimiento.isPending}>
                Retirar Dinero
              </button>
            </div>
          </div>
        </div>
      )}

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
              <button className="btn-primary" onClick={handleCerrarCaja} disabled={cerrarCaja.isPending}>
                <Wallet size={16} /> Procesar Cierre
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
