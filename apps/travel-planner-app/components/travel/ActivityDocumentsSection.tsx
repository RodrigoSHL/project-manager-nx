'use client'

import { useEffect, useState } from 'react'
import { Download, FileText, Loader2, Paperclip, Trash2, X } from 'lucide-react'
import { ActivityDocument, ActivityDocumentType, deleteActivityDocument, downloadActivityDocument, listActivityDocuments } from '@/services/activityDocumentService'

export interface StagedActivityDocument { file: File; documentType: ActivityDocumentType }

const labels: Record<ActivityDocumentType, string> = { 'reservation-receipt': 'Comprobante de reserva', other: 'Otro documento' }
const accept = '.pdf,.doc,.docx,.xls,.xlsx,.txt'

export function ActivityDocumentsSection({ activityId, staged, onStagedChange, disabled }: { activityId?: string; staged: StagedActivityDocument[]; onStagedChange: (files: StagedActivityDocument[]) => void; disabled: boolean }) {
  const [documents, setDocuments] = useState<ActivityDocument[]>([])
  const [documentType, setDocumentType] = useState<ActivityDocumentType>('reservation-receipt')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setDocuments([]); setError('')
    if (!activityId) return
    setLoading(true)
    listActivityDocuments(activityId).then(items => { if (!cancelled) setDocuments(items) }).catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : 'No fue posible cargar los documentos') }).finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [activityId])

  async function remove(item: ActivityDocument) {
    if (!confirm(`¿Eliminar “${item.originalName}”?`)) return
    setLoading(true); setError('')
    try { await deleteActivityDocument(item.id); setDocuments(current => current.filter(document => document.id !== item.id)) }
    catch (err) { setError(err instanceof Error ? err.message : 'No fue posible eliminar el documento') }
    finally { setLoading(false) }
  }

  return <section className="rounded-xl border border-border p-4">
    <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div><h3 className="text-sm font-semibold">Documentos</h3><p className="text-xs text-muted-foreground">Comprobantes u otros archivos PDF, Word, Excel o texto; máximo 10 MB.</p></div>
      <div className="flex items-center gap-2">
        <select value={documentType} disabled={disabled} onChange={event => setDocumentType(event.target.value as ActivityDocumentType)} className="min-w-0 rounded-lg border bg-background px-2 py-2 text-xs">
          {Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <label className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted">
          <Paperclip className="h-4 w-4" /> Adjuntar
          <input className="sr-only" type="file" multiple accept={accept} disabled={disabled} onChange={event => {
            const selected = Array.from(event.target.files ?? []).filter(file => file.size <= 10 * 1024 * 1024).map(file => ({ file, documentType }))
            onStagedChange([...staged, ...selected]); event.target.value = ''
          }} />
        </label>
      </div>
    </div>
    {error && <p className="mb-3 rounded-lg bg-red-50 p-2 text-xs text-red-700">{error}</p>}
    {loading && <div className="flex items-center gap-2 py-3 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Procesando documentos…</div>}
    {!loading && documents.length === 0 && staged.length === 0 && <p className="rounded-lg bg-muted/50 p-4 text-center text-sm text-muted-foreground">No hay documentos asociados a esta actividad.</p>}
    <div className="space-y-2">
      {documents.map(item => <div key={item.id} className="flex items-center gap-3 rounded-lg border p-3">
        <FileText className="h-5 w-5 shrink-0 text-primary" />
        <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{item.originalName}</p><p className="text-xs text-muted-foreground">{labels[(item.metadata?.documentType as ActivityDocumentType) || 'other']} · {(item.size / 1024).toFixed(0)} KB</p></div>
        <button type="button" disabled={disabled || loading} onClick={() => downloadActivityDocument(item.id, item.originalName).catch(err => setError(err.message))} aria-label={`Descargar ${item.originalName}`} className="rounded-lg p-2 hover:bg-muted"><Download className="h-4 w-4" /></button>
        <button type="button" disabled={disabled || loading} onClick={() => remove(item)} aria-label={`Eliminar ${item.originalName}`} className="rounded-lg p-2 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
      </div>)}
      {staged.map((item, index) => <div key={`${item.file.name}-${index}`} className="flex items-center gap-3 rounded-lg border border-dashed border-primary/50 p-3">
        <FileText className="h-5 w-5 shrink-0 text-primary" />
        <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{item.file.name}</p><p className="text-xs text-muted-foreground">{labels[item.documentType]} · pendiente de subir</p></div>
        <button type="button" disabled={disabled} onClick={() => onStagedChange(staged.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Quitar ${item.file.name}`} className="rounded-lg p-2"><X className="h-4 w-4" /></button>
      </div>)}
    </div>
  </section>
}
