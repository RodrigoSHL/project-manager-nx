'use client'

import { useEffect, useState } from 'react'
import { ImagePlus, Loader2, Trash2 } from 'lucide-react'
import { ActivityPhoto, deleteActivityPhoto, getActivityPhotoContent, listActivityPhotos } from '@/services/activityPhotoService'

export function ActivityPhotosSection({ activityId, staged, onStagedChange, disabled }: { activityId?: string; staged: File[]; onStagedChange: (files: File[]) => void; disabled: boolean }) {
  const [photos, setPhotos] = useState<ActivityPhoto[]>([])
  const [urls, setUrls] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    const created: string[] = []
    setPhotos([]); setUrls({}); setError('')
    if (!activityId) return
    setLoading(true)
    listActivityPhotos(activityId).then(async records => {
      if (cancelled) return
      setPhotos(records)
      const entries = await Promise.all(records.map(async photo => {
        const url = URL.createObjectURL(await getActivityPhotoContent(photo.id)); created.push(url); return [photo.id, url] as const
      }))
      if (!cancelled) setUrls(Object.fromEntries(entries))
    }).catch(err => !cancelled && setError(err instanceof Error ? err.message : 'No fue posible cargar las fotos')).finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true; created.forEach(url => URL.revokeObjectURL(url)) }
  }, [activityId])

  const stagedUrls = staged.map(file => ({ file, url: URL.createObjectURL(file) }))

  async function remove(photo: ActivityPhoto) {
    if (!confirm(`¿Eliminar “${photo.originalName}”?`)) return
    setLoading(true); setError('')
    try { await deleteActivityPhoto(photo.id); setPhotos(current => current.filter(item => item.id !== photo.id)); if (urls[photo.id]) URL.revokeObjectURL(urls[photo.id]) }
    catch (err) { setError(err instanceof Error ? err.message : 'No fue posible eliminar la foto') }
    finally { setLoading(false) }
  }

  return <section className="rounded-xl border border-border p-4">
    <div className="mb-3 flex items-center justify-between gap-3">
      <div><h3 className="text-sm font-semibold">Fotografías</h3><p className="text-xs text-muted-foreground">JPG, PNG o WebP, máximo 10 MB por imagen.</p></div>
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted aria-disabled:opacity-50">
        <ImagePlus className="h-4 w-4" /> Agregar
        <input className="sr-only" type="file" multiple accept="image/jpeg,image/png,image/webp" disabled={disabled} onChange={event => {
          const selected = Array.from(event.target.files ?? []).filter(file => file.size <= 10 * 1024 * 1024)
          onStagedChange([...staged, ...selected]); event.target.value = ''
        }} />
      </label>
    </div>
    {error && <p className="mb-3 rounded-lg bg-red-50 p-2 text-xs text-red-700">{error}</p>}
    {loading && <div className="flex items-center gap-2 py-3 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Procesando fotografías…</div>}
    {!loading && photos.length === 0 && staged.length === 0 && <p className="rounded-lg bg-muted/50 p-4 text-center text-sm text-muted-foreground">Esta actividad todavía no tiene fotografías.</p>}
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {photos.map(photo => <figure key={photo.id} className="group relative overflow-hidden rounded-lg border bg-muted">
        {urls[photo.id] ? <img src={urls[photo.id]} alt={photo.metadata?.caption || `Fotografía de la actividad: ${photo.originalName}`} className="aspect-square w-full object-cover" /> : <div className="aspect-square animate-pulse" />}
        <button type="button" disabled={disabled || loading} onClick={() => remove(photo)} aria-label={`Eliminar ${photo.originalName}`} className="absolute right-2 top-2 rounded-full bg-black/65 p-1.5 text-white disabled:opacity-50"><Trash2 className="h-4 w-4" /></button>
      </figure>)}
      {stagedUrls.map(({ file, url }, index) => <figure key={`${file.name}-${index}`} className="relative overflow-hidden rounded-lg border border-dashed border-primary/50">
        <img src={url} onLoad={() => URL.revokeObjectURL(url)} alt={`Vista previa de ${file.name}`} className="aspect-square w-full object-cover opacity-80" />
        <span className="absolute bottom-0 inset-x-0 bg-black/65 px-2 py-1 text-[11px] text-white">Pendiente de subir</span>
        <button type="button" disabled={disabled} onClick={() => onStagedChange(staged.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Quitar ${file.name}`} className="absolute right-2 top-2 rounded-full bg-black/65 p-1.5 text-white"><Trash2 className="h-4 w-4" /></button>
      </figure>)}
    </div>
  </section>
}
