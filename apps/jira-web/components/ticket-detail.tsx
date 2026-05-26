'use client'

import * as React from 'react'
import { 
  X, 
  Bug, 
  BookOpen, 
  CheckSquare, 
  Layers, 
  User, 
  Users, 
  Tag, 
  Calendar,
  Clock,
  MessageSquare,
  Plus,
  MoreHorizontal,
  Link,
  Share2,
  Trash2,
  Edit3,
  Eye,
  CheckCircle2,
  Circle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
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
import { 
  Ticket, 
  TicketType,
  users, 
  comments as allComments,
  statusConfig, 
  priorityConfig, 
  typeConfig 
} from '@/lib/mock-data'
import type { ApiTicket } from '@/types/project'

interface TicketDetailProps {
  ticket: ApiTicket | null
  open: boolean
  onClose: () => void
}

const typeIcons: Record<string, React.ElementType> = {
  task: CheckSquare,
  bug: Bug,
  story: BookOpen,
  epic: Layers,
  subtask: CheckSquare,
}

export function TicketDetail({ ticket, open, onClose }: TicketDetailProps) {
  const [newComment, setNewComment] = React.useState('')
  const [isEditingTitle, setIsEditingTitle] = React.useState(false)
  const [editedTitle, setEditedTitle] = React.useState('')

  if (!ticket) return null

  const assignee = ticket.assigneeId ? users.find(u => u.id === ticket.assigneeId) : null
  const reporter = null
  const watchers: unknown[] = []
  const ticketComments = allComments.filter(c => c.ticketId === ticket.id)
  const TypeIcon = typeIcons[ticket.type] ?? CheckSquare
  const status = statusConfig[ticket.status as keyof typeof statusConfig] ?? { label: ticket.status, color: 'text-muted-foreground', bgColor: 'bg-muted' }
  const priority = priorityConfig[ticket.priority as keyof typeof priorityConfig] ?? { label: ticket.priority, color: 'text-muted-foreground', icon: '○' }
  const type = typeConfig[ticket.type as keyof typeof typeConfig] ?? { label: ticket.type, color: 'text-muted-foreground', bgColor: 'bg-muted' }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', { 
      year: 'numeric',
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffDays > 0) return `hace ${diffDays}d`
    if (diffHours > 0) return `hace ${diffHours}h`
    return 'hace un momento'
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="px-6 py-4 border-b shrink-0">
          <SheetTitle className="sr-only">{ticket.title}</SheetTitle>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn("p-1.5 rounded-md", type.bgColor)}>
                <TypeIcon className={cn("h-4 w-4", type.color)} />
              </div>
              <span className="text-sm font-mono text-muted-foreground">{ticket.key}</span>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Eye className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Share2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Link className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Edit3 className="h-4 w-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link className="h-4 w-4 mr-2" />
                    Copiar enlace
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="px-6 py-4">
            {/* Title */}
            <div className="mb-6">
              {isEditingTitle ? (
                <Input
                  value={editedTitle || ticket.title}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  onBlur={() => setIsEditingTitle(false)}
                  onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
                  className="text-xl font-semibold border-0 px-0 focus-visible:ring-0"
                  autoFocus
                />
              ) : (
                <h2 
                  className="text-xl font-semibold cursor-text hover:bg-accent/50 rounded px-1 -mx-1 py-0.5 transition-colors"
                  onClick={() => {
                    setEditedTitle(ticket.title)
                    setIsEditingTitle(true)
                  }}
                >
                  {ticket.title}
                </h2>
              )}
            </div>

            {/* Meta Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {/* Status */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Estado
                </label>
                <Select defaultValue={ticket.status}>
                  <SelectTrigger className="w-full h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <div className={cn("w-2 h-2 rounded-full",
                            key === 'backlog' && "bg-muted-foreground",
                            key === 'todo' && "bg-foreground",
                            key === 'in_progress' && "bg-primary",
                            key === 'in_review' && "bg-warning",
                            key === 'done' && "bg-success"
                          )} />
                          {config.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Priority */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Prioridad
                </label>
                <Select defaultValue={ticket.priority}>
                  <SelectTrigger className="w-full h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(priorityConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <span className={config.color}>{config.icon}</span>
                          {config.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Assignee */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Asignado
                </label>
                <Select defaultValue={ticket.assigneeId || 'unassigned'}>
                  <SelectTrigger className="w-full h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Sin asignar</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback className="text-[8px]">{user.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          {user.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Story Points */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Story Points
                </label>
                <Select defaultValue={ticket.storyPoints?.toString() || 'none'}>
                  <SelectTrigger className="w-full h-9">
                    <SelectValue placeholder="Sin estimar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin estimar</SelectItem>
                    {[1, 2, 3, 5, 8, 13, 21].map((points) => (
                      <SelectItem key={points} value={points.toString()}>
                        {points} puntos
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-2">
                Descripción
              </label>
              <div className="p-3 rounded-lg bg-muted/50 min-h-[100px]">
                <p className="text-sm leading-relaxed">{ticket.description}</p>
              </div>
            </div>

            {/* Labels */}
            <div className="mb-6">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-2">
                Etiquetas
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {ticket.labels.map((label) => (
                  <Badge key={label.id} variant="secondary" className="text-xs">
                    {label.name}
                  </Badge>
                ))}
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-muted-foreground">
                  <Plus className="h-3 w-3 mr-1" />
                  Añadir
                </Button>
              </div>
            </div>

            {/* Subtasks */}
            {false && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Subtareas ({ticket.subtasks.filter(s => s.completed).length}/{ticket.subtasks.length})
                  </label>
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                    <Plus className="h-3 w-3 mr-1" />
                    Añadir
                  </Button>
                </div>
                <div className="space-y-2">
                  {ticket.subtasks.map((subtask) => (
                    <div 
                      key={subtask.id}
                      className={cn(
                        "flex items-center gap-3 p-2 rounded-lg border transition-colors cursor-pointer",
                        subtask.completed ? "bg-muted/30" : "hover:bg-muted/50"
                      )}
                    >
                      {subtask.completed ? (
                        <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                      <span className={cn(
                        "text-sm flex-1",
                        subtask.completed && "text-muted-foreground line-through"
                      )}>
                        {subtask.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Details */}
            <div className="mb-6 space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <User className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground w-20">Reportado</span>
                <div className="flex items-center gap-2">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={reporter?.avatar} />
                    <AvatarFallback className="text-[8px]">{reporter?.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span>{reporter?.name}</span>
                </div>
              </div>

              {watchers.length > 0 && (
                <div className="flex items-center gap-3 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground w-20">Watchers</span>
                  <div className="flex items-center -space-x-1">
                    {watchers.map((watcher, i) => watcher && (
                      <Avatar key={i} className="h-5 w-5 border-2 border-background">
                        <AvatarImage src={watcher.avatar} />
                        <AvatarFallback className="text-[8px]">{watcher.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground w-20">Creado</span>
                <span>{formatDate(ticket.createdAt)}</span>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground w-20">Actualizado</span>
                <span>{formatDate(ticket.updatedAt)}</span>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Comments */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="h-4 w-4" />
                <h3 className="text-sm font-semibold">Comentarios ({ticketComments.length})</h3>
              </div>

              {/* New Comment */}
              <div className="flex gap-3 mb-6">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={users[0].avatar} />
                  <AvatarFallback>{users[0].name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <Textarea 
                    placeholder="Escribe un comentario..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[80px] resize-none"
                  />
                  <div className="flex justify-end">
                    <Button size="sm" disabled={!newComment.trim()}>
                      Comentar
                    </Button>
                  </div>
                </div>
              </div>

              {/* Comments List */}
              <div className="space-y-4">
                {ticketComments.map((comment) => {
                  const author = users.find(u => u.id === comment.userId)
                  return (
                    <div key={comment.id} className="flex gap-3">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage src={author?.avatar} />
                        <AvatarFallback>{author?.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">{author?.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatRelativeTime(comment.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
