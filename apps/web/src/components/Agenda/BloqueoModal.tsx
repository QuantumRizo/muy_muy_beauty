import { useState, useMemo } from 'react'
import { X } from 'lucide-react'
import { format } from 'date-fns'
import { useCrearBloqueos } from '../../hooks/useCitas'
import type { Empleada } from '../../types/database'
import DatePicker from '../Common/DatePicker'
import { useToast } from '../Common/Toast'

interface Props {
  empleadas: Empleada[]
  onClose: () => void
}

const DIAS_SEMANA = [
  { label: 'L', value: 1 },
  { label: 'M', value: 2 },
  { label: 'M', value: 3 },
  { label: 'J', value: 4 },
  { label: 'V', value: 5 },
  { label: 'S', value: 6 },
  { label: 'D', value: 0 },
]

export default function BloqueoModal({ empleadas, onClose }: Props) {
  const [fecha, setFecha] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [horaInicio, setHoraInicio] = useState('09:00')
  const [horaFin, setHoraFin] = useState('10:00')
  const [selectedEmpleadas, setSelectedEmpleadas] = useState<string[]>([])
  const [repeticion, setRepeticion] = useState(false)
  const [diasRepeticion, setDiasRepeticion] = useState<number[]>([])
  const [fechaHasta, setFechaHasta] = useState('')
  const [motivo, setMotivo] = useState('')

  const crearBloqueos = useCrearBloqueos()
  const toast = useToast()

  const handleToggleEmpleada = (id: string) => {
    setSelectedEmpleadas((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const handleToggleAllEmpleadas = () => {
    if (selectedEmpleadas.length === empleadas.length) {
      setSelectedEmpleadas([])
    } else {
      setSelectedEmpleadas(empleadas.map((e) => e.id))
    }
  }

  const handleToggleDia = (dia: number) => {
    setDiasRepeticion((prev) =>
      prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia]
    )
  }

  const handleToggleAllDias = () => {
    if (diasRepeticion.length === 7) {
      setDiasRepeticion([])
    } else {
      setDiasRepeticion([1, 2, 3, 4, 5, 6, 0])
    }
  }

  const handleSave = async () => {
    if (selectedEmpleadas.length === 0) {
      toast('Por favor selecciona al menos un profesional', 'warning')
      return
    }
    if (repeticion && diasRepeticion.length === 0) {
      toast('Selecciona al menos un día de repetición', 'warning')
      return
    }

    const bloqueos: any[] = []

    // Parsear sin zona horaria: igual que las citas
    const parseLocal = (str: string) => {
      const [y, m, d] = str.split('-').map(Number)
      return new Date(y, m - 1, d)
    }

    const start = parseLocal(fecha)

    // Si hay repetición sin fecha límite → 1 año desde el inicio
    let end: Date
    if (repeticion) {
      if (fechaHasta) {
        end = parseLocal(fechaHasta)
      } else {
        end = parseLocal(fecha)
        end.setFullYear(end.getFullYear() + 1)
      }
    } else {
      end = start
    }

    let current = parseLocal(fecha)
    while (current <= end) {
      const dayNum = current.getDay() // correcto: usa hora local

      if (!repeticion || diasRepeticion.includes(dayNum)) {
        const fechaStr = [
          current.getFullYear(),
          String(current.getMonth() + 1).padStart(2, '0'),
          String(current.getDate()).padStart(2, '0')
        ].join('-')
        selectedEmpleadas.forEach((empId) => {
          bloqueos.push({
            empleada_id: empId,
            fecha: fechaStr,
            hora_inicio: horaInicio + ':00',
            hora_fin: horaFin + ':00',
            motivo: motivo || 'Bloqueo'
          })
        })
      }
      current.setDate(current.getDate() + 1)
      if (!repeticion) break
    }

    if (bloqueos.length === 0) {
      toast('No se generaron bloqueos. Verifica los días seleccionados.', 'warning')
      return
    }

    try {
      await crearBloqueos.mutateAsync(bloqueos)
      toast(`${bloqueos.length} bloqueo(s) creado(s) correctamente`, 'success')
      onClose()
    } catch (err) {
      console.error(err)
      toast('Error al crear bloqueos', 'error')
    }
  }

  // Helper to generate time options every 15 mins
  const timeOptions = useMemo(() => {
    const times = []
    for (let h = 8; h <= 21; h++) {
      for (let m = 0; m < 60; m += 15) {
        const hh = h.toString().padStart(2, '0')
        const mm = m.toString().padStart(2, '0')
        times.push(`${hh}:${mm}`)
      }
    }
    return times
  }, [])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box bloqueos-modal animate-in" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Bloquear agenda</h2>
          <button onClick={onClose} className="btn-icon">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Fecha y Horas */}
          <div className="bloqueo-row" style={{ marginTop: 8 }}>
            <DatePicker 
              label="Fecha"
              value={fecha}
              onChange={setFecha}
            />
            <div className="outlined-group">
              <label>Hora Inicio</label>
              <select 
                className="outlined-select"
                value={horaInicio}
                onChange={e => setHoraInicio(e.target.value)}
              >
                {timeOptions.map((t: string) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="outlined-group">
              <label>Hora Fin</label>
              <select 
                className="outlined-select"
                value={horaFin}
                onChange={e => setHoraFin(e.target.value)}
              >
                {timeOptions.map((t: string) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Empleadas (Cabinas) */}
          <div className="bloqueo-section">
            <label className="section-label">Cabinas</label>
            <div className="cabinas-grid">
              {empleadas.map((emp) => (
                <label key={emp.id} className="custom-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedEmpleadas.includes(emp.id)}
                    onChange={() => handleToggleEmpleada(emp.id)}
                  />
                  <div className="checkmark"></div>
                  <span>{emp.nombre.split(' ')[0]}</span>
                </label>
              ))}
            </div>
            <div className="all-cabinas" style={{ marginTop: 12, paddingTop: 12 }}>
              <label className="custom-checkbox">
                <input
                  type="checkbox"
                  checked={selectedEmpleadas.length === empleadas.length && empleadas.length > 0}
                  onChange={handleToggleAllEmpleadas}
                />
                <div className="checkmark"></div>
                <span style={{ fontWeight: 600 }}>(Todas las cabinas)</span>
              </label>
            </div>
          </div>

          {/* Repetición */}
          <div className="bloqueo-section">
            <label className="section-label">Repetición</label>
            <label className="custom-checkbox" style={{ marginBottom: 12 }}>
              <input
                type="checkbox"
                checked={repeticion}
                onChange={(e) => setRepeticion(e.target.checked)}
              />
              <div className="checkmark"></div>
              <span style={{ fontSize: 13, fontWeight: 500 }}>Activar repetición semanal</span>
            </label>

            {repeticion && (
              <div className="repetition-box animate-in">
                <div className="days-row">
                  {DIAS_SEMANA.map((d) => (
                    <label key={d.value} className="day-checkbox custom-checkbox">
                      <span>{d.label}</span>
                      <input
                        type="checkbox"
                        checked={diasRepeticion.includes(d.value)}
                        onChange={() => handleToggleDia(d.value)}
                      />
                      <div className="checkmark"></div>
                    </label>
                  ))}
                  <label className="custom-checkbox" style={{ marginLeft: 16 }}>
                    <input
                      type="checkbox"
                      checked={diasRepeticion.length === 7}
                      onChange={handleToggleAllDias}
                    />
                    <div className="checkmark"></div>
                    <span style={{ fontSize: 11 }}>(Todos)</span>
                  </label>
                </div>
                <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <DatePicker 
                    label="Hasta (opcional)"
                    value={fechaHasta}
                    onChange={setFechaHasta}
                    minDate={fecha}
                  />
                  <div style={{ fontSize: 11, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    {fechaHasta
                      ? `Repite hasta el ${fechaHasta}`
                      : '⚠️ Sin fecha límite: se crearán bloqueos por 1 año'}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Descripción */}
          <div className="outlined-group" style={{ marginTop: 12 }}>
            <label>Descripción / Motivo</label>
            <textarea
              placeholder="Ej: Almuerzo, Capacitación..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={2}
              className="outlined-input"
              style={{ minHeight: '80px', paddingTop: '12px' }}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary">Cancelar</button>
          <button 
            onClick={handleSave} 
            className="btn-primary"
            disabled={crearBloqueos.isPending}
          >
            {crearBloqueos.isPending ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}
