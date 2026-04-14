import React, { useState } from 'react'
import { Plus, Trash2, Check, X, Calendar, CircleDollarSign, Building2 } from 'lucide-react'
import { useTodasEmpleadas } from '../hooks/useEmpleadas'
import { useSucursales } from '../hooks/useSucursales'
import { supabase } from '../lib/supabase'
import { useQueryClient } from '@tanstack/react-query'
import type { Empleada } from '../types/database'


interface EmpleadaForm {
  id?: string
  nombre: string
  fecha_contratacion: string
  sueldo_diario: string
  sucursal_id: string
}


export default function ProfesionalesPage() {
  const qc = useQueryClient()
  const { data: empleadas = [], isLoading } = useTodasEmpleadas()
  const { data: sucursales = [] } = useSucursales()

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<EmpleadaForm>({
    nombre: '',
    fecha_contratacion: new Date().toISOString().split('T')[0],
    sueldo_diario: '',
    sucursal_id: '',
  })

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingSucursal, setEditingSucursal] = useState<any | null>(null) // Para editar cabinas
  const [saving, setSaving] = useState(false)

  const handleUpdateSucursal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingSucursal) return
    setSaving(true)

    await supabase
      .from('sucursales')
      .update({ num_cabinas: parseInt(editingSucursal.num_cabinas) || 0 })
      .eq('id', editingSucursal.id)

    qc.invalidateQueries({ queryKey: ['sucursales'] })
    setEditingSucursal(null)
    setSaving(false)
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nombre.trim()) return
    setSaving(true)

    const payload = {
      nombre: form.nombre.trim(),
      fecha_contratacion: form.fecha_contratacion || null,
      sueldo_diario: parseFloat(form.sueldo_diario) || 0,
      sucursal_id: form.sucursal_id || null,
    }

    if (editingId) {
      await supabase.from('perfiles_empleadas').update(payload).eq('id', editingId)
    } else {
      await supabase.from('perfiles_empleadas').insert({ ...payload, activo: true })
    }

    qc.invalidateQueries({ queryKey: ['empleadas'] })
    resetForm()
    setShowForm(false)
    setSaving(false)
  }

  const startEdit = (emp: Empleada) => {
    setForm({
      id: emp.id,
      nombre: emp.nombre,
      fecha_contratacion: emp.fecha_contratacion || new Date().toISOString().split('T')[0],
      sueldo_diario: emp.sueldo_diario ? emp.sueldo_diario.toString() : '',
      sucursal_id: emp.sucursal_id || '',
    })
    setEditingId(emp.id)
    setShowForm(true)
  }

  const resetForm = () => {
    setForm({ nombre: '', fecha_contratacion: new Date().toISOString().split('T')[0], sueldo_diario: '', sucursal_id: '' })
    setEditingId(null)
  }

  const cancelForm = () => { setShowForm(false); resetForm() }

  const toggleActivo = async (emp: Empleada) => {
    await supabase.from('perfiles_empleadas').update({ activo: !emp.activo }).eq('id', emp.id)
    qc.invalidateQueries({ queryKey: ['empleadas'] })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar a este profesional? Esta acción no se puede deshacer.')) return
    await supabase.from('perfiles_empleadas').delete().eq('id', id)
    qc.invalidateQueries({ queryKey: ['empleadas'] })
  }

  // Group employees by sucursal
  const grouped = sucursales.map(s => ({
    sucursal: s,
    empleadas: empleadas.filter(e => e.sucursal_id === s.id),
  }))
  const sinSucursal = empleadas.filter(e => !e.sucursal_id)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Topbar */}
      <div className="page-header" style={{ padding: '24px 24px 0', marginBottom: 20 }}>
        <div className="page-header-content">
          <h1 className="page-title">Profesionales</h1>
          <p className="page-subtitle">Personal asignado por sucursal</p>
        </div>
        <div className="page-header-actions">
          <button onClick={() => setShowForm(true)} className="btn-primary">
            <Plus size={14} /> Agregar profesional
          </button>
        </div>
      </div>

      <div className="page-content" style={{ paddingBottom: 60 }}>
        {/* New / Edit form */}
        {showForm && (
          <div className="card" style={{ marginBottom: 24, border: '1px solid var(--accent-light)' }}>
            <div className="card-header">
              <span className="card-title">{editingId ? 'Editar profesional' : 'Agregar profesional'}</span>
              <button onClick={cancelForm} className="modal-close-btn"><X size={15} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="form-grid-3">
                <div className="form-group">
                  <label>Nombre completo</label>
                  <input
                    autoFocus
                    required
                    value={form.nombre}
                    onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                    className="form-input"
                    placeholder="Ej: Daniela Ugalde..."
                  />
                </div>

                <div className="form-group">
                  <label>Sucursal</label>
                  <select
                    className="form-input"
                    value={form.sucursal_id}
                    onChange={(e) => setForm((f) => ({ ...f, sucursal_id: e.target.value }))}
                    style={{ height: 38 }}
                  >
                    <option value="">Sin sucursal</option>
                    {sucursales.map(s => (
                      <option key={s.id} value={s.id}>{s.nombre}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Fecha de contratación</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Calendar size={18} style={{ position: 'absolute', left: 14, color: 'var(--text-3)', pointerEvents: 'none' }} />
                    <input
                      type="date"
                      value={form.fecha_contratacion}
                      onChange={(e) => setForm((f) => ({ ...f, fecha_contratacion: e.target.value }))}
                      onClick={(e) => e.currentTarget.showPicker?.()}
                      className="form-input"
                      style={{ paddingLeft: '42px', width: '100%', cursor: 'pointer' }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Sueldo diario</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <span style={{ position: 'absolute', left: 14, fontSize: '15px', fontWeight: 600, color: 'var(--text-3)', pointerEvents: 'none' }}>$</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={form.sueldo_diario || ''}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9.]/g, '')
                        setForm((f) => ({ ...f, sueldo_diario: val }))
                      }}
                      className="form-input"
                      placeholder="000.00"
                      style={{ paddingLeft: '42px', width: '100%' }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                <button type="button" onClick={cancelForm} className="btn-ghost">Cancelar</button>
                <button type="submit" disabled={saving} className="btn-primary" style={{ padding: '10px 24px' }}>
                  <Check size={14} /> {saving ? 'Guardando...' : 'Guardar profesional'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Grouped by Sucursal */}
        {isLoading ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-3)' }}>Cargando...</div>
        ) : (
          <>
            {grouped.map(({ sucursal, empleadas: emps }) => (
                <div key={sucursal.id} className="card" style={{ marginBottom: 20 }}>
                  <div className="card-header" style={{ background: 'var(--accent-light)', borderBottom: '1px solid var(--accent-mid)', padding: '10px 18px' }}>
                    <div style={{ display: 'flex', flex: 1, alignItems: 'center', gap: 12 }}>
                      <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                        <Building2 size={15} color="var(--accent)" />
                        {sucursal.nombre}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600 }}>
                        {emps.filter(e => e.activo).length} activas · {emps.length} total
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 11, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Calendar size={13} /> Cabinas extra: <strong>{sucursal.num_cabinas}</strong>
                      </span>
                      <button 
                        onClick={() => setEditingSucursal(sucursal)} 
                        className="btn-ghost" 
                        style={{ fontSize: 11, padding: '4px 8px', color: 'var(--accent)', fontWeight: 600 }}
                      >
                        Configurar
                      </button>
                    </div>
                  </div>
                  {emps.length === 0 ? (
                    <div style={{ padding: 16, textAlign: 'center', fontSize: 11, color: 'var(--text-3)' }}>
                      Sin profesionales asignadas
                    </div>
                  ) : (
                    emps.map((emp) => (
                      <EmpleadaRow
                        key={emp.id}
                        emp={emp}
                        onEdit={startEdit}
                        onToggle={toggleActivo}
                        onDelete={handleDelete}
                      />
                    ))
                  )}
                </div>
            ))}

            {/* Modal para editar Sucursal (Cabinas) */}
            {editingSucursal && (
              <div className="modal-overlay" onClick={() => setEditingSucursal(null)}>
                <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 360 }}>
                  <div className="modal-header">
                    <h2 className="modal-title">Configurar {editingSucursal.nombre}</h2>
                    <button onClick={() => setEditingSucursal(null)} className="btn-ghost"><X size={18} /></button>
                  </div>
                  <form onSubmit={handleUpdateSucursal} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="form-group">
                      <label>Cabinas Extra</label>
                      <p style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 8 }}>
                        Define cuántas columnas extra aparecerán en la agenda de esta sucursal.
                      </p>
                      <input 
                        type="number" 
                        min="0" 
                        max="10"
                        required
                        className="form-input" 
                        value={editingSucursal.num_cabinas}
                        onChange={e => setEditingSucursal({ ...editingSucursal, num_cabinas: e.target.value })}
                        style={{ fontSize: 16, fontWeight: 700, textAlign: 'center' }}
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
                      <button type="button" onClick={() => setEditingSucursal(null)} className="btn-ghost">Cancelar</button>
                      <button type="submit" disabled={saving} className="btn-primary">
                        {saving ? 'Guardando...' : 'Guardar Cambios'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Without sucursal */}
            {sinSucursal.length > 0 && (
              <div className="card" style={{ marginBottom: 20 }}>
                <div className="card-header">
                  <span className="card-title" style={{ color: 'var(--text-3)' }}>Sin sucursal asignada</span>
                  <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{sinSucursal.length} profesional(es)</span>
                </div>
                {sinSucursal.map((emp) => (
                  <EmpleadaRow
                    key={emp.id}
                    emp={emp}
                    onEdit={startEdit}
                    onToggle={toggleActivo}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}


function EmpleadaRow({
  emp,
  onEdit,
  onToggle,
  onDelete,
}: {
  emp: Empleada
  onEdit: (e: Empleada) => void
  onToggle: (e: Empleada) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="empleada-row">
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <span className="empleada-nombre">{emp.nombre}</span>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginTop: 4, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Calendar size={13} style={{ opacity: 0.7 }} />
            <span style={{ fontWeight: 500 }}>Contratación:</span>{' '}
            {emp.fecha_contratacion ? new Date(emp.fecha_contratacion).toLocaleDateString() : '---'}
          </span>
          <span style={{
            fontSize: 11,
            color: emp.sueldo_diario ? 'var(--accent)' : 'var(--text-3)',
            display: 'flex', alignItems: 'center', gap: 6,
            fontWeight: emp.sueldo_diario ? 600 : 400,
          }}>
            <CircleDollarSign size={13} style={{ opacity: emp.sueldo_diario ? 1 : 0.7 }} />
            <span style={{ fontWeight: 500 }}>Sueldo diario:</span>{' '}
            {emp.sueldo_diario ? `$${emp.sueldo_diario}` : '---'}
          </span>
        </div>
      </div>

      <span className={emp.activo ? 'badge-activa' : 'badge-inactiva'}>
        {emp.activo ? 'Activa' : 'Inactiva'}
      </span>
      <div style={{ display: 'flex', gap: 5 }}>
        <button onClick={() => onEdit(emp)} className="btn-secondary" style={{ padding: '4px 8px', fontSize: 11 }}>
          Editar
        </button>
        <button onClick={() => onToggle(emp)} className="toggle-btn">
          {emp.activo ? 'Desactivar' : 'Activar'}
        </button>
      </div>
      <button onClick={() => onDelete(emp.id)} className="btn-danger-ghost" style={{ padding: '3px 8px', fontSize: 11 }}>
        <Trash2 size={12} />
      </button>
    </div>
  )
}
