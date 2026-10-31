'use client'

import * as React from 'react'
import {
  X,
  Bug,
  BookOpen,
  CheckSquare,
  Layers,
  User,
  Calendar,
  Clock,
  MessageSquare,
  Plus,
  MoreHorizontal,
  Link,
  Share2,
  Trash2,
  Loader2,
  LifeBuoy,
  Pencil,
  Reply,
  Paperclip,
  Upload,
  Download,
  File as FileIcon,
  Image as ImageIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getTicketSprintUpdate } from '@/lib/ticket-sprint'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { CommentMentionEditor } from '@/components/comment-mention-editor'
import { TicketAttachmentViewer } from '@/components/ticket-attachment-viewer'
import { TicketCommentComposer } from '@/components/ticket-comment-composer'
import { CommentAttachments } from '@/components/comment-attachments'
import { TicketChildren } from '@/components/ticket-children'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { typeConfig } from '@/lib/mock-data'
import type { ApiComment, ApiTicket, ApiSprint, ApiTeamMember, ApiTicketAttachment } from '@/types/project'
import { deleteTicket, updateTicket } from '@/services/ticketService'
import {
  deleteTicketComment,
  getTicketComments,
  updateTicketComment,
} from '@/services/commentService'
import { useAuth } from '@/contexts/auth-context'
import { buildCommentThreads } from '@/lib/comment-threads'
import {
  parseCommentMentions,
  serializeCommentMentions,
  type CommentMention,
} from '@/lib/comment-mentions'
import {
  findTeamMemberByAssigneeId,
  getTeamMemberAssigneeId,
  getTeamRoleLabel,
} from '@/lib/team-members'
import {
  TICKET_ATTACHMENT_ACCEPT,
  deleteTicketAttachment,
  downloadTicketAttachment,
  listTicketAttachments,
  uploadTicketAttachment,
} from '@/services/ticketAttachmentService'

// ── Config ───────────────────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: ApiTicket['status']; label: string; dot: string }[] = [
  { value: 'backlog',     label: 'Backlog',     dot: 'bg-muted-foreground' },
  { value: 'todo',        label: 'To Do',       dot: 'bg-foreground' },
  { value: 'in_progress', label: 'In Progress', dot: 'bg-primary' },
  { value: 'in_review',   label: 'In Review',   dot: 'bg-yellow-500' },
  { value: 'done',        label: 'Done',        dot: 'bg-green-500' },
  { value: 'cancelled',   label: 'Cancelled',   dot: 'bg-destructive' },
]

const PRIORITY_OPTIONS: { value: ApiTicket['priority']; label: string; color: string; icon: string }[] = [
  { value: 'lowest', label: 'Lowest', color: 'text-muted-foreground', icon: '⬇' },
  { value: 'low',    label: 'Low',    color: 'text-muted-foreground', icon: '▽' },
  { value: 'medium', label: 'Medium', color: 'text-yellow-500',       icon: '◆' },
  { value: 'high',   label: 'High',   color: 'text-orange-500',       icon: '▲' },
  { value: 'urgent', label: 'Urgent', color: 'text-destructive',      icon: '⬆' },
]

const TYPE_OPTIONS: { value: ApiTicket['type']; label: string; Icon: React.ElementType }[] = [
  { value: 'story', label: 'Historia', Icon: BookOpen },
  { value: 'task', label: 'Tarea', Icon: CheckSquare },
  { value: 'bug', label: 'Bug', Icon: Bug },
  { value: 'support', label: 'Soporte', Icon: LifeBuoy },
  { value: 'epic', label: 'Épica', Icon: Layers },
  { value: 'subtask', label: 'Subtarea', Icon: CheckSquare },
]

const STORY_POINTS = [1, 2, 3, 5, 8, 13, 21]

const typeIcons: Record<string, React.ElementType> = {
  task:    CheckSquare,
  bug:     Bug,
  story:   BookOpen,
  epic:    Layers,
  subtask: CheckSquare,
  support: LifeBuoy,
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface TicketDetailProps {
  canWrite: boolean
  ticket: ApiTicket | null
  highlightedCommentId?: string
  open: boolean
  onClose: () => void
  projectId: string
  teamMembers?: ApiTeamMember[]
  tickets?: ApiTicket[]
  sprints?: ApiSprint[]
  onUpdated: (ticket: ApiTicket) => void
  onDeleted: (ticketId: string) => void
  onSelectTicket: (ticket: ApiTicket) => void
  onCreateChild?: (ticket: ApiTicket) => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export function TicketDetail({
  canWrite,
  ticket,
  highlightedCommentId,
  open,
  onClose,
  projectId,
  teamMembers = [],
  tickets = [],
  sprints = [],
  onUpdated,
  onDeleted,
  onSelectTicket,
  onCreateChild,
}: TicketDetailProps) {
  const { user } = useAuth()
  const [saving, setSaving] = React.useState(false)
  const [saveError, setSaveError] = React.useState<string | null>(null)
  const [storyTypeDialogOpen, setStoryTypeDialogOpen] = React.useState(false)
  const [storyEpicId, setStoryEpicId] = React.useState('none')
  const [subtaskTypeDialogOpen, setSubtaskTypeDialogOpen] = React.useState(false)
  const [subtaskParentId, setSubtaskParentId] = React.useState('none')

  const [title, setTitle] = React.useState('')
  const [isEditingTitle, setIsEditingTitle] = React.useState(false)

  const [description, setDescription] = React.useState('')
  const [isEditingDescription, setIsEditingDescription] = React.useState(false)
  const [acceptanceCriteria, setAcceptanceCriteria] = React.useState('')
  const [isEditingAcceptanceCriteria, setIsEditingAcceptanceCriteria] = React.useState(false)

  const [localLabels, setLocalLabels] = React.useState<ApiTicket['labels']>([])
  const [labelInput, setLabelInput] = React.useState('')
  const [showLabelInput, setShowLabelInput] = React.useState(false)

  const [replyingToCommentId, setReplyingToCommentId] = React.useState<string | null>(null)
  const [comments, setComments] = React.useState<ApiComment[]>([])
  const [commentsLoading, setCommentsLoading] = React.useState(false)
  const [commentSaving, setCommentSaving] = React.useState(false)
  const [commentError, setCommentError] = React.useState<string | null>(null)
  const [editingCommentId, setEditingCommentId] = React.useState<string | null>(null)
  const [editingCommentBody, setEditingCommentBody] = React.useState('')
  const [editingCommentMentions, setEditingCommentMentions] = React.useState<CommentMention[]>([])
  const [attachments, setAttachments] = React.useState<ApiTicketAttachment[]>([])
  const [attachmentsLoading, setAttachmentsLoading] = React.useState(false)
  const [attachmentAction, setAttachmentAction] = React.useState<string | null>(null)
  const [attachmentError, setAttachmentError] = React.useState<string | null>(null)
  const [previewAttachment, setPreviewAttachment] = React.useState<ApiTicketAttachment | null>(null)
  const attachmentInputRef = React.useRef<HTMLInputElement>(null)
  const contentRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    contentRef.current?.scrollTo({ top: 0 })
  }, [ticket?.id])

  React.useEffect(() => {
    setPreviewAttachment(null)
  }, [open, ticket?.id])

  React.useEffect(() => {
    if (!ticket) return
    setTitle(ticket.title)
    setDescription(ticket.description ?? '')
    setAcceptanceCriteria(ticket.acceptanceCriteria ?? '')
    setLocalLabels(ticket.labels ?? [])
    setComments([])
    setIsEditingTitle(false)
    setIsEditingDescription(false)
    setIsEditingAcceptanceCriteria(false)
    setReplyingToCommentId(null)
    setLabelInput('')
    setShowLabelInput(false)
    setCommentError(null)
    setEditingCommentId(null)
    setEditingCommentBody('')
    setEditingCommentMentions([])
    setAttachments([])
    setAttachmentError(null)
    setAttachmentAction(null)
    setSaveError(null)
    setStoryTypeDialogOpen(false)
    setStoryEpicId('none')
    setSubtaskTypeDialogOpen(false)
    setSubtaskParentId('none')
  }, [ticket?.id])

  React.useEffect(() => {
    if (!open || !ticket) return
    let cancelled = false

    setCommentsLoading(true)
    setCommentError(null)
    getTicketComments(projectId, ticket.id)
      .then(data => {
        if (!cancelled) setComments(data)
      })
      .catch(error => {
        if (!cancelled) {
          setCommentError(error instanceof Error ? error.message : 'No se pudieron cargar los comentarios.')
        }
      })
      .finally(() => {
        if (!cancelled) setCommentsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, projectId, ticket?.id])

  React.useEffect(() => {
    if (!open || commentsLoading || !highlightedCommentId || !comments.some(comment => comment.id === highlightedCommentId)) return
    const frame = requestAnimationFrame(() => {
      document.getElementById(`comment-${highlightedCommentId}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    })
    return () => cancelAnimationFrame(frame)
  }, [open, commentsLoading, comments, highlightedCommentId])

  React.useEffect(() => {
    if (!open || !ticket) return
    let cancelled = false

    setAttachmentsLoading(true)
    setAttachmentError(null)
    listTicketAttachments(projectId, ticket.id)
      .then(data => {
        if (!cancelled) setAttachments(data)
      })
      .catch(error => {
        if (!cancelled) {
          setAttachmentError(error instanceof Error ? error.message : 'No se pudieron cargar los archivos.')
        }
      })
      .finally(() => {
        if (!cancelled) setAttachmentsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, projectId, ticket?.id])

  if (!ticket) return null

  const TypeIcon = typeIcons[ticket.type] ?? CheckSquare
  const type = typeConfig[ticket.type as keyof typeof typeConfig] ?? {
    label: ticket.type,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
  }
  const selectedAssignee = findTeamMemberByAssigneeId(teamMembers, ticket.assigneeId)
  const projectSprints = sprints.filter(sprint => sprint.projectId === projectId)
  const selectedSprint = projectSprints.find(sprint => sprint.id === ticket.sprintId)
  const availableEpics = tickets.filter(candidate => candidate.projectId === ticket.projectId && candidate.type === 'epic' && candidate.id !== ticket.id)
  const availableStories = tickets.filter(candidate => candidate.projectId === ticket.projectId && candidate.type === 'story' && candidate.id !== ticket.id)
  const parentStory = availableStories.find(candidate => candidate.id === ticket.parentTicketId)

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('es-ES', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })

  // ── API helpers ────────────────────────────────────────────────────────────

  const patch = async (data: Parameters<typeof updateTicket>[2]): Promise<boolean> => {
    if (!canWrite) return false
    setSaving(true)
    setSaveError(null)
    try {
      const updated = await updateTicket(projectId, ticket.id, data)
      onUpdated(updated)
      return true
    } catch (err) {
      console.error('Error saving ticket', err)
      setSaveError(err instanceof Error ? err.message : 'No se pudo guardar el ticket.')
      return false
    } finally {
      setSaving(false)
    }
  }

  const removeTicket = async () => {
    if (!canWrite || !window.confirm(`¿Eliminar el ticket ${ticket.key}?`)) return
    setSaving(true)
    setSaveError(null)
    try {
      await deleteTicket(projectId, ticket.id)
      onDeleted(ticket.id)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'No se pudo eliminar el ticket.')
    } finally {
      setSaving(false)
    }
  }

  const saveTitle = () => {
    setIsEditingTitle(false)
    const trimmed = title.trim()
    if (trimmed && trimmed !== ticket.title) patch({ title: trimmed })
  }

  const saveDescription = () => {
    setIsEditingDescription(false)
    const trimmed = description.trim() || undefined
    if (trimmed !== (ticket.description ?? undefined)) patch({ description: trimmed })
  }

  const saveAcceptanceCriteria = () => {
    setIsEditingAcceptanceCriteria(false)
    const trimmed = acceptanceCriteria.trim() || null
    if (trimmed !== (ticket.acceptanceCriteria ?? null)) {
      patch({ acceptanceCriteria: trimmed })
    }
  }

  // ── Label helpers ──────────────────────────────────────────────────────────

  const addLabel = () => {
    const name = labelInput.trim()
    if (!name) { setShowLabelInput(false); return }
    if (!localLabels.find(l => l.name.toLowerCase() === name.toLowerCase())) {
      setLocalLabels(prev => [...prev, { id: Date.now().toString(), name, color: null }])
    }
    setLabelInput('')
    setShowLabelInput(false)
  }

  const removeLabel = (id: string) => setLocalLabels(prev => prev.filter(l => l.id !== id))

  // ── Comment helpers ────────────────────────────────────────────────────────

  const cancelReply = () => {
    setReplyingToCommentId(null)
  }

  const onCommentAttachmentUploaded = (attachment: ApiTicketAttachment) => {
    setAttachments(previous => [attachment, ...previous.filter(file => file.id !== attachment.id)])
  }

  const startEditingComment = (comment: ApiComment) => {
    cancelReply()
    const parsed = parseCommentMentions(comment.body)
    setEditingCommentId(comment.id)
    setEditingCommentBody(parsed.text)
    setEditingCommentMentions(parsed.mentions)
    setCommentError(null)
  }

  const saveComment = async (commentId: string) => {
    const body = serializeCommentMentions(editingCommentBody, editingCommentMentions).trim()
    if ((!body && !comments.find(comment => comment.id === commentId)?.attachmentIds?.length) || commentSaving) return
    if (body.length > 5000) {
      setCommentError('El comentario supera el límite de 5000 caracteres.')
      return
    }

    setCommentSaving(true)
    setCommentError(null)
    try {
      const updated = await updateTicketComment(projectId, ticket.id, commentId, body)
      setComments(prev => prev.map(comment => comment.id === commentId ? updated : comment))
      setEditingCommentId(null)
      setEditingCommentBody('')
      setEditingCommentMentions([])
    } catch (error) {
      setCommentError(error instanceof Error ? error.message : 'No se pudo editar el comentario.')
    } finally {
      setCommentSaving(false)
    }
  }

  const removeComment = async (commentId: string) => {
    if (!window.confirm('¿Eliminar este comentario?') || commentSaving) return

    setCommentSaving(true)
    setCommentError(null)
    try {
      await deleteTicketComment(projectId, ticket.id, commentId)
      setComments(prev => prev.filter(comment => comment.id !== commentId).map(comment =>
        comment.parentCommentId === commentId ? { ...comment, parentCommentId: null } : comment
      ))
      if (replyingToCommentId === commentId) cancelReply()
    } catch (error) {
      setCommentError(error instanceof Error ? error.message : 'No se pudo eliminar el comentario.')
    } finally {
      setCommentSaving(false)
    }
  }

  const getCommentAuthor = (authorId: string) => {
    if (authorId === user.userId) {
      return { name: user.name, avatar: undefined }
    }

    const member = teamMembers.find(candidate => candidate.userId === authorId)
    return { name: member?.name ?? 'Usuario', avatar: member?.avatar }
  }

  const getInitials = (name: string) => {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase())
      .join('') || 'U'
  }

  const renderCommentBody = (body: string) => {
    const { text, mentions } = parseCommentMentions(body)
    const parts: React.ReactNode[] = []
    let cursor = 0
    for (const mention of mentions) {
      parts.push(text.slice(cursor, mention.start))
      const member = teamMembers.find(candidate => candidate.id === mention.memberId)
      parts.push(
        <span key={`${mention.start}-${mention.memberId}`} className="rounded bg-primary/10 px-0.5 font-medium text-brand-foreground" title={member?.email}>
          {text.slice(mention.start, mention.end)}
        </span>
      )
      cursor = mention.end
    }
    parts.push(text.slice(cursor))
    return parts
  }

  const addAttachment = async (file?: File) => {
    if (!file || attachmentAction) return
    setAttachmentAction('upload')
    setAttachmentError(null)
    try {
      const created = await uploadTicketAttachment(projectId, ticket.id, ticket.key, file)
      setAttachments(prev => [created, ...prev])
    } catch (error) {
      setAttachmentError(error instanceof Error ? error.message : 'No se pudo subir el archivo.')
    } finally {
      setAttachmentAction(null)
      if (attachmentInputRef.current) attachmentInputRef.current.value = ''
    }
  }

  const downloadAttachment = async (attachment: ApiTicketAttachment) => {
    if (attachmentAction) return
    setAttachmentAction(attachment.id)
    setAttachmentError(null)
    try {
      await downloadTicketAttachment(attachment.id, attachment.originalName)
    } catch (error) {
      setAttachmentError(error instanceof Error ? error.message : 'No se pudo descargar el archivo.')
    } finally {
      setAttachmentAction(null)
    }
  }

  const removeAttachment = async (attachment: ApiTicketAttachment) => {
    if (!canWrite || attachmentAction || !window.confirm(`¿Eliminar ${attachment.originalName}?`)) return
    setAttachmentAction(attachment.id)
    setAttachmentError(null)
    try {
      await deleteTicketAttachment(attachment.id)
      setAttachments(prev => prev.filter(candidate => candidate.id !== attachment.id))
    } catch (error) {
      setAttachmentError(error instanceof Error ? error.message : 'No se pudo eliminar el archivo.')
    } finally {
      setAttachmentAction(null)
    }
  }

  const formatFileSize = (size: number) => {
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
    return `${(size / (1024 * 1024)).toFixed(1)} MB`
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="h-dvh w-full sm:max-w-[850px] gap-0 overflow-hidden p-0">

        {/* Header — pr-14 leaves space for Radix's built-in close button */}
        <SheetHeader className="px-6 py-4 border-b shrink-0 pr-14">
          <SheetTitle className="sr-only">{ticket.title}</SheetTitle>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {canWrite ? <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn('h-8 w-8 rounded-md p-0 hover:bg-accent', type.bgColor)}
                    aria-label="Cambiar tipo de ticket"
                    disabled={saving}
                  >
                    <TypeIcon className={cn('h-4 w-4', type.color)} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {TYPE_OPTIONS.map(option => {
                    const OptionIcon = option.Icon
                    const optionType = typeConfig[option.value as keyof typeof typeConfig] ?? {
                      color: 'text-muted-foreground',
                      bgColor: 'bg-muted',
                    }

                    return (
                      <DropdownMenuItem
                        key={option.value}
                        onClick={() => {
                          if (option.value === ticket.type) return
                          if (option.value === 'story') {
                            if (availableEpics.length === 0) {
                              setSaveError('Crea primero una épica para poder convertir este ticket en historia.')
                              return
                            }
                            setStoryEpicId(ticket.epicId ?? 'none')
                            setStoryTypeDialogOpen(true)
                            return
                          }
                          if (option.value === 'subtask') {
                            if (availableStories.length === 0) {
                              setSaveError('Crea primero una historia de usuario para poder vincular la subtarea.')
                              return
                            }
                            setSubtaskParentId(ticket.parentTicketId ?? 'none')
                            setSubtaskTypeDialogOpen(true)
                            return
                          }
                          patch({ type: option.value })
                        }}
                      >
                        <span className={cn('mr-2 flex h-5 w-5 items-center justify-center rounded', optionType.bgColor)}>
                          <OptionIcon className={cn('h-3.5 w-3.5', optionType.color)} />
                        </span>
                        {option.label}
                      </DropdownMenuItem>
                    )
                  })}
                </DropdownMenuContent>
              </DropdownMenu> : <span className={cn('flex h-8 w-8 items-center justify-center rounded-md', type.bgColor)}><TypeIcon className={cn('h-4 w-4', type.color)} /></span>}
              <span className="text-sm font-mono text-muted-foreground">{ticket.key}</span>
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
            </div>

            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Share2 className="h-4 w-4" />
              </Button>
              {canWrite && <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Link className="h-4 w-4 mr-2" />
                    Copiar enlace
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive" onClick={() => void removeTicket()}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>}
            </div>
          </div>
        </SheetHeader>

        <div ref={contentRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain" tabIndex={0}>
          <div className="px-6 py-4">

            {/* ── Title ─────────────────────────────────────────────────────── */}
            <div className="mb-6">
              {canWrite && isEditingTitle ? (
                <Input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  onBlur={saveTitle}
                  onKeyDown={e => { if (e.key === 'Enter') saveTitle() }}
                  className="text-xl font-semibold border-0 px-0 focus-visible:ring-0"
                  autoFocus
                />
              ) : (
                <h2
                  className={cn('text-xl font-semibold rounded px-1 -mx-1 py-0.5 transition-colors', canWrite && 'cursor-text hover:bg-accent/50')}
                  onClick={() => { if (canWrite) setIsEditingTitle(true) }}
                >
                  {title || ticket.title}
                </h2>
              )}
            </div>

            {/* ── Meta grid ─────────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-4 mb-6">

              {ticket.type !== 'epic' && (
                <div className="space-y-1.5 col-span-2">
                  <label htmlFor="ticket-sprint" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Sprint
                  </label>
                  <Select
                    disabled={!canWrite || saving}
                    value={ticket.sprintId ?? 'none'}
                    onValueChange={value => patch(getTicketSprintUpdate(ticket, value === 'none' ? null : value))}
                  >
                    <SelectTrigger id="ticket-sprint" className="w-full h-9">
                      <SelectValue placeholder="Selecciona un sprint" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin sprint (Backlog)</SelectItem>
                      {ticket.sprintId && !selectedSprint && (
                        <SelectItem value={ticket.sprintId} disabled>Sprint no disponible</SelectItem>
                      )}
                      {projectSprints.map(sprint => (
                        (!sprint.completedAt || sprint.id === ticket.sprintId) && <SelectItem key={sprint.id} value={sprint.id} disabled={Boolean(sprint.completedAt)}>
                          {sprint.name}{sprint.completedAt ? ' · Finalizado' : sprint.isActive ? ' · En curso' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Se guarda al seleccionar. Los tickets en Backlog pasan a To Do al asignar un sprint.
                  </p>
                </div>
              )}

              {ticket.type === 'story' && (
                <div className="space-y-1.5 col-span-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Épica
                  </label>
                  <Select
                    disabled={!canWrite}
                    value={ticket.epicId ?? 'none'}
                    onValueChange={value => {
                      if (value !== 'none') patch({ epicId: value })
                    }}
                  >
                    <SelectTrigger className="w-full h-9">
                      <SelectValue placeholder="Selecciona una épica" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none" disabled>Selecciona una épica</SelectItem>
                      {availableEpics.map(epic => (
                        <SelectItem key={epic.id} value={epic.id}>
                          {epic.key} · {epic.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {ticket.type === 'subtask' && (
                <div className="col-span-2 space-y-1.5">
                  <label htmlFor="ticket-parent-story" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Historia de usuario</label>
                  <Select disabled={!canWrite || saving} value={ticket.parentTicketId ?? 'none'} onValueChange={value => { if (value !== 'none') void patch({ parentTicketId: value }) }}>
                    <SelectTrigger id="ticket-parent-story" className="h-9 w-full"><SelectValue placeholder="Selecciona una historia de usuario" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none" disabled>Selecciona una historia de usuario</SelectItem>
                      {availableStories.map(story => <SelectItem key={story.id} value={story.id}>{story.key} · {story.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {parentStory && <Button type="button" variant="link" size="sm" className="h-auto p-0" onClick={() => onSelectTicket(parentStory)}>Ver historia {parentStory.key}</Button>}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Estado
                </label>
                <Select
                  disabled={!canWrite}
                  value={ticket.status}
                  onValueChange={v => patch({ status: v as ApiTicket['status'] })}
                >
                  <SelectTrigger className="w-full h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex items-center gap-2">
                          <div className={cn('w-2 h-2 rounded-full', opt.dot)} />
                          {opt.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Prioridad
                </label>
                <Select
                  disabled={!canWrite}
                  value={ticket.priority}
                  onValueChange={v => patch({ priority: v as ApiTicket['priority'] })}
                >
                  <SelectTrigger className="w-full h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex items-center gap-2">
                          <span className={opt.color}>{opt.icon}</span>
                          {opt.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Asignado
                </label>
                <Select
                  disabled={!canWrite}
                  value={selectedAssignee ? getTeamMemberAssigneeId(selectedAssignee) : 'unassigned'}
                  onValueChange={v => patch({ assigneeId: v === 'unassigned' ? null : v })}
                >
                  <SelectTrigger className="w-full h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        Sin asignar
                      </div>
                    </SelectItem>
                    {teamMembers.map(member => (
                      <SelectItem key={member.id} value={getTeamMemberAssigneeId(member)}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={member.avatar} />
                            <AvatarFallback className="text-[8px]">
                              {member.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="truncate">{member.name}</span>
                          <span className="text-[10px] text-muted-foreground shrink-0 capitalize">
                            {getTeamRoleLabel(member.role)}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Story Points
                </label>
                <Select
                  disabled={!canWrite}
                  value={ticket.storyPoints?.toString() ?? 'none'}
                  onValueChange={v => patch({ storyPoints: v === 'none' ? null : Number(v) })}
                >
                  <SelectTrigger className="w-full h-9">
                    <SelectValue placeholder="Sin estimar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin estimar</SelectItem>
                    {STORY_POINTS.map(pts => (
                      <SelectItem key={pts} value={pts.toString()}>
                        {pts} {pts === 1 ? 'punto' : 'puntos'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {saveError && (
              <p className="mb-6 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {saveError}
              </p>
            )}

            <TicketChildren ticket={ticket} tickets={tickets} onSelect={onSelectTicket}
              onCreate={canWrite && onCreateChild ? () => onCreateChild(ticket) : undefined} />

            {/* ── Description ───────────────────────────────────────────────── */}
            <div className="mb-6">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-2">
                Descripción
              </label>
              {canWrite && isEditingDescription ? (
                <Textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  onBlur={saveDescription}
                  className="min-h-30 resize-none"
                  placeholder="Añade una descripción..."
                  autoFocus
                />
              ) : (
                <div
                  className={cn(
                    'p-3 rounded-lg bg-muted/50 min-h-20 text-sm leading-relaxed',
                    canWrite && 'cursor-text hover:bg-muted/80 transition-colors',
                    !description && 'text-muted-foreground italic',
                  )}
                  onClick={() => { if (canWrite) setIsEditingDescription(true) }}
                >
                  {description || (canWrite ? 'Haz clic para añadir descripción...' : 'Sin descripción')}
                </div>
              )}
            </div>

            <div className="mb-6">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-2">
                Criterios de aceptación
              </label>
              {canWrite && isEditingAcceptanceCriteria ? (
                <Textarea
                  value={acceptanceCriteria}
                  onChange={e => setAcceptanceCriteria(e.target.value)}
                  onBlur={saveAcceptanceCriteria}
                  className="min-h-30 resize-none"
                  placeholder="Añade los criterios que deben cumplirse..."
                  autoFocus
                />
              ) : (
                <div
                  className={cn(
                    'p-3 rounded-lg bg-muted/50 min-h-20 text-sm leading-relaxed whitespace-pre-wrap',
                    canWrite && 'cursor-text hover:bg-muted/80 transition-colors',
                    !acceptanceCriteria && 'text-muted-foreground italic',
                  )}
                  onClick={() => { if (canWrite) setIsEditingAcceptanceCriteria(true) }}
                >
                  {acceptanceCriteria || (canWrite ? 'Haz clic para añadir criterios de aceptación...' : 'Sin criterios de aceptación')}
                </div>
              )}
            </div>

            {/* ── Labels ────────────────────────────────────────────────────── */}
            <div className="mb-6">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-2">
                Etiquetas
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {localLabels.map(label => (
                  <Badge key={label.id} variant="secondary" className="text-xs gap-1 pr-1">
                    {label.name}
                    {canWrite && <button
                      className="ml-0.5 rounded-full hover:bg-foreground/10 p-0.5 transition-colors"
                      onClick={() => removeLabel(label.id)}
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>}
                  </Badge>
                ))}

                {canWrite && (showLabelInput ? (
                  <Input
                    className="h-6 w-28 text-xs px-2"
                    placeholder="Etiqueta..."
                    value={labelInput}
                    onChange={e => setLabelInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') addLabel()
                      if (e.key === 'Escape') { setShowLabelInput(false); setLabelInput('') }
                    }}
                    onBlur={addLabel}
                    autoFocus
                  />
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs text-muted-foreground"
                    onClick={() => setShowLabelInput(true)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Añadir
                  </Button>
                ))}
              </div>
            </div>

            {/* ── Metadata ──────────────────────────────────────────────────── */}
            <div className="mb-6 space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground w-24">Creado</span>
                <span>{formatDate(ticket.createdAt)}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground w-24">Actualizado</span>
                <span>{formatDate(ticket.updatedAt)}</span>
              </div>
              {ticket.dueDate && (
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground w-24">Vence</span>
                  <span>{formatDate(ticket.dueDate)}</span>
                </div>
              )}
            </div>

            <Separator className="my-6" />

            {/* ── Attachments ─────────────────────────────────────────────── */}
            <div>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Paperclip className="h-4 w-4" />
                  <h3 className="text-sm font-semibold">Archivos ({attachments.length})</h3>
                </div>
                <input
                  ref={attachmentInputRef}
                  type="file"
                  aria-label="Adjuntar archivo al ticket"
                  accept={TICKET_ATTACHMENT_ACCEPT}
                  className="hidden"
                  onChange={event => void addAttachment(event.target.files?.[0])}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={Boolean(attachmentAction)}
                  onClick={() => attachmentInputRef.current?.click()}
                >
                  {attachmentAction === 'upload' ? (
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-3.5 w-3.5" />
                  )}
                  Adjuntar
                </Button>
              </div>

              <p className="mb-3 text-xs text-muted-foreground">
                Imágenes, PDF, Word, Excel, PowerPoint, CSV o texto · máximo 10 MB.
              </p>

              {attachmentError && (
                <p role="alert" className="mb-3 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {attachmentError}
                </p>
              )}

              {attachmentsLoading && (
                <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cargando archivos…
                </div>
              )}

              {!attachmentsLoading && attachments.length === 0 && (
                <p className="rounded-lg border border-dashed px-4 py-5 text-center text-sm text-muted-foreground">
                  Este ticket todavía no tiene archivos adjuntos.
                </p>
              )}

              {!attachmentsLoading && attachments.length > 0 && (
                <div className="space-y-2">
                  {attachments.map(attachment => {
                    const AttachmentIcon = attachment.mimeType.startsWith('image/') ? ImageIcon : FileIcon
                    const busy = attachmentAction === attachment.id
                    return (
                      <div key={attachment.id} className="flex items-center gap-3 rounded-lg border p-3">
                        <button
                          type="button"
                          className="flex min-w-0 flex-1 items-center gap-3 rounded-md text-left hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          onClick={() => setPreviewAttachment(attachment)}
                          aria-label={`Ver ${attachment.originalName}`}
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
                            <AttachmentIcon className="h-4 w-4 text-muted-foreground" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium" title={attachment.originalName}>
                              {attachment.originalName}
                            </span>
                            <span className="block text-xs text-muted-foreground">
                              {formatFileSize(attachment.size)} · {formatDate(attachment.createdAt)}
                            </span>
                          </span>
                        </button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          disabled={Boolean(attachmentAction)}
                          onClick={() => void downloadAttachment(attachment)}
                        >
                          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                          <span className="sr-only">Descargar {attachment.originalName}</span>
                        </Button>
                        {canWrite && <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                          disabled={Boolean(attachmentAction)}
                          onClick={() => void removeAttachment(attachment)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Eliminar {attachment.originalName}</span>
                        </Button>}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <Separator className="my-6" />

            {/* ── Comments ──────────────────────────────────────────────────── */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="h-4 w-4" />
                <h3 className="text-sm font-semibold">Comentarios ({comments.length})</h3>
              </div>

              <div className="flex gap-3 mb-6">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="text-xs">{getInitials(user.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <TicketCommentComposer
                    key={ticket.id}
                    projectId={projectId}
                    ticketId={ticket.id}
                    ticketKey={ticket.key}
                    teamMembers={teamMembers}
                    disabled={commentSaving}
                    onCreated={created => setComments(previous => [...previous, created])}
                    onAttachmentUploaded={onCommentAttachmentUploaded}
                  />
                </div>
              </div>

              {commentError && (
                <p role="alert" className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {commentError}
                </p>
              )}

              {commentsLoading && (
                <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cargando comentarios…
                </div>
              )}

              {!commentsLoading && comments.length === 0 && (
                <p className="py-4 text-sm text-muted-foreground">Aún no hay comentarios en este ticket.</p>
              )}

              {!commentsLoading && comments.length > 0 && (
                <div className="space-y-4">
                  {buildCommentThreads(comments).map(({ comment, parent, depth }) => {
                    const author = getCommentAuthor(comment.authorId)
                    const isOwnComment = comment.authorId === user.userId
                    const wasEdited = comment.updatedAt !== comment.createdAt

                    return (
                      <div key={comment.id} id={`comment-${comment.id}`} className={cn('flex gap-3', depth > 0 && 'border-l-2 pl-3', highlightedCommentId === comment.id && 'rounded-lg bg-primary/5 p-3 ring-1 ring-primary/30')} style={{ marginLeft: Math.min(depth, 2) * 16 }}>
                        <Avatar className="h-8 w-8 shrink-0">
                          {author.avatar && <AvatarImage src={author.avatar} alt={author.name} />}
                          <AvatarFallback className="text-xs">{getInitials(author.name)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          {parent && (
                            <p className="mb-1 text-[11px] text-muted-foreground">
                              En respuesta a {getCommentAuthor(parent.authorId).name}
                            </p>
                          )}
                          <div className="mb-1 flex items-center gap-2">
                            <span className="text-sm font-medium">{isOwnComment ? 'Tú' : author.name}</span>
                            <span className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</span>
                            {wasEdited && <span className="text-[11px] text-muted-foreground">(editado)</span>}

                            {isOwnComment && editingCommentId !== comment.id && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="ml-auto h-7 w-7">
                                    <MoreHorizontal className="h-3.5 w-3.5" />
                                    <span className="sr-only">Opciones del comentario</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => startEditingComment(comment)}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => void removeComment(comment.id)}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Eliminar
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>

                          {editingCommentId === comment.id ? (
                            <div className="space-y-2">
                              <CommentMentionEditor
                                value={editingCommentBody}
                                mentions={editingCommentMentions}
                                onChange={(value, mentions) => { setEditingCommentBody(value); setEditingCommentMentions(mentions) }}
                                onSubmit={() => void saveComment(comment.id)}
                                onCancel={() => {
                                  setEditingCommentId(null)
                                  setEditingCommentBody('')
                                  setEditingCommentMentions([])
                                }}
                                teamMembers={teamMembers}
                                placeholder="Edita tu comentario..."
                                disabled={commentSaving}
                                autoFocus
                              />
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={commentSaving}
                                  onClick={() => {
                                    setEditingCommentId(null)
                                    setEditingCommentBody('')
                                    setEditingCommentMentions([])
                                  }}
                                >
                                  Cancelar
                                </Button>
                                <Button
                                  size="sm"
                                  disabled={(!editingCommentBody.trim() && !comment.attachmentIds?.length) || commentSaving}
                                  onClick={() => void saveComment(comment.id)}
                                >
                                  {commentSaving && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                                  Guardar
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                              {renderCommentBody(comment.body)}
                            </p>
                          )}
                          <CommentAttachments
                            ids={comment.attachmentIds ?? []}
                            attachments={attachments}
                            loading={attachmentsLoading}
                            onPreview={setPreviewAttachment}
                            onDownload={attachment => void downloadAttachment(attachment)}
                          />
                          {editingCommentId !== comment.id && replyingToCommentId !== comment.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="mt-1 h-7 px-2 text-xs text-muted-foreground"
                              disabled={commentSaving}
                              onClick={() => {
                                cancelReply()
                                setReplyingToCommentId(comment.id)
                                setCommentError(null)
                              }}
                            >
                              <Reply className="mr-1 h-3.5 w-3.5" />
                              Responder
                            </Button>
                          )}
                          {replyingToCommentId === comment.id && (
                            <div className="mt-2 space-y-2 rounded-lg border p-3">
                              <p className="text-xs text-muted-foreground">Responder a {author.name}</p>
                              <TicketCommentComposer
                                key={`${ticket.id}:${comment.id}`}
                                projectId={projectId}
                                ticketId={ticket.id}
                                ticketKey={ticket.key}
                                parentCommentId={comment.id}
                                onCancel={cancelReply}
                                teamMembers={teamMembers}
                                disabled={commentSaving}
                                onCreated={created => { setComments(previous => [...previous, created]); cancelReply() }}
                                onAttachmentUploaded={onCommentAttachmentUploaded}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

          </div>
        </div>
      </SheetContent>
    </Sheet>

    {open && previewAttachment && (
      <TicketAttachmentViewer key={previewAttachment.id} attachment={previewAttachment} onClose={() => setPreviewAttachment(null)} />
    )}

    <Dialog open={subtaskTypeDialogOpen} onOpenChange={setSubtaskTypeDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convertir en subtarea</DialogTitle>
          <DialogDescription>Selecciona la historia de usuario a la que pertenecerá este ticket.</DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5 py-2">
          <label htmlFor="convert-subtask-parent" className="text-sm font-medium">Historia de usuario *</label>
          <Select value={subtaskParentId} onValueChange={setSubtaskParentId} disabled={saving}>
            <SelectTrigger id="convert-subtask-parent"><SelectValue placeholder="Selecciona una historia de usuario" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none" disabled>Selecciona una historia de usuario</SelectItem>
              {availableStories.map(story => <SelectItem key={story.id} value={story.id}>{story.key} · {story.title}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {saveError && <p role="alert" className="text-sm text-destructive">{saveError}</p>}
        <DialogFooter>
          <Button variant="outline" disabled={saving} onClick={() => setSubtaskTypeDialogOpen(false)}>Cancelar</Button>
          <Button disabled={saving || subtaskParentId === 'none'} onClick={async () => {
            if (await patch({ type: 'subtask', parentTicketId: subtaskParentId })) setSubtaskTypeDialogOpen(false)
          }}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Convertir</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog open={storyTypeDialogOpen} onOpenChange={setStoryTypeDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convertir en historia de usuario</DialogTitle>
          <DialogDescription>
            Selecciona la épica a la que pertenecerá este ticket.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5 py-2">
          <label className="text-sm font-medium">Épica *</label>
          <Select value={storyEpicId} onValueChange={setStoryEpicId} disabled={saving}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona una épica" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none" disabled>Selecciona una épica</SelectItem>
              {availableEpics.map(epic => (
                <SelectItem key={epic.id} value={epic.id}>
                  {epic.key} · {epic.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setStoryTypeDialogOpen(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button
            disabled={saving || storyEpicId === 'none'}
            onClick={async () => {
              if (await patch({ type: 'story', epicId: storyEpicId })) {
                setStoryTypeDialogOpen(false)
              }
            }}
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Convertir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}
