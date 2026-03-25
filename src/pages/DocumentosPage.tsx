import React, { useState, useRef } from 'react'
import { FileText, UploadCloud, Trash2, Download, File } from 'lucide-react'
import { useDocumentos, useSubirDocumento, useEliminarDocumento } from '../hooks/useDocumentos'
import { supabase } from '../lib/supabase'
import type { Documento } from '../types/database'

export default function DocumentosPage() {
  const { data: documentos = [], isLoading } = useDocumentos()
  const { mutateAsync: subirDoc, isPending: subiendo } = useSubirDocumento()
  const { mutateAsync: eliminarDoc, isPending: eliminando } = useEliminarDocumento()
  
  const [showForm, setShowForm] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0]
      setFile(selected)
      // Autocompleta el nombre sin la extensión
      const nameWithoutExt = selected.name.replace(/\.[^/.]+$/, "")
      setNombre(nameWithoutExt)
      setShowForm(true)
      // Reseteamos el input para que permita volver a seleccionar el mismo archivo si se cancela
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !nombre.trim()) return

    try {
      await subirDoc({ file, nombre: nombre.trim(), descripcion: descripcion.trim() })
      setShowForm(false)
      setFile(null)
      setNombre('')
      setDescripcion('')
    } catch (err: any) {
      alert(`Error subiendo documento: ${err.message}`)
    }
  }
  
  const handleCloseForm = () => {
    setShowForm(false)
    setFile(null)
    setNombre('')
    setDescripcion('')
  }
  
  const handleDownload = (doc: Documento) => {
    // Si usamos Storage de Supabase, getPublicUrl nos da un link válido
    const { data } = supabase.storage.from('documentos_empresa').getPublicUrl(doc.archivo_url)
    window.open(data.publicUrl, '_blank')
  }

  const handleDelete = async (doc: Documento) => {
    if (confirm(`¿Estás seguro de eliminar el documento "${doc.nombre}"? Esta acción no se puede deshacer.`)) {
      try {
        await eliminarDoc(doc)
      } catch (err: any) {
        alert(`Error eliminando documento: ${err.message}`)
      }
    }
  }

  // Utilidad para mostrar el peso en MB/KB
  const formatBytes = (bytes: number | null) => {
    if (!bytes) return 'N/A'
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      
      {/* Header unificado */}
      <div className="page-header" style={{ padding: '24px 24px 0', marginBottom: 24 }}>
        <div className="page-header-content">
          <h1 className="page-title">Documentos</h1>
          <p className="page-subtitle">Sube y gestiona archivos PDF, manuales de marca o recursos de la empresa</p>
        </div>
        <div className="page-header-actions">
           <input 
             type="file" 
             ref={fileInputRef} 
             style={{ display: 'none' }} 
             onChange={handleFileSelect}
           />
           <button onClick={handleUploadClick} className="btn-primary">
             <UploadCloud size={16} /> Subir archivo
           </button>
        </div>
      </div>

      {/* Grid de documentos */}
      <div className="page-content" style={{ padding: '0 24px 24px', overflowY: 'auto' }}>
        {isLoading ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-3)' }}>Cargando documentos...</div>
        ) : documentos.length === 0 ? (
          <div style={{ padding: 64, textAlign: 'center', color: 'var(--text-3)', background: 'var(--surface)', borderRadius: 12, border: '1px dashed var(--border-2)' }}>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center' }}>
              <FileText size={48} opacity={0.2} />
            </div>
            <div style={{ marginBottom: 8, fontSize: 16, fontWeight: 500, color: 'var(--text-2)' }}>
              No hay documentos todavía
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Usa el botón "Subir archivo" arriba a la derecha para almacenar tus PDFs aquí.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            {documentos.map(doc => (
              <div key={doc.id} style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.2s',
              }}>
                 <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: 8,
                      background: 'var(--bg)', color: 'var(--accent)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                      <File size={20} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={doc.nombre}>
                        {doc.nombre}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>
                        {formatBytes(doc.peso_bytes)} • {new Date(doc.created_at).toLocaleDateString()}
                      </div>
                    </div>
                 </div>
                 
                 {doc.descripcion && (
                   <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 16, flex: 1 }}>
                     {doc.descripcion}
                   </div>
                 )}

                 <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--border-2)' }}>
                    <button 
                      onClick={() => handleDownload(doc)}
                      className="btn-secondary" 
                      style={{ flex: 1, justifyContent: 'center' }}
                    >
                      <Download size={14} /> Abrir
                    </button>
                    <button 
                      onClick={() => handleDelete(doc)}
                      disabled={eliminando}
                      className="btn-secondary" 
                      style={{ color: 'var(--danger)', padding: '0 12px' }}
                      title="Eliminar archivo"
                    >
                      <Trash2 size={16} />
                    </button>
                 </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Editar Metadata */}
      {showForm && file && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <h2 className="modal-title">Subir Documento</h2>
              <button disabled={subiendo} onClick={handleCloseForm} className="modal-close-btn">×</button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: 'var(--bg)', borderRadius: 8 }}>
                <FileText size={24} color="var(--accent)" />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{formatBytes(file.size)}</div>
                </div>
              </div>

              <div className="form-group">
                <label>Nombre del documento <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input 
                  autoFocus
                  required
                  className="form-input"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  placeholder="Ej. Menú de Servicios 2024"
                />
              </div>

              <div className="form-group">
                <label>Descripción (opcional)</label>
                <textarea 
                  className="form-input"
                  rows={2}
                  value={descripcion}
                  onChange={e => setDescripcion(e.target.value)}
                  placeholder="Breve nota sobre el contenido del archivo..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
                <button type="button" onClick={handleCloseForm} disabled={subiendo} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" disabled={subiendo || !nombre.trim()} className="btn-primary">
                  {subiendo ? 'Subiendo archivo...' : 'Guardar y Subir'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
