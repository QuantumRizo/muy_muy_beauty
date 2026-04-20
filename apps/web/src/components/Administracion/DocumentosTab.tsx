import { useState, useEffect } from 'react'
import { FileText, Upload, Download, Trash2, RefreshCw, File } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { Documento } from '../../types/database'
import { useToast } from '../Common/Toast'

export default function DocumentosTab() {
  const [docs, setDocs] = useState<Documento[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const showToast = useToast()

  useEffect(() => {
    fetchDocs()
  }, [])

  const fetchDocs = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('documentos')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (!error && data) setDocs(data)
    setLoading(false)
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `empresa/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('documentos')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('documentos')
        .getPublicUrl(filePath)

      const { error: dbError } = await supabase
        .from('documentos')
        .insert({
          nombre: file.name,
          archivo_url: publicUrl,
          peso_bytes: file.size,
          tipo_mime: file.type
        })

      if (dbError) throw dbError
      
      showToast('Documento subido correctamente', 'success')
      fetchDocs()
    } catch (err: any) {
      showToast(err.message, 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (doc: Documento) => {
    if (!confirm('¿Eliminar este documento?')) return
    
    const { error } = await supabase.from('documentos').delete().eq('id', doc.id)
    if (!error) {
      setDocs(docs.filter(d => d.id !== doc.id))
      showToast('Documento eliminado', 'success')
    }
  }

  const fmtSize = (bytes: number) => {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  return (
    <div className="animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-1)' }}>Repositorio de Documentos</h2>
          <p style={{ fontSize: 13, color: 'var(--text-3)' }}>PDFs, manuales y archivos legales de la empresa.</p>
        </div>
        <label className="btn-primary" style={{ cursor: 'pointer' }}>
          {uploading ? <RefreshCw className="animate-spin" size={14} /> : <Upload size={14} />}
          {uploading ? 'Subiendo...' : 'Subir archivo'}
          <input type="file" hidden onChange={handleUpload} disabled={uploading} />
        </label>
      </div>

      {loading ? <p>Cargando archivos...</p> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {docs.length === 0 && <p style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px 0', color: 'var(--text-3)' }}>No hay documentos aún.</p>}
          {docs.map(doc => (
            <div key={doc.id} className="stats-card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-2)' }}>
                {doc.tipo_mime?.includes('pdf') ? <FileText size={20} /> : <File size={20} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={doc.nombre}>
                  {doc.nombre}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{fmtSize(doc.peso_bytes || 0)}</div>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <a href={doc.archivo_url} target="_blank" rel="noreferrer" className="btn-icon" title="Descargar">
                  <Download size={15} />
                </a>
                <button onClick={() => handleDelete(doc)} className="btn-icon" style={{ color: 'var(--danger)' }} title="Eliminar">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
