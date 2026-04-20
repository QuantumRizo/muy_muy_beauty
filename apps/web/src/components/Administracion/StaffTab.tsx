import React, { useState } from 'react'
import { 
  Trash2, X, Building2, MapPin, Phone, ShieldCheck, 
  UserPlus, Sliders, Edit3, Calendar, CircleDollarSign, CheckCircle2 
} from 'lucide-react'
import { useTodasEmpleadas } from '../../hooks/useEmpleadas'
import { useSucursales } from '../../hooks/useSucursales'
import { supabase } from '../../lib/supabase'
import { useQueryClient } from '@tanstack/react-query'
import type { Empleada } from '../../types/database'

interface EmpleadaForm {
  id?: string
  nombre: string
  fecha_contratacion: string
  sueldo_diario: string
  sucursal_id: string
}

export default function StaffTab() {
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
  const [editingSucursal, setEditingSucursal] = useState<any | null>(null)
  const [saving, setSaving] = useState(false)

  const handleUpdateSucursal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingSucursal) return
    setSaving(true)

    await supabase
      .from('sucursales')
      .update({ 
        num_cabinas: parseInt(editingSucursal.num_cabinas) || 0,
        rfc: editingSucursal.rfc || '',
        direccion: editingSucursal.direccion || '',
        telefono: editingSucursal.telefono || ''
      })
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
    if (!confirm('¿Eliminar a este profesional?')) return
    await supabase.from('perfiles_empleadas').delete().eq('id', id)
    qc.invalidateQueries({ queryKey: ['empleadas'] })
  }

  const grouped = sucursales.map(s => ({
    sucursal: s,
    empleadas: empleadas.filter(e => e.sucursal_id === s.id),
  }))

  return (
    <div className="animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>Sucursales y Staff</h2>
          <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Configuración técnica de sedes y gestión de personal.</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary" style={{ height: 42, padding: '0 20px', fontSize: 14 }}>
          <UserPlus size={16} /> Agregar Profesional
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 32, border: '1px solid var(--accent-light)', boxShadow: 'var(--shadow-lg)' }}>
          <div className="card-header" style={{ borderBottom: '1px solid var(--border)' }}>
            <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {editingId ? <Edit3 size={16} /> : <UserPlus size={16} />}
              {editingId ? 'Editar profesional' : 'Agregar profesional'}
            </span>
            <button onClick={cancelForm} className="btn-icon"><X size={15} /></button>
          </div>
          <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div className="form-grid-3">
              <div className="form-group">
                <label className="stats-section-label">Nombre completo</label>
                <input autoFocus required value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} className="form-input" placeholder="Nombre completo" />
              </div>
              <div className="form-group">
                <label className="stats-section-label">Sucursal asignada</label>
                <select className="form-input" value={form.sucursal_id} onChange={(e) => setForm((f) => ({ ...f, sucursal_id: e.target.value }))}>
                  <option value="">Sin sucursal</option>
                  {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="stats-section-label">Fecha contratación</label>
                <input type="date" value={form.fecha_contratacion} onChange={(e) => setForm((f) => ({ ...f, fecha_contratacion: e.target.value }))} className="form-input" />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, borderTop: '1px solid var(--border)', paddingTop: 20 }}>
              <button type="button" onClick={cancelForm} className="btn-ghost">Cancelar</button>
              <button type="submit" disabled={saving} className="btn-primary" style={{ minWidth: 140 }}>
                {saving ? 'Guardando...' : 'Guardar Datos'}
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>Cargando información...</div>
      ) : grouped.map(({ sucursal, empleadas: emps }) => (
        <div key={sucursal.id} className="stats-card" style={{ marginBottom: 32, padding: 0, overflow: 'hidden' }}>
          {/* Sucursal Header Info (THE BIG TABLE) */}
          <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                  <Building2 size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-1)', margin: 0 }}>{sucursal.nombre}</h3>
                </div>
              </div>
            </div>
          </div>

          {/* Sub-table with Sucursal Details */}
          <div style={{ padding: '0 24px 24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
              <div 
                onClick={() => setEditingSucursal(sucursal)}
                className="branch-detail-card-active"
                style={{ cursor: 'pointer', background: 'var(--surface)', padding: '12px 16px', borderRadius: 10, border: '1px solid var(--border)', transition: 'all 0.2s' }}
              >
                <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>
                  <ShieldCheck size={12} /> RFC Sucursal
                </label>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>{sucursal.rfc || '---'}</div>
              </div>
              <div 
                onClick={() => setEditingSucursal(sucursal)}
                className="branch-detail-card-active"
                style={{ cursor: 'pointer', background: 'var(--surface)', padding: '12px 16px', borderRadius: 10, border: '1px solid var(--border)', transition: 'all 0.2s' }}
              >
                <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>
                  <MapPin size={12} /> Dirección
                </label>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={sucursal.direccion || ''}>
                  {sucursal.direccion || '---'}
                </div>
              </div>
              <div 
                onClick={() => setEditingSucursal(sucursal)}
                className="branch-detail-card-active"
                style={{ cursor: 'pointer', background: 'var(--surface)', padding: '12px 16px', borderRadius: 10, border: '1px solid var(--border)', transition: 'all 0.2s' }}
              >
                <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>
                  <Phone size={12} /> Teléfono
                </label>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>{sucursal.telefono || '---'}</div>
              </div>
              <div 
                onClick={() => setEditingSucursal(sucursal)}
                className="branch-detail-card-active"
                style={{ cursor: 'pointer', padding: '12px 16px', borderRadius: 10, border: '1px solid var(--accent)', background: 'var(--accent-light)', transition: 'all 0.2s' }}
              >
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: 'var(--accent)', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4, cursor: 'pointer' }}>
                  <Sliders size={12} /> Cabinas Extra
                </label>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--accent)' }}>{sucursal.num_cabinas} <span style={{ fontSize: 11, fontWeight: 500 }}>disponibles</span></div>
              </div>
            </div>
          </div>

          {/* Employee Table */}
          <div style={{ padding: '0 12px' }}>
            {emps.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13, fontStyle: 'italic' }}>
                No hay profesionales asignados a esta sucursal.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={{ textAlign: 'left', padding: '16px 12px', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase' }}>Profesional</th>
                    <th style={{ textAlign: 'left', padding: '16px 12px', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase' }}>Contratación</th>
                    <th style={{ textAlign: 'left', padding: '16px 12px', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase' }}>Sueldo Diario</th>
                    <th style={{ textAlign: 'center', padding: '16px 12px', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase' }}>Estado</th>
                    <th style={{ textAlign: 'right', padding: '16px 12px', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {emps.map(emp => (
                    <tr key={emp.id} style={{ borderBottom: '1px solid var(--surface-2)', transition: 'background 0.2s' }} className="hover-row">
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: 'var(--text-2)' }}>
                            {emp.nombre.charAt(0)}
                          </div>
                          <span style={{ fontWeight: 700, color: 'var(--text-1)', fontSize: 14 }}>{emp.nombre}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px', fontSize: 13, color: 'var(--text-2)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Calendar size={13} style={{ color: 'var(--text-3)' }} />
                          {emp.fecha_contratacion ? new Date(emp.fecha_contratacion).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : '---'}
                        </div>
                      </td>
                      <td style={{ padding: '12px', fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <CircleDollarSign size={13} style={{ color: 'var(--success)' }} />
                          {emp.sueldo_diario ? `$${emp.sueldo_diario}` : '---'}
                        </div>
                      </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span style={{ 
                          padding: '4px 10px', borderRadius: 20, fontSize: 10, fontWeight: 800, 
                          background: emp.activo ? 'var(--success-bg)' : 'var(--surface-2)', 
                          color: emp.activo ? 'var(--success)' : 'var(--text-3)',
                          border: `1px solid ${emp.activo ? 'var(--success)' : 'var(--border)'}`
                        }}>
                          {emp.activo ? 'ACTIVA' : 'INACTIVA'}
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button onClick={() => startEdit(emp)} className="btn-icon-sm" title="Editar"><Edit3 size={14} /></button>
                          <button onClick={() => toggleActivo(emp)} className={`btn-icon-sm ${emp.activo ? '' : 'active'}`} title={emp.activo ? 'Desactivar' : 'Activar'}>
                            {emp.activo ? <X size={14} /> : <CheckCircle2 size={14} />}
                          </button>
                          <button onClick={() => handleDelete(emp.id)} className="btn-icon-sm danger" title="Eliminar"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ))}

      {editingSucursal && (
        <div className="modal-overlay" onClick={() => setEditingSucursal(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <h2 className="modal-title">Configuración de Sucursal - {editingSucursal.nombre}</h2>
              <button onClick={() => setEditingSucursal(null)} className="btn-ghost"><X size={18} /></button>
            </div>
            <form onSubmit={handleUpdateSucursal} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="stats-section-label">RFC de la Sucursal</label>
                  <input className="form-input" value={editingSucursal.rfc || ''} onChange={e => setEditingSucursal({ ...editingSucursal, rfc: e.target.value })} placeholder="RFC o ID Fiscal" />
                </div>
                <div className="form-group">
                  <label className="stats-section-label">Teléfono</label>
                  <input className="form-input" value={editingSucursal.telefono || ''} onChange={e => setEditingSucursal({ ...editingSucursal, telefono: e.target.value })} placeholder="Teléfono de contacto" />
                </div>
              </div>

              <div className="form-group">
                <label className="stats-section-label">Dirección Física</label>
                <input className="form-input" value={editingSucursal.direccion || ''} onChange={e => setEditingSucursal({ ...editingSucursal, direccion: e.target.value })} placeholder="Dirección completa" />
              </div>

              <div className="form-group" style={{ background: 'var(--accent-light)', padding: 16, borderRadius: 12, border: '1px solid var(--accent)' }}>
                <label className="stats-section-label" style={{ color: 'var(--accent)', fontWeight: 800 }}>Capacidad de Agenda</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8 }}>
                  <input 
                    type="number" 
                    min="0"
                    max="10"
                    className="form-input" 
                    value={editingSucursal.num_cabinas} 
                    onChange={e => setEditingSucursal({ ...editingSucursal, num_cabinas: e.target.value })} 
                    style={{ fontSize: 24, textAlign: 'center', fontWeight: 800, height: 64, width: 80, borderColor: 'var(--accent)' }} 
                  />
                  <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.4 }}>
                    <strong>Cabinas Extra:</strong> Define cuántas columnas adicionales aparecerán en la agenda para esta sede específica.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button type="button" onClick={() => setEditingSucursal(null)} className="btn-ghost" style={{ flex: 1 }}>Cancelar</button>
                <button type="submit" disabled={saving} className="btn-primary" style={{ flex: 1 }}>
                  {saving ? 'Guardando...' : 'Actualizar Sucursal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .btn-icon-sm {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          border: 1px solid var(--border);
          background: var(--surface);
          color: var(--text-2);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-icon-sm:hover { background: var(--surface-2); color: var(--accent); border-color: var(--accent); }
        .btn-icon-sm.danger:hover { background: var(--danger-bg); color: var(--danger); border-color: var(--danger); }
        
        .hover-row:hover { background: var(--surface-2) !important; }

        .branch-detail-card-active:hover {
          background: var(--accent) !important;
          border-color: var(--accent-dark) !important;
          box-shadow: var(--shadow-md);
          transform: translateY(-2px);
        }
        .branch-detail-card-active:hover label,
        .branch-detail-card-active:hover div,
        .branch-detail-card-active:hover span {
          color: white !important;
        }
      `}</style>
    </div>
  )
}
