# Notification API

Servicio transversal NestJS para almacenar notificaciones de los distintos
backends del monorepo. Se genera y administra con Nx, como Mailer API.

| Recurso                        | Contrato                                                   |
| ------------------------------ | ---------------------------------------------------------- |
| Proyecto Nx / servicio Compose | `notification-api`                                         |
| Puerto interno                 | `3008`                                                     |
| URL entre contenedores         | `http://notification-api:3008/api`                         |
| Base PostgreSQL                | `notification_db`, configurable con `NOTIFICATION_DB_NAME` |
| Health                         | `GET /api/health`, comprueba PostgreSQL, sin autenticación |
| Autenticación                  | `Authorization: Bearer <NOTIFICATION_SERVICE_TOKEN>`       |
| Perfil Compose / despliegue    | `notification` / `notification-backend`                    |

El servicio se comunica por la red Compose. Jira Web consulta su historial
mediante las rutas autenticadas del BFF `GET /api/jira/notifications` y
`PATCH /api/jira/notifications/:projectId/:id/read`. El BFF conserva el token
de servicio en el servidor.

## Modelo y alcance

Cada notificación contiene `id` UUID, `application` (slug, por ejemplo `jira`),
`projectId`, `recipientId`, `type` (por defecto `info`), `title`, `body`, `metadata`
JSON, `eventKey` opcional, `readAt` y `createdAt`.

`projectId` y `recipientId` son identificadores opacos del sistema de origen;
no hay claves foráneas entre bases. En aplicaciones sin proyectos, el productor
puede utilizar un identificador estable de su espacio o tenant como `projectId`.
Los tres campos de alcance son obligatorios al crear, consultar y marcar leídas.
Los backends autenticados son de confianza y deben comprobar permisos de usuario
y tenant antes de consultar o escribir: el token de servicio no es un JWT de usuario
ni limita automáticamente a una aplicación concreta. No enviarlo al navegador.

`eventKey` identifica un evento para un destinatario dentro de una aplicación y
proyecto. Repetirlo devuelve el registro original, aunque el contenido recibido
cambie, sin volver a marcarlo como no leído. Un índice único de PostgreSQL también
protege reintentos concurrentes. Sin `eventKey`, cada petición crea un registro.

## Endpoints

Todos salvo health requieren el token de servicio.

| Método | Ruta                              | Resultado                                                                |
| ------ | --------------------------------- | ------------------------------------------------------------------------ |
| POST   | `/api/notifications`              | Crea o recupera por `eventKey`; `201`                                    |
| POST   | `/api/notifications/inbox`        | Lista y cuenta las no leídas en los proyectos autorizados |
| GET    | `/api/notifications`              | Lista paginada `{ items, total, page, limit }`                           |
| GET    | `/api/notifications/unread-count` | `{ count }` de no leídas                                                 |
| PATCH  | `/api/notifications/:id/read`     | Marca leída, conserva la primera fecha; `404` si no pertenece al alcance |

Las consultas y el PATCH exigen `application`, `projectId` y `recipientId` como
query params. El listado acepta `status=all|read|unread` (default `all`), `page`
(default 1) y `limit` (default 20, máximo 100), ordenados por fecha e ID descendentes.
Los cuerpos JSON están limitados a 256 KiB; título a 200 caracteres, cuerpo a
10.000 y `eventKey` a 200 caracteres imprimibles sin espacios. Campos adicionales,
valores nulos y datos inválidos se rechazan con `400`; sin token, `401`.

`POST /api/notifications/inbox` recibe `application`, `recipientId`,
`projectIds` y los filtros de paginación. `projectIds` es la lista que el
backend ya autorizó para esa cuenta. La respuesta incluye `unreadCount`.
Al crear, `occurredAt` puede indicar la fecha original del evento en ISO 8601
para conservar el orden del historial al importar envíos anteriores.

## Consumir desde otro backend

Compose productivo proporciona `NOTIFICATION_API_URL` y
`NOTIFICATION_SERVICE_TOKEN` a Project, User, Travel, Files, Inspection, Mailer,
MacroFit y BFF. Project API publica las menciones de Jira cuyo correo fue
aceptado por Mailer y reintenta desde su cola persistente.

```ts
const response = await fetch(`${process.env.NOTIFICATION_API_URL}/notifications`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${process.env.NOTIFICATION_SERVICE_TOKEN}`,
    'Content-Type': 'application/json',
  },
  signal: AbortSignal.timeout(5000),
  body: JSON.stringify({
    application: 'jira',
    projectId: project.id,
    recipientId: recipient.id,
    type: 'comment.mention',
    title: 'Te mencionaron en un comentario',
    body: 'Hay un nuevo comentario para revisar.',
    eventKey: `comment-mention/${comment.id}/${recipient.id}`,
    metadata: { ticketId: ticket.id, commentId: comment.id },
  }),
});
if (!response.ok) throw new Error(`Notification API returned ${response.status}`);
```

## Configuración y ejecución local

Configurar `.env` usando `env.example`:

- `NOTIFICATION_SERVICE_TOKEN`: token aleatorio de 32 a 256 caracteres sin espacios,
  compartido únicamente entre backends autorizados; obligatorio al iniciar.
- `NOTIFICATION_API_PORT=3008` (fallback a `PORT`).
- `NOTIFICATION_DB_HOST`, `NOTIFICATION_DB_PORT`, `NOTIFICATION_DB_USERNAME`,
  `NOTIFICATION_DB_PASSWORD`: fallback a `DATABASE_*` para ejecución local.
- `NOTIFICATION_DB_NAME=notification_db`.
- `NOTIFICATION_MIGRATIONS_RUN=true`: ejecuta migraciones al iniciar, por defecto
  habilitado. `synchronize` siempre permanece deshabilitado.

```bash
# PostgreSQL local; en un volumen nuevo init-db.sh crea notification_db.
docker compose up -d postgres

# Ejecutar API con Nx y las credenciales de .env.
NX_DAEMON=false npx nx serve notification-api

# Alternativa: API y PostgreSQL dentro de Compose, sin publicar el puerto 3008.
docker compose --profile notification up -d --build notification-api
```

Si PostgreSQL ya tiene volumen, sus scripts init no se repiten. Respaldar antes
de crear la nueva base, comprobar que no exista, y crearla con el propietario
usado por la API. No eliminar el volumen. El script de despliegue ya realiza este
paso después de su backup para instalaciones productivas existentes.

## Validaciones y despliegue

```bash
NX_DAEMON=false npx nx run-many -t lint,test,build -p notification-api --parallel=1
DATABASE_PASSWORD=validation-only JWT_SECRET=validation-only \
  docker compose -f docker-compose.prod.yml --profile notification config --quiet
docker compose -f docker-compose.prod.yml build notification-api
node scripts/validate-notification-runtime.mjs

# Solo cuando corresponda desplegar a OCI y estén configurados los secretos:
bash scripts/deploy-oci.sh --profile notification-backend
```

La validación de runtime crea PostgreSQL y API aislados, con credenciales de
prueba, sin puertos publicados ni volúmenes de plataforma. Comprueba inicialización,
propietario, migraciones, persistencia tras reinicio, aislamiento, duplicados
concurrentes, paginación y lectura; elimina sus contenedores y red al terminar.

El perfil `notification-backend` permite desplegarlo de forma independiente,
con backup, creación de base y health interno. `platform-full` conserva su selección
previa; añadir `notification-api` explícitamente cuando su token esté configurado.
Para rollback, conservar imagen anterior y datos; no revertir la migración inicial
sobre una base con notificaciones que deban mantenerse.
