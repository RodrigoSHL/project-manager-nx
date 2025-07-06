# API de Gestión de Proyectos

Esta API proporciona una gestión completa de proyectos técnicos con información detallada sobre repositorios, equipos, tareas, tecnologías y más.

## Estructura de Datos

### Entidad Principal: Project

La entidad `Project` es el núcleo del sistema y contiene:

- **Información básica**: nombre, descripción, unidad de negocio
- **Estado y prioridad**: estado actual del proyecto y nivel de prioridad
- **Metadatos**: versión, fechas de inicio/fin, branch principal
- **Configuración**: tipo de autenticación, instrucciones de acceso
- **Relaciones**: con todas las entidades relacionadas

### Entidades Relacionadas

#### 1. Repository
- Información de repositorios de código
- URLs, branches, versiones
- Estado de actividad

#### 2. Environment
- Entornos de despliegue (local, staging, producción)
- URLs y configuraciones
- Credenciales y notas

#### 3. TeamMember
- Miembros del equipo del proyecto
- Roles y contactos
- Fechas de participación

#### 4. Task
- Tareas y roadmap del proyecto
- Estados y prioridades
- Fechas límite y asignaciones

#### 5. Technology
- Tecnologías utilizadas en el proyecto
- Categorías (frontend, backend, infraestructura)
- Versiones y documentación

#### 6. CloudService
- Servicios cloud utilizados
- Proveedores (AWS, Azure, GCP)
- Configuraciones y endpoints

#### 7. UsefulLink
- Enlaces útiles del proyecto
- Tipos (documentación, monitoreo, comunicación)
- Orden y estado

## Endpoints Disponibles

### Proyectos

```
GET    /projects              - Obtener todos los proyectos
GET    /projects/:id          - Obtener proyecto por ID
POST   /projects              - Crear nuevo proyecto
PATCH  /projects/:id          - Actualizar proyecto
DELETE /projects/:id          - Eliminar proyecto
GET    /projects/stats        - Estadísticas de proyectos
GET    /projects/status/:status - Proyectos por estado
GET    /projects/business-unit/:businessUnit - Proyectos por unidad de negocio
```

### Ejemplo de Creación de Proyecto

```json
{
  "name": "Sistema de Gestión Empresarial",
  "businessUnit": "Tecnología e Innovación",
  "description": "Plataforma integral para la gestión de recursos empresariales",
  "status": "production",
  "priority": "high",
  "version": "v2.1.3",
  "startDate": "2023-01-15",
  "mainBranch": "main",
  "authenticationType": "SSO (Single Sign-On)",
  "repositories": [
    {
      "name": "empresa/sistema-gestion",
      "url": "https://github.com/empresa/sistema-gestion",
      "description": "Repositorio principal"
    }
  ],
  "environments": [
    {
      "type": "local",
      "url": "localhost:3000",
      "description": "Desarrollo local"
    },
    {
      "type": "production",
      "url": "app.empresa.com",
      "description": "Entorno productivo"
    }
  ],
  "teamMembers": [
    {
      "name": "Ana García",
      "email": "ana.garcia@empresa.com",
      "role": "tech_lead"
    }
  ],
  "tasks": [
    {
      "title": "Migración a AWS EKS",
      "description": "Migrar a Kubernetes",
      "priority": "high",
      "dueDate": "2024-03-15"
    }
  ],
  "technologyIds": ["uuid1", "uuid2"],
  "cloudServices": [
    {
      "name": "AWS EKS",
      "provider": "aws",
      "serviceType": "Orquestación de contenedores"
    }
  ],
  "usefulLinks": [
    {
      "title": "Documentación Técnica",
      "url": "https://docs.empresa.com",
      "type": "documentation"
    }
  ]
}
```

## Estados y Enums

### ProjectStatus
- `planning` - En planificación
- `development` - En desarrollo
- `testing` - En pruebas
- `staging` - En staging
- `production` - En producción
- `maintenance` - En mantenimiento
- `deprecated` - Deprecado

### ProjectPriority
- `low` - Baja
- `medium` - Media
- `high` - Alta
- `critical` - Crítica

### TeamRole
- `tech_lead` - Tech Lead
- `developer` - Desarrollador
- `devops` - DevOps
- `product_owner` - Product Owner
- `scrum_master` - Scrum Master
- `qa` - QA
- `designer` - Diseñador
- `architect` - Arquitecto

### TaskStatus
- `todo` - Por hacer
- `in_progress` - En progreso
- `review` - En revisión
- `done` - Completado
- `cancelled` - Cancelado

### TechnologyCategory
- `frontend` - Frontend
- `backend` - Backend
- `database` - Base de datos
- `infrastructure` - Infraestructura
- `tool` - Herramienta
- `framework` - Framework
- `library` - Biblioteca

### CloudProvider
- `aws` - Amazon Web Services
- `azure` - Microsoft Azure
- `gcp` - Google Cloud Platform
- `digital_ocean` - Digital Ocean
- `heroku` - Heroku
- `vercel` - Vercel
- `netlify` - Netlify

## Configuración de Base de Datos

### PostgreSQL

```sql
-- Ejemplo de configuración de base de datos
CREATE DATABASE project_management;
CREATE USER project_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE project_management TO project_user;
```

### Variables de Entorno

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=project_management
DATABASE_USERNAME=project_user
DATABASE_PASSWORD=secure_password
```

## Instalación y Configuración

1. **Instalar dependencias**:
   ```bash
   npm install
   ```

2. **Configurar base de datos**:
   - Crear base de datos PostgreSQL
   - Configurar variables de entorno

3. **Ejecutar migraciones**:
   ```bash
   npm run migration:run
   ```

4. **Ejecutar seeds** (opcional):
   ```bash
   npm run seed
   ```

5. **Iniciar servidor**:
   ```bash
   npm run start:dev
   ```

## Características Principales

- ✅ Gestión completa de proyectos
- ✅ Relaciones complejas entre entidades
- ✅ Validación de datos con class-validator
- ✅ Documentación automática con Swagger
- ✅ Manejo de errores centralizado
- ✅ Logging estructurado
- ✅ Tests unitarios y de integración
- ✅ Migraciones de base de datos
- ✅ Seeds de datos de ejemplo

## Próximas Mejoras

- [ ] Autenticación y autorización
- [ ] Notificaciones en tiempo real
- [ ] Integración con sistemas externos (GitHub, Jira)
- [ ] Dashboard de métricas
- [ ] Exportación de datos
- [ ] API de búsqueda avanzada
- [ ] Cache con Redis
- [ ] Monitoreo y alertas 