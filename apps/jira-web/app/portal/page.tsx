'use client'

import * as React from 'react'
import {
  LifeBuoy, ChevronRight, CheckCircle2, AlertCircle,
  Loader2, ArrowLeft, Folder, Send,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { getProjects } from '@/services/projectService'
import { createTicket } from '@/services/ticketService'
import type { ApiProject, ApiTicket } from '@/types/project'

// ─── Config ──────────────────────────────────────────────────────────────────

const PRIORITY_OPTIONS: { value: ApiTicket['priority']; label: string; description: string; color: string; dot: string }[] = [
  {
    value: 'urgent',
    label: 'Urgente',
    description: 'El sistema está caído o bloqueando operaciones críticas',
    color: 'text-destructive border-destructive/30 bg-destructive/5',
    dot: 'bg-destructive',
  },
  {
    value: 'high',
    label: 'Alta',
    description: 'Funcionalidad importante afectada, hay un workaround',
    color: 'text-orange-600 border-orange-500/30 bg-orange-500/5',
    dot: 'bg-orange-500',
  },
  {
    value: 'medium',
    label: 'Media',
    description: 'Problema menor con impacto limitado en las operaciones',
    color: 'text-yellow-700 dark:text-yellow-400 border-yellow-500/30 bg-yellow-500/5',
    dot: 'bg-yellow-500',
  },
  {
    value: 'low',
    label: 'Baja',
    description: 'Pregunta, mejora o duda sin urgencia inmediata',
    color: 'text-muted-foreground border-border bg-muted/30',
    dot: 'bg-muted-foreground',
  },
]

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ step, current }: { step: number; current: number }) {
  const done = step < current
  const active = step === current
  return (
    <div className={cn(
      'flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold border-2 transition-all',
      done  && 'bg-primary border-primary text-primary-foreground',
      active && 'border-primary text-primary bg-primary/5',
      !done && !active && 'border-border text-muted-foreground',
    )}>
      {done ? <CheckCircle2 className="h-4 w-4" /> : step}
    </div>
  )
}

// ─── Portal page ──────────────────────────────────────────────────────────────

export default function SupportPortalPage() {
  const [step, setStep] = React.useState<1 | 2 | 3>(1)

  // Step 1 state
  const [projects, setProjects]         = React.useState<ApiProject[]>([])
  const [loadingProjects, setLoadingProjects] = React.useState(true)
  const [selectedProject, setSelectedProject] = React.useState<ApiProject | null>(null)

  // Step 2 state
  const [contactName, setContactName]   = React.useState('')
  const [contactEmail, setContactEmail] = React.useState('')
  const [title, setTitle]               = React.useState('')
  const [description, setDescription]   = React.useState('')
  const [priority, setPriority]         = React.useState<ApiTicket['priority']>('medium')

  // Step 3 state
  const [createdTicket, setCreatedTicket] = React.useState<ApiTicket | null>(null)
  const [submitting, setSubmitting]       = React.useState(false)
  const [error, setError]                 = React.useState('')

  React.useEffect(() => {
    getProjects()
      .then(setProjects)
      .catch(console.error)
      .finally(() => setLoadingProjects(false))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProject) return
    setSubmitting(true)
    setError('')
    try {
      const description_full = [
        description.trim(),
        contactName  ? `\n\n**Contacto:** ${contactName}`   : '',
        contactEmail ? `**Email:** ${contactEmail}` : '',
      ].filter(Boolean).join('')

      const ticket = await createTicket(selectedProject.id, {
        title:       title.trim(),
        description: description_full || undefined,
        type:        'support',
        priority,
        status:      'todo',
      })
      setCreatedTicket(ticket)
      setStep(3)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error al enviar la solicitud')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReset = () => {
    setStep(1)
    setSelectedProject(null)
    setContactName(''); setContactEmail(''); setTitle(''); setDescription('')
    setPriority('medium'); setCreatedTicket(null); setError('')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-sky-500/10">
            <LifeBuoy className="h-4.5 w-4.5 text-sky-500" />
          </div>
          <div className="flex-1">
            <span className="font-semibold text-sm">Portal de Soporte</span>
            <span className="hidden sm:inline text-muted-foreground text-sm"> · FlowBoard</span>
          </div>
          {selectedProject && step !== 3 && (
            <Badge variant="outline" className="text-xs gap-1.5">
              <span
                className="w-2 h-2 rounded-sm"
                style={{ backgroundColor: selectedProject.color ?? '#6366f1' }}
              />
              {selectedProject.name}
            </Badge>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 sm:py-12">

        {/* ── Step 3: Success ── */}
        {step === 3 && createdTicket && (
          <div className="flex flex-col items-center gap-6 text-center py-8">
            <div className="relative">
              <div className="flex items-center justify-center w-20 h-20 rounded-3xl bg-emerald-500/10">
                <CheckCircle2 className="h-10 w-10 text-emerald-500" />
              </div>
              <div className="absolute -bottom-1 -right-1 flex items-center justify-center w-8 h-8 rounded-full bg-sky-500/10 border-2 border-background">
                <LifeBuoy className="h-4 w-4 text-sky-500" />
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold">¡Solicitud enviada!</h1>
              <p className="text-muted-foreground">
                Hemos recibido tu reporte. Nuestro equipo lo revisará y te contactará a la brevedad.
              </p>
            </div>

            <Card className="w-full p-5 text-left space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-sky-500/10 shrink-0">
                  <LifeBuoy className="h-5 w-5 text-sky-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-mono">{createdTicket.key}</p>
                  <p className="font-semibold text-sm">{createdTicket.title}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 pt-1">
                <Badge className="bg-secondary text-secondary-foreground border-0 text-xs gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-foreground" />
                  Por revisar
                </Badge>
                <Badge variant="outline" className="text-xs gap-1.5">
                  <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: selectedProject?.color ?? '#6366f1' }} />
                  {selectedProject?.name}
                </Badge>
              </div>
            </Card>

            <p className="text-sm text-muted-foreground">
              Guarda el código <span className="font-mono font-semibold text-foreground">{createdTicket.key}</span> para hacer seguimiento de tu solicitud.
            </p>

            <Button variant="outline" onClick={handleReset} className="gap-2 mt-2">
              <LifeBuoy className="h-4 w-4" />
              Enviar otro soporte
            </Button>
          </div>
        )}

        {step !== 3 && (
          <>
            {/* Progress */}
            <div className="flex items-center gap-3 mb-8">
              <StepIndicator step={1} current={step} />
              <div className={cn('flex-1 h-0.5 rounded-full transition-all', step > 1 ? 'bg-primary' : 'bg-border')} />
              <StepIndicator step={2} current={step} />
            </div>

            {/* ── Step 1: Select project ── */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="text-center space-y-1.5">
                  <h1 className="text-2xl font-bold tracking-tight">¿Para qué proyecto?</h1>
                  <p className="text-muted-foreground">Selecciona el proyecto en el que tienes el problema</p>
                </div>

                {loadingProjects ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : projects.length === 0 ? (
                  <Card className="p-8 text-center">
                    <p className="text-muted-foreground text-sm">No hay proyectos disponibles</p>
                  </Card>
                ) : (
                  <div className="grid gap-3">
                    {projects.map(project => (
                      <button
                        key={project.id}
                        type="button"
                        onClick={() => { setSelectedProject(project); setStep(2) }}
                        className={cn(
                          'flex items-center gap-4 p-4 rounded-xl border text-left',
                          'hover:border-primary/40 hover:bg-accent/40 transition-all duration-150',
                          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                        )}
                      >
                        <div
                          className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0 text-white font-bold text-sm"
                          style={{ backgroundColor: project.color ?? '#6366f1' }}
                        >
                          {project.shortName ?? project.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{project.name}</p>
                          {project.description && (
                            <p className="text-xs text-muted-foreground truncate mt-0.5">{project.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {project.status === 'production' && (
                            <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/30">
                              Producción
                            </Badge>
                          )}
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Step 2: Form ── */}
            {step === 2 && selectedProject && (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="text-center space-y-1.5">
                  <h1 className="text-2xl font-bold tracking-tight">Cuéntanos el problema</h1>
                  <p className="text-muted-foreground">
                    Mientras más detalle nos das, más rápido podemos ayudarte
                  </p>
                </div>

                {/* Contact */}
                <Card className="p-4 space-y-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Tu información de contacto
                  </p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="contact-name">Nombre</Label>
                      <Input
                        id="contact-name"
                        placeholder="Juan Pérez"
                        value={contactName}
                        onChange={e => setContactName(e.target.value)}
                        autoFocus
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="contact-email">Email</Label>
                      <Input
                        id="contact-email"
                        type="email"
                        placeholder="juan@empresa.cl"
                        value={contactEmail}
                        onChange={e => setContactEmail(e.target.value)}
                      />
                    </div>
                  </div>
                </Card>

                {/* Issue */}
                <Card className="p-4 space-y-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Detalle del problema
                  </p>

                  <div className="space-y-1.5">
                    <Label htmlFor="issue-title">
                      Resumen del problema <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="issue-title"
                      placeholder="Ej: El módulo de facturas no carga"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="issue-desc">Descripción detallada</Label>
                    <Textarea
                      id="issue-desc"
                      placeholder="Describe qué ocurre, cuándo empezó, qué pasos generan el error, qué impacto tiene..."
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      rows={5}
                      className="resize-none"
                    />
                  </div>
                </Card>

                {/* Priority */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">
                    ¿Qué tan urgente es? <span className="text-destructive">*</span>
                  </Label>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {PRIORITY_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setPriority(opt.value)}
                        className={cn(
                          'flex items-start gap-3 p-3 rounded-xl border text-left transition-all duration-150',
                          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                          priority === opt.value
                            ? cn('border-2', opt.color, 'ring-0')
                            : 'border-border hover:bg-accent/40',
                        )}
                      >
                        <span className={cn('w-2.5 h-2.5 rounded-full mt-1 shrink-0', opt.dot)} />
                        <div>
                          <p className="text-sm font-semibold leading-none mb-1">{opt.label}</p>
                          <p className="text-xs text-muted-foreground leading-snug">{opt.description}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-destructive/10 text-destructive text-sm">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-3 pt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setStep(1)}
                    className="gap-2"
                    disabled={submitting}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Volver
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting || !title.trim()}
                    className="flex-1 gap-2"
                    size="lg"
                  >
                    {submitting ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Enviando...</>
                    ) : (
                      <><Send className="h-4 w-4" /> Enviar solicitud</>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </>
        )}
      </main>
    </div>
  )
}
