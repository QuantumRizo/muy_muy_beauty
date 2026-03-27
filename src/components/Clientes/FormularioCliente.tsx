import React, { useState } from 'react'
import { X, Save } from 'lucide-react'
import { useCrearCliente } from '../../hooks/useClientes'
import { useSucursales } from '../../hooks/useSucursales'
import type { Cliente, SexoType } from '../../types/database'

const PROCEDENCIAS = [
  'Banamex', 'Facebook', 'Instagram', 'Lufthansa', 'Recomendación',
  'Google', 'TikTok', 'Otro',
]

interface Props {
  onCreated: (cliente?: Cliente) => void
  onClose: () => void
}

export default function FormularioCliente({ onCreated, onClose }: Props) {
  const crearCliente = useCrearCliente()
  const { data: sucursales = [] } = useSucursales()
  const [form, setForm] = useState({
    nombre_completo: '',
    telefono_cel: '',
    email: '',
    rfc: '',
    procedencia: '',
    sexo: '' as SexoType | '',
    fecha_nacimiento: '',
    pais: 'México',
    notas: '',
    sucursal_id: '',
  })

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { nombre_completo, telefono_cel, email, ...extra } = form
    const payload = {
      nombre_completo,
      telefono_cel: telefono_cel || null,
      email: email || null,
      sucursal_id: form.sucursal_id || null,
      datos_extra: {
        rfc: extra.rfc || undefined,
        procedencia: extra.procedencia || undefined,
        sexo: (extra.sexo || undefined) as SexoType | undefined,
        fecha_nacimiento: extra.fecha_nacimiento || undefined,
        pais: extra.pais || undefined,
        notas: extra.notas || undefined,
      },
    }
    const result = await crearCliente.mutateAsync(payload)
    onCreated(result as Cliente)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Nuevo Cliente</h2>
          <button onClick={onClose} className="modal-close-btn"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="form-body">
          {/* ── Datos principales ───────────────────────── */}
          <div className="form-section-title">Datos principales</div>
          <div className="form-grid-2">
            <div className="form-group">
              <label>Nombre completo *</label>
              <input required value={form.nombre_completo} onChange={(e) => set('nombre_completo', e.target.value)} className="form-input" placeholder="Nombre y apellidos" />
            </div>
            <div className="form-group">
              <label>Teléfono celular</label>
              <input value={form.telefono_cel} onChange={(e) => set('telefono_cel', e.target.value)} className="form-input" placeholder="55 1234 5678" />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} className="form-input" placeholder="cliente@email.com" />
            </div>
            <div className="form-group">
              <label>RFC</label>
              <input value={form.rfc} onChange={(e) => set('rfc', e.target.value)} className="form-input" placeholder="AAAA000000XXX" />
            </div>
          </div>

          {/* ── Datos extra (JSONB) ─────────────────────── */}
          <div className="form-section-title mt-4">Información adicional</div>
          <div className="form-grid-2">
            <div className="form-group">
              <label>Procedencia</label>
              <select value={form.procedencia} onChange={(e) => set('procedencia', e.target.value)} className="form-input">
                <option value="">Seleccionar...</option>
                {PROCEDENCIAS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Sexo</label>
              <select value={form.sexo} onChange={(e) => set('sexo', e.target.value)} className="form-input">
                <option value="">Seleccionar...</option>
                <option value="Mujer">Mujer</option>
                <option value="Hombre">Hombre</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            <div className="form-group">
              <label>Fecha de nacimiento</label>
              <input type="date" value={form.fecha_nacimiento} onChange={(e) => set('fecha_nacimiento', e.target.value)} className="form-input" />
            </div>
            <div className="form-group">
              <label>País</label>
              <input value={form.pais} onChange={(e) => set('pais', e.target.value)} className="form-input" placeholder="México" />
            </div>
            <div className="form-group">
              <label>Sucursal de origen</label>
              <select value={form.sucursal_id} onChange={(e) => set('sucursal_id', e.target.value)} className="form-input">
                <option value="">Ninguna / Global</option>
                {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Notas</label>
            <textarea value={form.notas} onChange={(e) => set('notas', e.target.value)} className="form-input" rows={3} placeholder="Alergias, preferencias, etc." />
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-ghost">Cancelar</button>
            <button type="submit" disabled={crearCliente.isPending} className="btn-primary">
              <Save size={15} />
              {crearCliente.isPending ? 'Guardando...' : 'Guardar cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
