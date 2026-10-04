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
- `member` - Miembro
- `analyst` - Analista
- `technician` - Técnico
- `tech_lead` - Tech Lead
- `developer` - Desarrollador
- `devops` - DevOps
- `product_owner` - Product Owner
- `scrum_master` - Scrum Master
- `qa` - QA
- `designer` - Diseñador
- `architect` - Arquitecto

Miembro, Analista y Técnico se guardan como `member`, `analyst` y `technician`.
Compose de producción desactiva la sincronización automática en project-api.
Con `PROJECT_MIGRATIONS_RUN=true`, TypeORM ejecuta las migraciones pendientes al
iniciar la API y las registra en su tabla `migrations`, igual que en inspection-api.
[AddProjectTeamRoles](src/migrations/1790812800000-AddProjectTeamRoles.ts) amplía
el enum y admite bases donde esos valores ya existen. El rollback exige que los
roles nuevos no estén asignados; PostgreSQL rechaza la conversión si están en uso.

### Respuestas a comentarios

`comments.parentCommentId` relaciona una respuesta con otro comentario del mismo
ticket. La API valida esa pertenencia al crear la respuesta; editar un comentario
solo cambia su contenido. La migración `AddCommentReplies` añade la columna,
el índice y la clave foránea. Si se elimina el comentario original, `ON DELETE
SET NULL` conserva sus respuestas como comentarios independientes.

### Notificaciones de menciones en Jira

Al crear un comentario o respuesta, Project API detecta las menciones persistidas
por el selector de Jira Web (`@{member:<uuid>:<nombre codificado>}`). Al editar,
detecta las menciones añadidas. Escribir un nombre como texto libre no identifica
a una cuenta. Los miembros deben estar activos y vinculados mediante `userId` a
un usuario real; no se notifica al autor de su propio comentario.

El comentario y sus eventos se guardan en una misma transacción PostgreSQL. Una
restricción única limita el aviso a uno por comentario/usuario, incluso al quitar
y volver a añadir una mención. No se generan avisos retroactivos para comentarios
anteriores a la activación. La migración `AddCommentMentionNotifications` crea la
tabla e índices; `PROJECT_MIGRATIONS_RUN=true` la aplica al iniciar sobre el esquema
existente. En una base nueva de desarrollo, la sincronización también la crea.

Un worker interno reclama un evento cada cinco segundos con `FOR UPDATE SKIP
LOCKED` y una reserva de dos minutos. Comprueba la mención actual, proyecto,
miembro activo, roles del usuario y acceso al workspace antes de enviar. Usa el
email actual de User API y llama directamente a la plantilla de Mailer API.
Los administradores mantienen el acceso global existente. El BFF sigue atendiendo
los comentarios de Jira Web y aplica sus controles de acceso habituales.

Activación:

```env
# Project API: el mismo token configurado en Mailer
JIRA_MENTION_EMAILS_ENABLED=true
MAILER_API_URL=http://localhost:3006/api
MAILER_SERVICE_TOKEN=<token interno compartido>
USER_API_URL=http://localhost:3001/api
# Mailer API: destino del botón del correo
JIRA_WEB_URL=http://localhost:4201
```

Los ejemplos dejan los avisos desactivados. En producción, usar
`JIRA_WEB_URL=https://jira.atomdev.cl` y las variables/secretos en `.env.deploy`.
Compose configura las URLs internas de Project API; ejecutar Mailer junto con
Project API y User API, y reconstruir Jira Web para habilitar la navegación.

```sh
docker compose --env-file .env.deploy -f docker-compose.prod.yml \
  --profile mailer up -d --build mailer-api project-api jira-web
```

El contenido se congela antes del primer envío para conservar idéntico payload y
clave `jira-mention/<comment-id>/<user-id>` en los reintentos. Si cambia el email
del usuario se omite el evento, evitando enviarlo a la dirección anterior. Los
fallos transitorios usan backoff de 5 segundos hasta 10 minutos, máximo ocho
intentos dentro de 23 horas; los permanentes terminan como `failed`. Esta ventana
queda dentro de las 24 horas de idempotencia de Resend. No se reintenta después
de esa ventana, ni se altera el remitente/configuración durante un reintento.
`sent` con código `accepted` significa aceptación del proveedor, no entrega.

Para diagnosticar eventos, consultar `status`, `attempts`, `lastCode` y
`nextAttemptAt` en `comment_mention_notifications`. Los estados terminales son
`sent`, `failed` y `skipped`; no hay UI para reenvío manual ni webhooks de entrega.
La tabla conserva contenido del correo; eliminar un comentario elimina sus eventos
mediante FK en cascada. Los logs contienen solo ID del evento y código del error.

Validación completa en una base temporal local, con User API de prueba y Mailer
real usando un proveedor simulado (no consume cuota ni envía correo):

```sh
docker run -d --name jira-mention-validation \
  -e POSTGRES_PASSWORD=mention-validation-only -e POSTGRES_DB=jira_mention_validation \
  -p 127.0.0.1:31547:5432 postgres:15-alpine
JIRA_MENTION_TEST_DATABASE_URL=postgres://postgres:mention-validation-only@127.0.0.1:31547/jira_mention_validation \
  npx ts-node --project tsconfig.base.json \
  --compiler-options '{"module":"CommonJS","esModuleInterop":true}' scripts/verify-jira-mention-flow.ts
docker rm -f jira-mention-validation
```

El script exige exactamente esa base en localhost/127.0.0.1, crea fixtures y prueba
migración up/down, cola persistente, deduplicación, permisos, réplicas concurrentes,
contrato HTTP de plantilla, reintentos, respuestas y borrado en cascada. Usar una
base vacía por ejecución.

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

3. **Ejecutar migraciones sobre una base existente**:
   - Configurar `PROJECT_MIGRATIONS_RUN=true` y `TYPEORM_SYNCHRONIZE=false`.
   - Iniciar project-api; TypeORM ejecuta las migraciones pendientes.
   - El catálogo actual de migraciones amplía el esquema existente; no crea
     todas las tablas de una instalación nueva. En desarrollo, la sincronización
     de TypeORM sigue disponible para inicializar una base nueva.

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
