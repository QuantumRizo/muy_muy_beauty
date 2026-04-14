import React, { useState } from 'react'
import { Plus, Check, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useQueryClient } from '@tanstack/react-query'
import type { Producto } from '../../types/database'
import { useToast } from '../Common/Toast'

interface Props {
  productoBase?: Producto | null
  onClose: () => void
}

export default function FormularioProducto({ productoBase, onClose }: Props) {
  const qc = useQueryClient()
  const [saving, setSaving] = useState(false)
  const toast = useToast()
  
  const [form, setForm] = useState({
    nombre: productoBase?.nombre || '',
    sku: productoBase?.sku || '',
    precio_costo: productoBase?.precio_costo?.toString() || '0',
    precio: productoBase?.precio?.toString() || '',
    stock: productoBase?.stock?.toString() || '0',
    descripcion: productoBase?.descripcion || '',
    activo: productoBase ? productoBase.activo : true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nombre.trim() || !form.precio) return
    setSaving(true)

    const payload = {
      nombre: form.nombre.trim(),
      sku: form.sku.trim() || null,
      precio_costo: parseFloat(form.precio_costo) || 0,
      precio: parseFloat(form.precio) || 0,
      stock: parseInt(form.stock, 10) || 0,
      descripcion: form.descripcion.trim() || null,
      activo: form.activo
    }

    try {
      if (productoBase) {
        const { error } = await supabase
          .from('productos')
          .update(payload)
          .eq('id', productoBase.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('productos')
          .insert(payload)
        if (error) throw error
      }

      qc.invalidateQueries({ queryKey: ['productos'] })
      onClose()
    } catch (err: any) {
      toast(`Error al guardar: ${err.message}`, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="modal-header">
          <h2 className="modal-title">{productoBase ? 'Editar producto' : 'Nuevo producto'}</h2>
          <button onClick={onClose} className="modal-close-btn"><X size={16} /></button>
        </div>
        
        <form onSubmit={handleSubmit} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          <div className="form-group">
            <label>Nombre del producto <span style={{ color: 'var(--danger)' }}>*</span></label>
            <input 
              autoFocus
              required
              className="form-input"
              value={form.nombre}
              onChange={e => setForm({...form, nombre: e.target.value})}
              placeholder="Ej. Kit de uñas acrílicas, Esmalte OPI..."
            />
          </div>

          <div className="form-group">
            <label>SKU / Código</label>
            <input 
              className="form-input"
              value={form.sku}
              onChange={e => setForm({...form, sku: e.target.value})}
              placeholder="Ej. OP1-BLK-12"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label>Precio de Costo ($)</label>
              <input 
                type="number"
                step="0.01"
                min="0"
                className="form-input"
                value={form.precio_costo}
                onChange={e => setForm({...form, precio_costo: e.target.value})}
                placeholder="0.00"
              />
            </div>
            
            <div className="form-group">
              <label>Precio de Venta ($) <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input 
                required
                type="number"
                step="0.01"
                min="0"
                className="form-input"
                value={form.precio}
                onChange={e => setForm({...form, precio: e.target.value})}
                placeholder="0.00"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'end' }}>
            <div className="form-group">
              <label>Stock Disponible <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input 
                required
                type="number"
                min="0"
                className="form-input"
                value={form.stock}
                onChange={e => setForm({...form, stock: e.target.value})}
              />
            </div>

            {productoBase && (
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', height: 42 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', margin: 0, fontWeight: 500 }}>
                  <input 
                    type="checkbox"
                    checked={form.activo}
                    onChange={e => setForm({...form, activo: e.target.checked})}
                    style={{ width: 16, height: 16 }}
                  />
                  Producto activo
                </label>
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Descripción detallada</label>
            <textarea 
              className="form-input"
              rows={3}
              value={form.descripcion}
              onChange={e => setForm({...form, descripcion: e.target.value})}
              placeholder="Anota ingredientes, medidas, marca u observaciones sobre el producto..."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Guardando...' : (productoBase ? <><Check size={16}/> Guardar cambios</> : <><Plus size={16}/> Registrar producto</>)}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
