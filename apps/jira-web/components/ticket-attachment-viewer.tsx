'use client'

import * as React from 'react'
import { Download, FileWarning, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { downloadTicketAttachment, getTicketAttachmentContent } from '@/services/ticketAttachmentService'
import type { ApiTicketAttachment } from '@/types/project'

// Only embed known image formats and PDFs. Other files remain downloadable.
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/bmp'])

export function TicketAttachmentViewer({ attachment, onClose }: {
  attachment: ApiTicketAttachment
  onClose: () => void
}) {
  const mimeType = attachment.mimeType.toLowerCase().split(';')[0].trim()
  const isImage = IMAGE_TYPES.has(mimeType)
  const isPdf = mimeType === 'application/pdf'
  const supported = isImage || isPdf
  const [url, setUrl] = React.useState<string | null>(null)
  const [previewError, setPreviewError] = React.useState<string | null>(null)
  const [invalidFormat, setInvalidFormat] = React.useState(false)
  const [downloading, setDownloading] = React.useState(false)
  const [downloadError, setDownloadError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!supported) return
    const controller = new AbortController()
    let objectUrl: string | undefined
    getTicketAttachmentContent(attachment.id, controller.signal)
      .then(blob => {
        if (controller.signal.aborted) return
        objectUrl = URL.createObjectURL(blob.slice(0, blob.size, mimeType))
        setUrl(objectUrl)
      })
      .catch(error => {
        if (!controller.signal.aborted) {
          setPreviewError(error instanceof Error ? error.message : 'No se pudo cargar la vista previa.')
        }
      })
    return () => {
      controller.abort()
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [attachment.id, mimeType, supported])

  const download = async () => {
    setDownloading(true)
    setDownloadError(null)
    try {
      await downloadTicketAttachment(attachment.id, attachment.originalName)
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : 'No se pudo descargar el archivo.')
    } finally {
      setDownloading(false)
    }
  }

  const fallback = (
    <div className="flex flex-col items-center gap-3 p-6 text-center text-muted-foreground">
      <FileWarning className="h-10 w-10" aria-hidden="true" />
      <p>Formato no válido para vista previa.</p>
      <p className="text-sm">Puedes descargar el archivo para abrirlo en tu dispositivo.</p>
    </div>
  )

  return (
    <Dialog open onOpenChange={open => { if (!open) onClose() }}>
      <DialogContent className="flex max-h-[90dvh] w-[calc(100%-2rem)] max-w-5xl flex-col overflow-hidden p-4 sm:p-6">
        <DialogHeader className="min-w-0 shrink-0 pr-7 text-left">
          <DialogTitle className="max-h-24 overflow-y-auto break-all leading-snug">{attachment.originalName}</DialogTitle>
          <DialogDescription>Vista previa del archivo adjunto</DialogDescription>
        </DialogHeader>
        <div className="flex min-h-48 min-w-0 flex-1 items-center justify-center overflow-auto rounded-md border bg-muted/30">
          {previewError ? (
            <p role="alert" className="p-6 text-center text-sm text-destructive">{previewError}</p>
          ) : !supported || invalidFormat ? fallback : !url ? (
            <p role="status" className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Cargando vista previa…
            </p>
          ) : isImage ? (
            // Authenticated blob URLs cannot use the Next.js image optimizer.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt={attachment.originalName} className="max-h-[60dvh] max-w-full object-contain" onError={() => setInvalidFormat(true)} />
          ) : (
            <object data={url} type="application/pdf" aria-label={`Vista previa de ${attachment.originalName}`} className="h-[60dvh] w-full" onError={() => setInvalidFormat(true)}>
              {fallback}
            </object>
          )}
        </div>
        {downloadError && <p role="alert" className="text-sm text-destructive">{downloadError}</p>}
        <DialogFooter className="shrink-0">
          <Button type="button" variant="outline" onClick={onClose}>Cerrar</Button>
          <Button type="button" disabled={downloading} onClick={() => void download()}>
            {downloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Descargar archivo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
