import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Documento } from '../types/database'

export function useDocumentos() {
  return useQuery({
    queryKey: ['documentos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documentos')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as Documento[]
    },
  })
}

export function useSubirDocumento() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ file, nombre, descripcion }: { file: File, nombre: string, descripcion?: string }) => {
      // 1. Upload file to storage Bucket
      // Generamos un nombre único para evitar colisiones
      const ext = file.name.split('.').pop()
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`
      
      const { error: uploadError } = await supabase.storage
        .from('documentos_empresa')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // 2. Insert metadata into table for easy querying
      const { data, error: dbError } = await supabase
        .from('documentos')
        .insert({
          nombre: nombre.trim(),
          descripcion: descripcion?.trim() || null,
          archivo_url: fileName,
          peso_bytes: file.size,
          tipo_mime: file.type
        })
        .select()
        .single()

      if (dbError) {
        // En caso de que falle la base de datos, idealmente borraríamos de storage
        // await supabase.storage.from('documentos_empresa').remove([fileName])
        throw dbError
      }
      return data as Documento
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documentos'] })
    }
  })
}

export function useEliminarDocumento() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (doc: Documento) => {
      // 1. Delete actual file from Supabase Storage
      const { error: storageError } = await supabase.storage
        .from('documentos_empresa')
        .remove([doc.archivo_url])
        
      if (storageError) throw storageError
      
      // 2. Delete metadata from Postgres table
      const { error: dbError } = await supabase
        .from('documentos')
        .delete()
        .eq('id', doc.id)
        
      if (dbError) throw dbError
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documentos'] })
    }
  })
}
