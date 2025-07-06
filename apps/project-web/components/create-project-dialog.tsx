"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, Plus, Loader2 } from "lucide-react"
import { useProjects } from "@/hooks/useProjects"
import { ProjectStatus, ProjectPriority } from "@/types/project"

const formSchema = z.object({
  name: z.string().min(2, {
    message: "El nombre debe tener al menos 2 caracteres.",
  }),
  shortName: z.string().min(2, {
    message: "El nombre corto debe tener al menos 2 caracteres.",
  }).max(100, {
    message: "El nombre corto debe tener máximo 100 caracteres.",
  }),
  businessUnit: z.string().min(1, {
    message: "Selecciona una unidad de negocio.",
  }),
  description: z.string().min(10, {
    message: "La descripción debe tener al menos 10 caracteres.",
  }),
  repository: z.string().min(1, {
    message: "El repositorio es requerido.",
  }),
  technologies: z.array(z.string()).min(1, {
    message: "Selecciona al menos una tecnología.",
  }),
  status: z.nativeEnum(ProjectStatus).optional(),
  priority: z.nativeEnum(ProjectPriority).optional(),
  version: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  mainBranch: z.string().optional(),
  authenticationType: z.string().optional(),
  accessInstructions: z.string().optional(),
  teamLead: z.string().min(1, {
    message: "El tech lead es requerido.",
  }),
  teamLeadEmail: z.string().email({
    message: "Ingresa un email válido.",
  }),
  teamLeadPhone: z.string().optional(),
})

const businessUnits = [
  "Tecnología e Innovación",
  "Experiencia Digital",
  "Inteligencia de Negocios",
  "Operaciones",
  "Marketing Digital",
  "Recursos Humanos",
]

const availableTechnologies = [
  "React",
  "Next.js",
  "Vue.js",
  "Angular",
  "TypeScript",
  "JavaScript",
  "Node.js",
  "Python",
  "Java",
  "C#",
  "PostgreSQL",
  "MySQL",
  "MongoDB",
  "Redis",
  "Docker",
  "Kubernetes",
  "AWS",
  "Azure",
  "GCP",
  "Firebase",
  "Supabase",
]

const projectStatuses = [
  { value: ProjectStatus.PLANNING, label: "Planificación" },
  { value: ProjectStatus.DEVELOPMENT, label: "En Desarrollo" },
  { value: ProjectStatus.TESTING, label: "En Testing" },
  { value: ProjectStatus.STAGING, label: "En Staging" },
  { value: ProjectStatus.PRODUCTION, label: "En Producción" },
  { value: ProjectStatus.MAINTENANCE, label: "En Mantenimiento" },
  { value: ProjectStatus.DEPRECATED, label: "Deprecado" },
]

const projectPriorities = [
  { value: ProjectPriority.LOW, label: "Baja" },
  { value: ProjectPriority.MEDIUM, label: "Media" },
  { value: ProjectPriority.HIGH, label: "Alta" },
  { value: ProjectPriority.CRITICAL, label: "Crítica" },
]

const authenticationTypes = [
  "JWT",
  "OAuth2",
  "API Key",
  "Basic Auth",
  "SAML",
  "LDAP",
  "SSO",
  "Sin autenticación",
]

const teamRoles = [
  { value: "tech_lead", label: "Tech Lead" },
  { value: "developer", label: "Desarrollador" },
  { value: "devops", label: "DevOps" },
  { value: "product_owner", label: "Product Owner" },
  { value: "scrum_master", label: "Scrum Master" },
  { value: "qa", label: "QA" },
  { value: "designer", label: "Diseñador" },
  { value: "architect", label: "Arquitecto" },
]

interface CreateProjectDialogProps {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onProjectCreated?: (project: any) => void
}

export function CreateProjectDialog({ children, open, onOpenChange, onProjectCreated }: CreateProjectDialogProps) {
  const { createProject } = useProjects()
  const [isLoading, setIsLoading] = React.useState(false)
  const [selectedTechnologies, setSelectedTechnologies] = React.useState<string[]>([])
  const [techInput, setTechInput] = React.useState("")

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      shortName: "",
      businessUnit: "",
      description: "",
      repository: "",
      technologies: [],
      status: ProjectStatus.PLANNING,
      priority: ProjectPriority.MEDIUM,
      version: "",
      startDate: "",
      endDate: "",
      mainBranch: "main",
      authenticationType: "",
      accessInstructions: "",
      teamLead: "",
      teamLeadEmail: "",
      teamLeadPhone: "",
    },
  })

  const addTechnology = (tech: string) => {
    if (tech && !selectedTechnologies.includes(tech)) {
      const newTechnologies = [...selectedTechnologies, tech]
      setSelectedTechnologies(newTechnologies)
      form.setValue("technologies", newTechnologies)
      setTechInput("")
    }
  }

  const removeTechnology = (tech: string) => {
    const newTechnologies = selectedTechnologies.filter((t) => t !== tech)
    setSelectedTechnologies(newTechnologies)
    form.setValue("technologies", newTechnologies)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && techInput.trim()) {
      e.preventDefault()
      addTechnology(techInput.trim())
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)

    try {
      // Preparar datos del proyecto según el DTO de la API
      const projectData = {
        name: values.name,
        shortName: values.shortName,
        businessUnit: values.businessUnit,
        description: values.description,
        status: values.status || ProjectStatus.PLANNING,
        priority: values.priority || ProjectPriority.MEDIUM,
        version: values.version || undefined,
        startDate: values.startDate || undefined,
        endDate: values.endDate || undefined,
        mainBranch: values.mainBranch || "main",
        authenticationType: values.authenticationType || undefined,
        accessInstructions: values.accessInstructions || undefined,
        // Crear repositorio básico
        repositories: [
          {
            name: values.name,
            url: `https://github.com/${values.repository}`,
            mainBranch: values.mainBranch || "main",
          }
        ],
        // Crear tech lead como miembro del equipo
        teamMembers: [
          {
            name: values.teamLead,
            email: values.teamLeadEmail,
            role: "tech_lead",
            phone: values.teamLeadPhone || undefined,
          }
        ],
        // Crear entorno de desarrollo básico
        environments: [
          {
            type: "development",
            url: `https://dev-${values.name.toLowerCase().replace(/\s+/g, "-")}.empresa.com`,
            description: "Entorno de desarrollo",
          }
        ],
      }

      const newProject = await createProject(projectData as any)
      
      onProjectCreated?.(newProject)
      onOpenChange?.(false)

      // Reset form
      form.reset()
      setSelectedTechnologies([])
      setTechInput("")
    } catch (error) {
      console.error("Error al crear proyecto:", error)
      // Aquí podrías mostrar un toast de error
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Proyecto</DialogTitle>
          <DialogDescription>
            Completa la información básica para crear un nuevo proyecto en el sistema.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid gap-6 md:grid-cols-1">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del Proyecto</FormLabel>
                    <FormControl>
                      <Input placeholder="Sistema de Gestión..." className="h-12" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="shortName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre Corto</FormLabel>
                    <FormControl>
                      <Input placeholder="short-name" className="h-12" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="businessUnit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidad de Negocio</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12 w-full">
                          <SelectValue placeholder="Selecciona una unidad" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {businessUnits.map((unit) => (
                          <SelectItem key={unit} value={unit}>
                            {unit}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe el propósito y funcionalidades principales del proyecto..."
                      className="min-h-[120px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Proporciona una descripción detallada del proyecto y sus objetivos.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-6 md:grid-cols-10">
              <div className="md:col-span-7">
                <FormField
                  control={form.control}
                  name="repository"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Repositorio</FormLabel>
                      <FormControl>
                        <Input placeholder="empresa/nombre-proyecto" className="h-12" {...field} />
                      </FormControl>
                      <FormDescription>Formato: organización/repositorio</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="md:col-span-3">
                <FormField
                  control={form.control}
                  name="version"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Versión</FormLabel>
                      <FormControl>
                        <Input placeholder="1.0.0" className="h-12" {...field} />
                      </FormControl>
                      <FormDescription>Versión actual del proyecto</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de Inicio</FormLabel>
                    <FormControl>
                      <Input type="date" className="h-12" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de Finalización</FormLabel>
                    <FormControl>
                      <Input type="date" className="h-12" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2 items-center">
              <FormField
                control={form.control}
                name="mainBranch"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rama Principal</FormLabel>
                    <FormControl>
                      <Input placeholder="main" className="h-12 w-full" {...field} />
                    </FormControl>
                    <FormDescription>Rama principal del repositorio</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="authenticationType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Autenticación</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12 w-full">
                          <SelectValue placeholder="Selecciona tipo de auth" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {authenticationTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>Autenticación principal del sistema</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="accessInstructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instrucciones de Acceso</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe cómo acceder al proyecto, credenciales, etc..."
                      className="min-h-[100px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Instrucciones para acceder al proyecto y sus entornos</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado Inicial</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12 w-full">
                          <SelectValue placeholder="Selecciona un estado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {projectStatuses.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prioridad</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12 w-full">
                          <SelectValue placeholder="Selecciona prioridad" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {projectPriorities.map((priority) => (
                          <SelectItem key={priority.value} value={priority.value}>
                            {priority.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="technologies"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tecnologías</FormLabel>
                  <FormControl>
                    <div className="space-y-4">
                      <div className="flex gap-3">
                        <Input
                          placeholder="Escribe una tecnología y presiona Enter"
                          value={techInput}
                          onChange={(e) => setTechInput(e.target.value)}
                          onKeyPress={handleKeyPress}
                          className="flex-1 h-12"
                        />
                        <Select onValueChange={addTechnology}>
                          <SelectTrigger className="w-[160px] h-12">
                            <SelectValue placeholder="Seleccionar" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableTechnologies
                              .filter((tech) => !selectedTechnologies.includes(tech))
                              .map((tech) => (
                                <SelectItem key={tech} value={tech}>
                                  {tech}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {selectedTechnologies.length > 0 && (
                        <div className="flex flex-wrap gap-3 p-3 bg-muted/30 rounded-lg">
                          {selectedTechnologies.map((tech) => (
                            <Badge key={tech} variant="secondary" className="flex items-center gap-1 px-3 py-1.5 text-sm">
                              {tech}
                              <button
                                type="button"
                                onClick={() => removeTechnology(tech)}
                                className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormDescription>Agrega las tecnologías que se utilizarán en el proyecto.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-6 md:grid-cols-3">
              <FormField
                control={form.control}
                name="teamLead"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tech Lead</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre del líder técnico" className="h-12" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="teamLeadEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email del Tech Lead</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="techlead@empresa.com" className="h-12" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="teamLeadPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono del Tech Lead</FormLabel>
                    <FormControl>
                      <Input placeholder="+56 9 1234 5678" className="h-12" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="pt-6">
              <Button type="button" variant="outline" onClick={() => onOpenChange?.(false)} disabled={isLoading} className="h-12 px-6">
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading} className="h-12 px-6">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Crear Proyecto
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
