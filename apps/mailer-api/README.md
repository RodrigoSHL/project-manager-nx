# Mailer API

Microservicio NestJS para enviar correo transaccional desde cualquier otro
servicio. Usa HTTP y un contrato independiente del proveedor. No necesita
PostgreSQL, User API, BFF, frontend ni Redis. Puerto predeterminado: **3006**.

## Contrato HTTP

| Método | Ruta          | Autenticación                                  | Resultado                                                   |
| ------ | ------------- | ---------------------------------------------- | ----------------------------------------------------------- |
| GET    | `/api/health` | Pública en la red interna                      | `{ "status": "ok", "service": "mailer-api" }`               |
| POST   | `/api/emails` | `Authorization: Bearer <MAILER_SERVICE_TOKEN>` | `{ "id": "…", "provider": "resend", "status": "accepted" }` |

Cada envío requiere el header `Idempotency-Key`: entre 1 y 256 caracteres ASCII
imprimibles sin espacios. Usar una clave estable por evento, por ejemplo
`user-api/welcome/<user-id>`; incluir el nombre del microservicio evita colisiones
entre consumidores. Para repetir el mismo evento, conservar **clave y payload**.

```json
{
  "to": ["recipient@example.com"],
  "subject": "Bienvenido",
  "text": "Tu cuenta está lista.",
  "html": "<p>Tu cuenta está lista.</p>",
  "cc": ["copy@example.com"],
  "bcc": ["hidden@example.com"],
  "replyTo": "support@example.com"
}
```

`to` y `subject` son obligatorios. Se exige al menos `text` o `html` con contenido.
`cc`, `bcc` y `replyTo` son opcionales; omitirlos cuando no se usen. Los
destinatarios siempre se expresan como arrays de direcciones, sin nombre visible.
Máximo 50 destinatarios entre `to`, `cc` y `bcc`, asunto de hasta 998 caracteres,
y hasta 250.000 caracteres por cuerpo. El JSON HTTP tiene un límite de 1 MiB.
Los campos desconocidos y los valores `null` se rechazan.

El remitente se define en la configuración del servicio. El consumidor no puede
cambiar `from`, elegir proveedor ni acceder a la API key de Resend.

`accepted` significa que Resend aceptó el envío; no confirma entrega en la
bandeja. `noop` devuelve `simulated`, sin enviar ni guardar el correo.
Health verifica que el proceso arrancó con configuración válida; no consulta
Resend ni comprueba DNS, validez de la API key o cuotas disponibles.

## Plantilla de menciones de Jira / FlowBoard

`POST /api/emails/templates/jira-comment-mention` usa el mismo token interno y
`Idempotency-Key` que el envío genérico. Genera HTML responsive y texto plano con
la marca FlowBoard, quién te mencionó, el ticket, el comentario y el botón
**Ver comentario**. Escapa el contenido y construye el enlace con IDs, sin aceptar
URLs del consumidor. No requiere User API ni Project API para renderizarla.

```json
{
  "to": ["recipient@example.com"],
  "recipientName": "Sebastián",
  "authorName": "Carolina",
  "projectName": "Project Manager NX",
  "ticketKey": "PM-142",
  "ticketTitle": "Integrar notificaciones",
  "commentText": "@Sebastián, ¿puedes revisar este cambio?",
  "workspaceId": "00000000-0000-4000-8000-000000000001",
  "projectId": "00000000-0000-4000-8000-000000000002",
  "ticketId": "00000000-0000-4000-8000-000000000003",
  "commentId": "00000000-0000-4000-8000-000000000004"
}
```

Un destinatario por solicitud; nombres/proyecto hasta 255 caracteres, clave de
ticket hasta 20, título hasta 500 y comentario hasta 6.000. Los cuatro IDs deben
ser UUID. La notificación automática se configura en
[Project API](../project-api/README.md#notificaciones-de-menciones-en-jira).

Configurar `JIRA_WEB_URL` en Mailer: `https://jira.atomdev.cl` en producción o
`http://localhost:4201` para desarrollo. Se valida al arrancar: HTTPS para URLs
externas, HTTP permitido únicamente en localhost/127.0.0.1. Jira Web selecciona
el workspace/proyecto accesible, abre el ticket y destaca el comentario; si hace
falta iniciar sesión, conserva esos parámetros durante el login.

Para regenerar la [vista previa](../../docs/email-previews/jira-comment-mention.html)
con datos ficticios, sin enviar correos:

```sh
npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/preview-jira-mention-email.ts
```

## Configuración

La API carga `.env` desde el directorio de ejecución mediante `ConfigModule`.
Las variables de proceso tienen prioridad. Agregar las claves a tu archivo
actual sin reemplazarlo; consultar también `env.example` y `env.deploy.example`.

| Variable               | Uso                                                         |
| ---------------------- | ----------------------------------------------------------- |
| `MAILER_API_PORT`      | Puerto del servidor; default `3006`, fallback `PORT`        |
| `API_PREFIX`           | Prefijo HTTP; default `api`                                 |
| `MAILER_PROVIDER`      | `resend` (default) o `noop` para desarrollo                 |
| `MAILER_SERVICE_TOKEN` | Obligatorio: 32–256 caracteres imprimibles sin espacios     |
| `MAILER_FROM_EMAIL`    | Dirección del remitente, obligatoria                        |
| `MAILER_FROM_NAME`     | Nombre visible opcional; máximo 100 caracteres              |
| `MAILER_TIMEOUT_MS`    | Timeout del proveedor; default `10000`, rango `100`–`60000` |
| `RESEND_API_KEY`       | Obligatoria cuando el proveedor es `resend`                 |
| `MAILER_API_URL`       | URL para los consumidores; no es una variable del servidor  |

Generar un token y almacenarlo solo en los entornos del Mailer y de los
microservicios autorizados:

```sh
openssl rand -hex 32
```

Configuración local sin enviar correos:

```dotenv
MAILER_API_PORT=3006
MAILER_PROVIDER=noop
MAILER_SERVICE_TOKEN=<token-aleatorio-generado>
MAILER_FROM_EMAIL=onboarding@resend.dev
MAILER_FROM_NAME=Project Manager
MAILER_TIMEOUT_MS=10000
MAILER_API_URL=http://localhost:3006/api
```

```sh
npx nx serve mailer-api
```

La API falla al arrancar con configuración inválida o sin el token. `noop` se
rechaza con `NODE_ENV=production`; no existe un fallback silencioso a simulación.
No se habilita CORS porque el contrato está pensado para comunicación entre
servidores. No colocar el token ni la API key en variables `NEXT_PUBLIC_*`.

## Enviar desde otro microservicio

En desarrollo: `MAILER_API_URL=http://localhost:3006/api`.
En la red Compose: `MAILER_API_URL=http://mailer-api:3006/api`.
Agregar `MAILER_API_URL` y `MAILER_SERVICE_TOKEN` al environment del consumidor
cuando se integre un flujo real; no necesita `RESEND_API_KEY`.

Ejemplo de cliente NestJS, copiable al servicio consumidor. Registrar esta clase
en sus `providers` e inyectarla en el servicio que produce el evento:

```ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailerClient {
  constructor(private readonly config: ConfigService) {}

  async sendWelcome(user: { id: string; email: string }) {
    const baseUrl = this.config.getOrThrow<string>('MAILER_API_URL').replace(/\/$/, '');
    const token = this.config.getOrThrow<string>('MAILER_SERVICE_TOKEN');
    const response = await fetch(`${baseUrl}/emails`, {
      method: 'POST',
      signal: AbortSignal.timeout(15000),
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': `user-api/welcome/${user.id}`,
      },
      body: JSON.stringify({
        to: [user.email],
        subject: 'Bienvenido',
        text: 'Tu cuenta está lista.',
      }),
    });
    const result = await response.json();
    if (!response.ok) {
      // Gestionar result.code / result.retryable en el flujo consumidor.
      throw new Error(`Mailer API returned ${response.status}`);
    }
    return result; // id, provider, status
  }
}
```

Para probar HTTP manualmente, exportar el token local en la terminal antes del
comando; `.env` se carga en Nest pero no exporta variables a tu shell:

```sh
curl http://localhost:3006/api/health
curl -X POST http://localhost:3006/api/emails \
  -H "Authorization: Bearer $MAILER_SERVICE_TOKEN" \
  -H 'Idempotency-Key: manual/test-1' \
  -H 'Content-Type: application/json' \
  -d '{"to":["recipient@example.com"],"subject":"Prueba","text":"Hola desde Mailer API"}'
```

## Resend

Integración mediante la [API HTTP oficial](https://resend.com/docs/api-reference/emails/send-email),
usando `fetch` de Node 20+. No requiere el SDK, React Email ni nuevas dependencias.

1. Crear una cuenta y una API key con permiso para enviar correos, restringida
   al dominio de envío cuando corresponda.
2. Agregar y verificar el dominio o subdominio remitente siguiendo los registros
   DNS indicados por Resend. Ver [documentación de dominios](https://resend.com/docs/dashboard/domains/introduction).
3. Configurar `MAILER_PROVIDER=resend`, `RESEND_API_KEY` y
   `MAILER_FROM_EMAIL` con una dirección de ese dominio. Los secretos se pasan
   en runtime, nunca durante el build.
4. Arrancar la API y hacer un envío controlado a un destinatario autorizado.

Para pruebas con `onboarding@resend.dev`, Resend restringe el destinatario al
correo de tu cuenta; para enviar a otros destinatarios se exige un dominio
verificado. Ver [errores de Resend](https://resend.com/docs/api-reference/errors).

Según el [plan transaccional](https://resend.com/pricing?product=transactional)
consultado el **4 de octubre de 2026**, el plan Free incluye 3.000 correos al mes,
100 diarios y 3 dominios. Pro parte de USD 20/mes por 50.000 correos mensuales.
Revisar los límites vigentes antes de configurar una implementación.

El adaptador reenvía `Idempotency-Key` a Resend, que conserva las claves
[durante 24 horas](https://resend.com/docs/dashboard/emails/idempotency-keys).
La deduplicación funciona entre réplicas de Mailer sin una base compartida,
siempre que usen la misma cuenta, remitente y payload. Pasada esa ventana, la
clave no impide un nuevo envío. `noop` no deduplica: cada simulación genera un ID.

## Errores y reintentos

Los errores del proveedor se normalizan sin exponer su body, credenciales,
destinatarios o contenido. Incluyen `statusCode`, `code`, `message`, `retryable`
y, si existe, `retryAfterSeconds` numérico.

| HTTP / code                                                   | Acción del consumidor                                            |
| ------------------------------------------------------------- | ---------------------------------------------------------------- |
| `400`                                                         | Corregir DTO o idempotency key                                   |
| `401`                                                         | Corregir el token interno                                        |
| `409 / idempotency_conflict`                                  | Misma clave con payload distinto; revisar el evento              |
| `409 / request_in_progress`                                   | Reintentar después con la misma clave y payload                  |
| `422 / provider_rejected_message`                             | Corregir el mensaje                                              |
| `429 / provider_rate_limited`                                 | Esperar `retryAfterSeconds` cuando exista; usar backoff          |
| `429 / daily_quota_exceeded` o `monthly_quota_exceeded`       | Esperar el reset de cuota o cambiar el plan                      |
| `503 / provider_configuration_error`                          | Revisar API key, dominio y permisos                              |
| `502`, `503 / provider_unavailable`, `504 / provider_timeout` | Reintentar solo si `retryable=true`, conservando clave y payload |

No hay reintentos automáticos, cola, historial persistente ni fallback entre
proveedores. Si la conexión falla después de aceptar Resend el envío, el
resultado puede ser incierto; conservar la clave en el reintento evita duplicar
dentro de su ventana de 24 horas. Para garantizar la conservación de eventos
cuando caiga el servicio, el consumidor debe persistirlos mediante outbox/cola.
Para confirmar entrega, rebotes o aperturas, una siguiente implementación puede
añadir webhooks verificados y almacenamiento de estado.

## Agregar otro proveedor

`MailerService` recibe el token de inyección `MAIL_PROVIDER`, cuyo contrato
`MailProvider.send(MailMessage): Promise<MailResult>` está en
`src/app/mailer/mail-provider.ts`.

Implementar un adaptador SMTP, SES u otro proveedor con ese contrato, validar su
configuración en `MailerConfig` y agregarlo al factory de `MailerModule`.
Normalizar errores con `MailProviderError` y documentar la garantía de
idempotencia que ofrece. No es necesario cambiar controlador, DTO ni consumidores.
El factory selecciona un proveedor por instancia de servicio; desplegar
instancias separadas si dos implementaciones requieren cuentas distintas.

## Docker y despliegue

Se reutiliza `Dockerfile.api`; Compose no publica el puerto del API y no lo
añade a las dependencias de otros servicios. El perfil opcional `mailer` permite
incorporarlo cuando estén listos sus secretos.

```sh
# Local, simulación; lee .env
docker compose --profile mailer up -d --build mailer-api

# Producción: requiere .env.deploy con proveedor resend y credenciales reales
docker compose --env-file .env.deploy -f docker-compose.prod.yml \
  --profile mailer up -d --build mailer-api

# Despliegue OCI seleccionable (ejecutar solo cuando se autorice producción)
bash scripts/deploy-oci.sh --profile mailer-backend --dry-run
bash scripts/deploy-oci.sh --profile mailer-backend
```

La selección explícita `--services mailer-api` también está habilitada. El perfil
`platform-full` conserva su selección anterior; añadir Mailer mediante selección
personalizada cuando corresponda. El script verifica health y rechazo de envíos
sin token sin enviar correos reales. No se crea DNS público ni se modifica Caddy.

## Extraer el servicio

El código de la aplicación está contenido en `apps/mailer-api` y usa solo Nest,
ConfigModule, Express, class-validator/class-transformer y APIs nativas de Node.
No importa código de otras aplicaciones del monorepo.

Para un subconjunto de este boilerplate, conservar la carpeta, el tooling Nx
compartido y `Dockerfile.api`. Para un proyecto Nest independiente, copiar `src`,
ajustar su tsconfig y entrypoint al tooling del nuevo repo e instalar esas
dependencias más `reflect-metadata` y `rxjs`. Conservar las variables del servicio
y actualizar únicamente `MAILER_API_URL` en los consumidores.

## Validación

```sh
npx nx lint mailer-api
npx nx test mailer-api
npx nx build mailer-api --configuration=production
DATABASE_PASSWORD=validation-only JWT_SECRET=validation-only \
  docker compose -f docker-compose.prod.yml --profile mailer config --quiet
docker compose -f docker-compose.prod.yml build mailer-api
```

Las pruebas cubren autenticación y validación HTTP, límite de tamaño, selección
por DI, configuración inválida, contrato Resend, timeouts, errores y reintentos.
Los envíos se prueban con mocks y simulación; no consumen la cuota de Resend.
