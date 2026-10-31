'use client'

import * as React from 'react'
import { Download, File as FileIcon, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getTicketAttachmentContent } from '@/services/ticketAttachmentService'
import type { ApiTicketAttachment } from '@/types/project'

function AttachmentThumbnail({ attachment }: { attachment: ApiTicketAttachment }) {
  const ref = React.useRef<HTMLSpanElement>(null)
  const [visible, setVisible] = React.useState(false)
  const [url, setUrl] = React.useState<string | null>(null)
  const [failed, setFailed] = React.useState(false)
  const isImage = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/bmp'].includes(attachment.mimeType)

  React.useEffect(() => {
    if (!isImage || !ref.current) return
    if (typeof IntersectionObserver === 'undefined') { setVisible(true); return }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { setVisible(true); observer.disconnect() }
    })
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [isImage])

  React.useEffect(() => {
    if (!isImage || !visible) return
    const controller = new AbortController()
    let objectUrl: string | undefined
    getTicketAttachmentContent(attachment.id, controller.signal).then(blob => {
      if (controller.signal.aborted) return
      objectUrl = URL.createObjectURL(blob.slice(0, blob.size, attachment.mimeType))
      setUrl(objectUrl)
    }).catch(() => { if (!controller.signal.aborted) setFailed(true) })
    return () => { controller.abort(); if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [attachment.id, attachment.mimeType, isImage, visible])

  return (
    <span ref={ref} className="flex h-32 w-full items-center justify-center overflow-hidden rounded-t-md bg-muted/50">
      {url && !failed ? (
        // Authenticated blob URLs cannot use the Next.js image optimizer.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={attachment.originalName} className="h-full w-full object-contain" onError={() => setFailed(true)} />
      ) : isImage ? <ImageIcon className="h-8 w-8 text-muted-foreground" /> : <FileIcon className="h-8 w-8 text-muted-foreground" />}
    </span>
  )
}

export function CommentAttachments({ ids, attachments, loading, onPreview, onDownload }: {
  ids: string[]
  attachments: ApiTicketAttachment[]
  loading: boolean
  onPreview: (attachment: ApiTicketAttachment) => void
  onDownload: (attachment: ApiTicketAttachment) => void
}) {
  if (ids.length === 0) return null
  if (loading) return <p role="status" className="mt-2 text-xs text-muted-foreground">Cargando archivos del comentario…</p>
  return (
    <ul aria-label="Archivos del comentario" className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
      {ids.map(id => {
        const attachment = attachments.find(file => file.id === id)
        if (!attachment) return <li key={id} className="rounded-md border p-3 text-xs text-muted-foreground">Archivo no disponible.</li>
        return (
          <li key={id} className="min-w-0 overflow-hidden rounded-md border">
            <button type="button" className="block w-full text-left hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
              aria-label={`Ver ${attachment.originalName}`} onClick={() => onPreview(attachment)}>
              {attachment.mimeType.startsWith('image/') && <AttachmentThumbnail attachment={attachment} />}
              <span className="block truncate px-3 pt-2 text-xs font-medium" title={attachment.originalName}>{attachment.originalName}</span>
            </button>
            <div className="flex items-center justify-between gap-2 px-3 pb-1">
              <span className="text-[11px] text-muted-foreground">{(attachment.size / 1024).toFixed(1)} KB</span>
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0" aria-label={`Descargar ${attachment.originalName}`} onClick={() => onDownload(attachment)}>
                <Download className="h-3.5 w-3.5" />
              </Button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
