'use client'

import * as React from 'react'
import { Check, File as FileIcon, Loader2, Paperclip, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CommentMentionEditor } from '@/components/comment-mention-editor'
import { serializeCommentMentions, type CommentMention } from '@/lib/comment-mentions'
import { createTicketComment } from '@/services/commentService'
import { MAX_TICKET_ATTACHMENT_SIZE, TICKET_ATTACHMENT_ACCEPT, uploadTicketAttachment } from '@/services/ticketAttachmentService'
import type { ApiComment, ApiTeamMember, ApiTicketAttachment } from '@/types/project'

interface DraftFile {
  key: string
  file: File
  uploaded?: ApiTicketAttachment
}

export function TicketCommentComposer({
  projectId, ticketId, ticketKey, teamMembers, parentCommentId,
  onCreated, onAttachmentUploaded, onCancel, disabled = false,
}: {
  projectId: string
  ticketId: string
  ticketKey: string
  teamMembers: ApiTeamMember[]
  parentCommentId?: string
  onCreated: (comment: ApiComment) => void
  onAttachmentUploaded: (attachment: ApiTicketAttachment) => void
  onCancel?: () => void
  disabled?: boolean
}) {
  const [text, setText] = React.useState('')
  const [mentions, setMentions] = React.useState<CommentMention[]>([])
  const [files, setFiles] = React.useState<DraftFile[]>([])
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [uploadingKey, setUploadingKey] = React.useState<string | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const sequence = React.useRef(0)
  const busy = React.useRef(false)
  const mounted = React.useRef(true)
  React.useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  const selectFiles = (selected: File[]) => {
    if (busy.current || disabled) return
    if (files.length + selected.length > 10) {
      setError('Puedes adjuntar hasta 10 archivos por comentario.')
      return
    }
    const oversized = selected.find(file => file.size > MAX_TICKET_ATTACHMENT_SIZE)
    if (oversized) {
      setError(`${oversized.name} supera el límite de 10 MB.`)
      return
    }
    setError(null)
    setFiles(previous => [...previous, ...selected.map(file => ({ key: String(sequence.current++), file }))])
  }

  const submit = async () => {
    if (busy.current || disabled) return
    const body = serializeCommentMentions(text, mentions).trim()
    if (!body && files.length === 0) return
    if (body.length > 5000) {
      setError('El comentario supera el límite de 5000 caracteres.')
      return
    }
    busy.current = true
    setSaving(true)
    setError(null)
    try {
      const attachmentIds: string[] = []
      for (const draft of files) {
        let attachment = draft.uploaded
        if (!attachment) {
          if (mounted.current) setUploadingKey(draft.key)
          attachment = await uploadTicketAttachment(projectId, ticketId, ticketKey, draft.file)
          // Retain successful uploads if another file or comment creation fails.
          if (mounted.current) {
            const uploaded = attachment
            setFiles(previous => previous.map(item => item.key === draft.key ? { ...item, uploaded } : item))
            onAttachmentUploaded(attachment)
          }
        }
        attachmentIds.push(attachment.id)
      }
      if (mounted.current) setUploadingKey(null)
      const created = await createTicketComment(projectId, ticketId, body, parentCommentId, attachmentIds)
      if (mounted.current) {
        setText('')
        setMentions([])
        setFiles([])
        onCreated(created)
      }
    } catch (failure) {
      if (mounted.current) setError(failure instanceof Error ? failure.message : 'No se pudo publicar el comentario. Intenta de nuevo.')
    } finally {
      busy.current = false
      if (mounted.current) {
        setSaving(false)
        setUploadingKey(null)
      }
    }
  }

  return (
    <div className="min-w-0 space-y-2">
      <CommentMentionEditor
        placeholder={parentCommentId ? 'Escribe una respuesta...' : 'Escribe un comentario...'}
        value={text}
        mentions={mentions}
        onChange={(value, ranges) => { setText(value); setMentions(ranges) }}
        onSubmit={() => void submit()}
        onCancel={saving ? undefined : onCancel}
        teamMembers={teamMembers}
        disabled={disabled || saving}
        autoFocus={Boolean(parentCommentId)}
      />
      <input ref={inputRef} type="file" multiple accept={TICKET_ATTACHMENT_ACCEPT} className="hidden" aria-label="Archivos del comentario" disabled={disabled || saving}
        onChange={event => { selectFiles(Array.from(event.target.files ?? [])); event.target.value = '' }} />
      {files.length > 0 && (
        <ul aria-label="Archivos seleccionados" className="space-y-1">
          {files.map(draft => (
            <li key={draft.key} className="flex min-w-0 items-center gap-2 rounded-md border px-2 py-1.5 text-xs">
              {uploadingKey === draft.key ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-label="Subiendo" /> : draft.uploaded ? <Check className="h-4 w-4 shrink-0 text-green-600" aria-label="Subido al ticket" /> : <FileIcon className="h-4 w-4 shrink-0" />}
              <span className="min-w-0 flex-1 truncate" title={draft.file.name}>{draft.file.name}</span>
              <Button type="button" variant="ghost" size="icon" className="h-6 w-6 shrink-0" disabled={disabled || saving}
                aria-label={`Quitar ${draft.file.name} del comentario`} onClick={() => setFiles(previous => previous.filter(item => item.key !== draft.key))}>
                <X className="h-3 w-3" />
              </Button>
            </li>
          ))}
        </ul>
      )}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button type="button" variant="ghost" size="sm" disabled={disabled || saving} onClick={() => inputRef.current?.click()}>
          <Paperclip className="mr-1 h-3.5 w-3.5" /> Adjuntar archivos
        </Button>
        <div className="flex items-center gap-2">
          {onCancel && <Button type="button" variant="ghost" size="sm" disabled={saving || disabled} onClick={onCancel}>Cancelar</Button>}
          <Button type="button" size="sm" disabled={disabled || saving || (!text.trim() && files.length === 0)} onClick={() => void submit()}>
            {saving && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
            {saving ? 'Publicando…' : parentCommentId ? 'Responder' : 'Publicar'}
          </Button>
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground">Escribe @ para etiquetar · ⌘ / Ctrl + Enter para enviar. Hasta 10 archivos de 10 MB cada uno.</p>
      {files.some(file => file.uploaded) && <p className="text-[11px] text-muted-foreground">Los archivos subidos ya están en Archivos del ticket, aunque los quites del comentario.</p>}
    </div>
  )
}
