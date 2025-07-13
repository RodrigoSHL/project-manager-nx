"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Save, 
  X, 
  Cloud,
  Server,
  Database,
  Globe,
  Zap,
  Shield,
  Activity,
  CheckCircle,
  AlertCircle
} from "lucide-react"
import { Project, CloudService } from "@/types/project"
import { ProjectService } from "@/services/projectService"

const CLOUD_PROVIDERS = [
  { value: 'aws', label: 'AWS', icon: Cloud, color: 'text-orange-600' },
  { value: 'azure', label: 'Azure', icon: Cloud, color: 'text-blue-600' },
  { value: 'gcp', label: 'Google Cloud', icon: Cloud, color: 'text-red-600' },
  { value: 'digital_ocean', label: 'Digital Ocean', icon: Cloud, color: 'text-blue-500' },
  { value: 'heroku', label: 'Heroku', icon: Cloud, color: 'text-purple-600' },
  { value: 'vercel', label: 'Vercel', icon: Cloud, color: 'text-black' },
  { value: 'netlify', label: 'Netlify', icon: Cloud, color: 'text-green-600' }
]

const SERVICE_TYPES = [
  'Compute',
  'Storage',
  'Database',
  'Networking',
  'Security',
  'Monitoring',
  'Analytics',
  'AI/ML',
  'CDN',
  'Load Balancer',
  'Container',
  'Serverless',
  'Other'
]

interface EditCloudServicesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  project: Project
  onProjectUpdate: (project: Project) => void
}

export function EditCloudServicesDialog({ 
  open, 
  onOpenChange, 
  project, 
  onProjectUpdate 
}: EditCloudServicesDialogProps) {
  const [cloudServices, setCloudServices] = useState<CloudService[]>([])
  const [editingService, setEditingService] = useState<CloudService | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && project) {
      setCloudServices(project.cloudServices || [])
    }
  }, [open, project])

  const resetForm = () => {
    setEditingService({
      id: '',
      name: '',
      provider: '',
      serviceType: '',
      description: '',
      endpoint: '',
      region: '',
      isActive: true,
      configuration: '',
      projectId: project.id
    })
    setIsEditing(false)
  }

  const handleAddService = () => {
    resetForm()
    setIsEditing(true)
  }

  const handleEditService = (service: CloudService) => {
    setEditingService({ ...service })
    setIsEditing(true)
  }

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este servicio cloud?')) {
      return
    }

    const updatedServices = cloudServices.filter(service => service.id !== serviceId)
    setCloudServices(updatedServices)
    
    try {
      const updatedProject = await ProjectService.granularUpdateProject(project.id, {
        cloudServices: {
          delete: [serviceId]
        }
      })
      onProjectUpdate(updatedProject)
    } catch (error) {
      console.error('Error al eliminar el servicio cloud:', error)
      // Revertir cambios en caso de error
      setCloudServices(project.cloudServices || [])
    }
  }

  const handleSaveService = async () => {
    if (!editingService || !editingService.name || !editingService.provider || !editingService.serviceType) {
      alert('Por favor completa los campos requeridos')
      return
    }

    setLoading(true)
    try {
      if (editingService.id && !editingService.id.startsWith('temp-')) {
        // Actualizar servicio existente
        const updatedProject = await ProjectService.granularUpdateProject(project.id, {
          cloudServices: {
            update: [{
              id: editingService.id,
              name: editingService.name,
              provider: editingService.provider,
              serviceType: editingService.serviceType,
              description: editingService.description,
              endpoint: editingService.endpoint,
              region: editingService.region,
              isActive: editingService.isActive,
              configuration: editingService.configuration
            }]
          }
        })
        
        onProjectUpdate(updatedProject)
        setIsEditing(false)
        setEditingService(null)
      } else {
        // Agregar nuevo servicio
        const updatedProject = await ProjectService.granularUpdateProject(project.id, {
          cloudServices: {
            add: [{
              name: editingService.name,
              provider: editingService.provider,
              serviceType: editingService.serviceType,
              description: editingService.description,
              endpoint: editingService.endpoint,
              region: editingService.region,
              isActive: editingService.isActive,
              configuration: editingService.configuration
            }]
          }
        })
        
        onProjectUpdate(updatedProject)
        setIsEditing(false)
        setEditingService(null)
      }
    } catch (error) {
      console.error('Error al guardar el servicio cloud:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditingService(null)
  }

  const getProviderIcon = (provider: string) => {
    const providerInfo = CLOUD_PROVIDERS.find(p => p.value === provider)
    if (providerInfo) {
      const IconComponent = providerInfo.icon
      return <IconComponent className={`h-4 w-4 ${providerInfo.color}`} />
    }
    return <Cloud className="h-4 w-4 text-gray-600" />
  }

  const getProviderLabel = (provider: string) => {
    const providerInfo = CLOUD_PROVIDERS.find(p => p.value === provider)
    return providerInfo ? providerInfo.label : provider
  }

  const getServiceTypeIcon = (type: string) => {
    const iconMap: Record<string, any> = {
      'Compute': Server,
      'Storage': Database,
      'Database': Database,
      'Networking': Globe,
      'Security': Shield,
      'Monitoring': Activity,
      'Analytics': Activity,
      'AI/ML': Zap,
      'CDN': Globe,
      'Load Balancer': Server,
      'Container': Server,
      'Serverless': Zap,
      'Other': Cloud
    }
    const IconComponent = iconMap[type] || Cloud
    return <IconComponent className="h-4 w-4 text-gray-600" />
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[95vw] !w-[95vw] md:!max-w-[70vw] md:!w-[70vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            Gestionar Servicios Cloud
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Lista de servicios existentes */}
          {!isEditing && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Servicios Cloud Configurados</h3>
                <Button onClick={handleAddService} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Servicio
                </Button>
              </div>

              {cloudServices.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Servicio</TableHead>
                      <TableHead>Proveedor</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Región</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cloudServices.map((service) => (
                      <TableRow key={service.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{service.name}</div>
                            {service.description && (
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {service.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getProviderIcon(service.provider)}
                            <Badge variant="outline">{getProviderLabel(service.provider)}</Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getServiceTypeIcon(service.serviceType)}
                            <span className="text-sm">{service.serviceType}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {service.isActive ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-gray-400" />
                            )}
                            <Badge variant={service.isActive ? "default" : "secondary"}>
                              {service.isActive ? "Activo" : "Inactivo"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">
                            {service.region || '-'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditService(service)}
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => service.id && handleDeleteService(service.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Cloud className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>No hay servicios cloud configurados</p>
                  <p className="text-sm">Haz clic en &quot;Agregar Servicio&quot; para comenzar</p>
                </div>
              )}
            </div>
          )}

          {/* Formulario de edición */}
          {isEditing && editingService && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{editingService.id ? 'Editar' : 'Agregar'} Servicio Cloud</span>
                  <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                    <X className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre del Servicio *</Label>
                    <Input
                      id="name"
                      value={editingService.name}
                      onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                      placeholder="Ej: EKS Cluster, S3 Bucket, RDS Database"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="provider">Proveedor Cloud *</Label>
                    <Select
                      value={editingService.provider}
                      onValueChange={(value) => setEditingService({ ...editingService, provider: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar proveedor" />
                      </SelectTrigger>
                      <SelectContent>
                        {CLOUD_PROVIDERS.map((provider) => (
                          <SelectItem key={provider.value} value={provider.value}>
                            <div className="flex items-center gap-2">
                              {getProviderIcon(provider.value)}
                              {provider.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="serviceType">Tipo de Servicio *</Label>
                    <Select
                      value={editingService.serviceType}
                      onValueChange={(value) => setEditingService({ ...editingService, serviceType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {SERVICE_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            <div className="flex items-center gap-2">
                              {getServiceTypeIcon(type)}
                              {type}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="region">Región</Label>
                    <Input
                      id="region"
                      value={editingService.region || ''}
                      onChange={(e) => setEditingService({ ...editingService, region: e.target.value })}
                      placeholder="Ej: us-east-1, eu-west-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endpoint">Endpoint/URL</Label>
                  <Input
                    id="endpoint"
                    value={editingService.endpoint || ''}
                    onChange={(e) => setEditingService({ ...editingService, endpoint: e.target.value })}
                    placeholder="https://api.example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={editingService.description || ''}
                    onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                    placeholder="Descripción del servicio y su propósito en el proyecto"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="configuration">Configuración (JSON)</Label>
                  <Textarea
                    id="configuration"
                    value={editingService.configuration || ''}
                    onChange={(e) => setEditingService({ ...editingService, configuration: e.target.value })}
                    placeholder="JSON configuration"
                    rows={4}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={editingService.isActive}
                    onCheckedChange={(checked) => setEditingService({ ...editingService, isActive: checked })}
                  />
                  <Label htmlFor="isActive">Servicio Activo</Label>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={handleCancelEdit}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveService} disabled={loading}>
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Guardar
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 