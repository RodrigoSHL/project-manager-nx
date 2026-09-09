# Agregar y desplegar una aplicación en OCI

## Objetivo

Esta guía documenta el flujo para agregar una aplicación al monorepo Nx y publicarla bajo `atomdev.cl`. Incluye frontend Next.js, API NestJS, BFF, PostgreSQL, Docker, Caddy, Oracle Cloud y Cloudflare.

No copies secretos desde `.env` o `.env.deploy` a commits, documentación, imágenes o logs.

## Arquitectura actual

```text
Navegador
  -> Cloudflare (HTTPS)
  -> Caddy en atomdev-server (HTTPS)
  -> frontend o /api/*
  -> BFF
  -> API interno
  -> PostgreSQL interno
```

| Recurso | Valor actual |
|---|---|
| Región | `sa-santiago-1` |
| VM | `atomdev-server`, ARM64, 4 OCPU, 24 GB |
| IP origen | `161.153.194.227` |
| Directorio remoto | `/home/ubuntu/project-manager-nx` |
| Compose | `docker-compose.prod.yml` |
| Entorno remoto | `.env.deploy` |

| Dominio | Aplicación |
|---|---|
| `atomdev.cl`, `www.atomdev.cl` | Atom Dev Landing |
| `projects.atomdev.cl` | Project Web |
| `jira.atomdev.cl` | Jira Web |
| `travel.atomdev.cl` | Travel Planner |

OCI solo debe publicar `22`, `80` y `443`. Los APIs, PostgreSQL y puertos auxiliares permanecen internos o ligados a `127.0.0.1`.

## 1. Diseñar la aplicación

Antes de crear archivos, completar una matriz:

| Dato | Ejemplo |
|---|---|
| Frontend Nx | `inventory-web` |
| API Nx | `inventory-api` |
| Puerto API | `3004` |
| Base | `inventory_db` |
| Variable DB | `INVENTORY_DB_NAME` |
| Variable BFF | `INVENTORY_API_URL` |
| URL interna | `http://inventory-api:3004/api` |
| Dominio | `inventory.atomdev.cl` |

Cada API necesita un puerto interno único. Los frontends pueden usar `3000` dentro de sus respectivos contenedores.

## 2. Implementar el API NestJS

El target Nx debe producir `dist/apps/<api>/main.js`, porque `Dockerfile.api` copia esa ruta.

En `main.ts`:

```ts
const prefix = process.env.API_PREFIX || 'api';
app.setGlobalPrefix(prefix);

const origins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

app.enableCors({ origin: origins, credentials: true });
await app.listen(process.env.PORT || 3004);
```

Exponer un health check sin autenticación:

```ts
@Get('health')
health() {
  return { status: 'ok' };
}
```

Configurar TypeORM mediante variables específicas:

```ts
export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.INVENTORY_DB_HOST || 'localhost',
  port: Number(process.env.INVENTORY_DB_PORT || 5432),
  username: process.env.INVENTORY_DB_USERNAME || 'postgres',
  password: process.env.INVENTORY_DB_PASSWORD || 'postgres',
  database: process.env.INVENTORY_DB_NAME || 'inventory_db',
  entities: [/* entidades */],
  synchronize: process.env.TYPEORM_SYNCHRONIZE === 'true',
  ssl: process.env.DATABASE_SSL === 'true'
    ? { rejectUnauthorized: false }
    : false,
};
```

Crear migraciones y usar `TYPEORM_SYNCHRONIZE=false` antes de tratar el sistema como producción estable.

## 3. Implementar el frontend Next.js

El navegador debe llamar al mismo origen:

```ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api';
```

Producción usa:

```text
NEXT_PUBLIC_API_URL=/api
```

No incorporar al bundle:

```text
http://161.153.194.227/api
http://localhost:3000/api
http://bff-api:3000/api
```

`NEXT_PUBLIC_*` se fija durante `next build`. Cambiar `.env.deploy` no corrige una imagen existente: hay que reconstruirla.

Si Next requiere un rewrite ejecutado del lado servidor:

```js
async rewrites() {
  return [{
    source: '/api/:path*',
    destination: `${process.env.INTERNAL_API_URL || 'http://bff-api:3000'}/api/:path*`,
  }];
}
```

`INTERNAL_API_URL` nunca lleva el prefijo `NEXT_PUBLIC_`.

El build de producción debe validar Next y TypeScript. Si `useSearchParams()` bloquea el prerender, moverlo a un componente hijo envuelto en `Suspense`.

## 4. Integrar el BFF

Crear un cliente interno o una ruta proxy:

```ts
const baseUrl = (
  process.env.INVENTORY_API_URL || 'http://localhost:3004/api'
).replace(/\/$/, '');
```

En Compose, el valor correcto es:

```text
INVENTORY_API_URL=http://inventory-api:3004/api
```

Nunca usar `localhost` para comunicación entre contenedores. Usar nombres de servicio como `inventory-api`, `bff-api` y `postgres`.

Agregar el dominio nuevo a `CORS_ORIGIN` y hacer que el BFF dependa del health check del API.

## 5. Preparar PostgreSQL

Para instalaciones nuevas, agregar la variable al servicio `postgres` y extender `docker/init-db.sh`:

```bash
if [ -n "$INVENTORY_DB_NAME" ] && [ "$INVENTORY_DB_NAME" != "$POSTGRES_DB" ]; then
  create_db_if_missing "$INVENTORY_DB_NAME"
fi
```

Los scripts de `/docker-entrypoint-initdb.d` se ejecutan solo al crear el volumen. En una VM ya operativa:

1. crear un backup;
2. comprobar si la base existe;
3. crearla manualmente una vez;
4. iniciar el API.

Backup previo:

```bash
docker exec <postgres-container> \
  sh -c 'pg_dumpall -U "$POSTGRES_USER"' \
  | gzip > /home/ubuntu/backups/pre-inventory-YYYYMMDD.sql.gz
```

Creación conceptual dentro del contenedor:

```bash
psql -v ON_ERROR_STOP=1 \
  -U "$POSTGRES_USER" \
  -d "$POSTGRES_DB" \
  -c 'CREATE DATABASE inventory_db'
```

No borrar el volumen PostgreSQL para agregar una base.

## 6. Dockerizar

Reutilizar `Dockerfile.api`:

```bash
docker build -f Dockerfile.api \
  --build-arg APP=inventory-api \
  -t project-manager-nx-inventory-api .
```

Reutilizar `Dockerfile.next`:

```bash
docker build -f Dockerfile.next \
  --build-arg APP=inventory-web \
  --build-arg NEXT_PUBLIC_API_URL=/api \
  -t project-manager-nx-inventory-web .
```

La VM es ARM64. Construir imágenes `linux/arm64` o multi-arquitectura si el build se mueve a un CI AMD64.

`.dockerignore` debe excluir `.env*`, `*.key`, `*.pem`, `.git`, `node_modules`, `.nx` y `dist`.

## 7. Agregar a Docker Compose

API:

```yaml
inventory-api:
  build:
    context: .
    dockerfile: Dockerfile.api
    args:
      APP: inventory-api
  restart: unless-stopped
  environment:
    NODE_ENV: production
    PORT: 3004
    API_PREFIX: api
    INVENTORY_DB_HOST: postgres
    INVENTORY_DB_PORT: 5432
    INVENTORY_DB_NAME: ${INVENTORY_DB_NAME:-inventory_db}
    INVENTORY_DB_USERNAME: ${DATABASE_USERNAME:-project_user}
    INVENTORY_DB_PASSWORD: ${DATABASE_PASSWORD:?DATABASE_PASSWORD is required}
    DATABASE_SSL: ${DATABASE_SSL:-false}
    TYPEORM_SYNCHRONIZE: ${TYPEORM_SYNCHRONIZE:-false}
    CORS_ORIGIN: ${CORS_ORIGIN}
  depends_on:
    postgres:
      condition: service_healthy
  healthcheck:
    test: ["CMD", "node", "-e", "require('http').get('http://127.0.0.1:3004/api/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"]
    interval: 10s
    timeout: 5s
    retries: 10
```

No agregar `ports` al API.

Frontend:

```yaml
inventory-web:
  build:
    context: .
    dockerfile: Dockerfile.next
    args:
      APP: inventory-web
      NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL:-/api}
  restart: unless-stopped
  environment:
    NODE_ENV: production
    PORT: 3000
    NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL:-/api}
    INTERNAL_API_URL: http://bff-api:3000
  depends_on:
    bff-api:
      condition: service_healthy
```

En `bff-api`, agregar `INVENTORY_API_URL` y la dependencia saludable. En `caddy`, agregar `inventory-web` como `service_started`.

## 8. Configurar Caddy

Usar un snippet:

```caddyfile
(inventory_web) {
  encode gzip

  handle /api/* {
    reverse_proxy bff-api:3000
  }

  handle {
    reverse_proxy inventory-web:3000
  }
}

inventory.atomdev.cl {
  import inventory_web
}
```

Si `rsync` reemplaza el inode del `Caddyfile`, el bind mount puede conservar la versión anterior. Si `caddy reload` dice `config is unchanged`, recrear solo Caddy:

```bash
docker compose --env-file .env.deploy \
  -f docker-compose.prod.yml \
  up -d --force-recreate --no-deps caddy
```

## 9. Variables de despliegue

Actualizar `env.deploy.example` con valores no secretos y modificar el `.env.deploy` remoto sin imprimir secretos:

```text
INVENTORY_DB_NAME=inventory_db
NEXT_PUBLIC_API_URL=/api
```

Agregar `https://inventory.atomdev.cl` a `CORS_ORIGIN`.

Respaldar `.env.deploy` antes de editarlo. No reemplazarlo con el `.env` local.

## 10. Validar localmente

Validar sintaxis:

```bash
DATABASE_PASSWORD=validation-only \
JWT_SECRET=validation-only \
docker compose -f docker-compose.prod.yml config --quiet
```

Construir todo lo afectado:

```bash
NEXT_PUBLIC_API_URL=/api \
docker compose -f docker-compose.prod.yml \
  build inventory-api inventory-web bff-api
```

No desplegar si falla Nx, Webpack, Next.js o TypeScript.

Buscar URLs antiguas en `.next/static`; el origen HTTP no debe aparecer.

## 11. Desplegar en Oracle

### Script interactivo recomendado

Para aplicaciones ya integradas en Compose, ejecutar desde la raíz del repo:

```bash
npm run deploy:oci
```

El script `scripts/deploy-oci.sh` guía la selección de servicios y automatiza:

1. verificación de la clave SSH mediante fingerprint;
2. validación local de Compose y build Docker opcional;
3. preflight de la VM y simulación de `rsync`;
4. backup completo de PostgreSQL, `.env.deploy`, Compose y Caddy;
5. etiquetas de imágenes `rollback-<timestamp>`;
6. sincronización sin secretos ni artefactos;
7. build ARM64 remoto mientras los contenedores actuales siguen activos;
8. reemplazo ordenado API → BFF → frontend → Caddy;
9. health checks, revisión de bundle y smoke tests HTTPS.

Para comprobar el alcance sin modificar producción:

```bash
npm run deploy:oci:dry-run
```

También admite uso explícito:

```bash
bash scripts/deploy-oci.sh --profile travel-full
bash scripts/deploy-oci.sh --services travel-planner-api,bff-api,travel-planner-app
ATOMDEV_SSH_KEY=/ruta/segura/oci.key bash scripts/deploy-oci.sh --dry-run
```

La clave puede estar temporalmente en la raíz si termina en `.key`; Git y Docker la
ignoran. El script crea una copia temporal con permisos `0600`, valida su fingerprint
y la elimina al terminar. Aun así, para almacenamiento permanente se recomienda
guardarla fuera del repo, por ejemplo en `~/.ssh/`.

### Preflight

En `/home/ubuntu/project-manager-nx` comprobar:

```bash
docker compose ls
docker compose --env-file .env.deploy -f docker-compose.prod.yml ps
df -h /
sudo ss -lnt
```

### Sincronización

Usar `rsync` excluyendo:

```text
.git
node_modules
.nx
dist
.env
.env.deploy
*.key
*.pem
.DS_Store
```

### Orden de despliegue

1. Backup y base.
2. API.
3. BFF.
4. Frontend.
5. Caddy.

```bash
docker compose --env-file .env.deploy -f docker-compose.prod.yml \
  up -d --build --no-deps inventory-api

docker compose --env-file .env.deploy -f docker-compose.prod.yml \
  up -d --build --no-deps bff-api

docker compose --env-file .env.deploy -f docker-compose.prod.yml \
  up -d --build --no-deps inventory-web

docker compose --env-file .env.deploy -f docker-compose.prod.yml \
  up -d --force-recreate --no-deps caddy
```

`--no-deps` evita recrear PostgreSQL y servicios no relacionados. Usarlo solo si las dependencias ya están activas.

Comprobar `docker compose ps` y logs. API y BFF deben quedar saludables.

## 12. Configurar Cloudflare

La delegación de `atomdev.cl` ya apunta a Cloudflare. Para aplicaciones nuevas no se modifica NIC Chile.

Crear:

| Type | Name | Content | Estado inicial |
|---|---|---|---|
| A | `inventory` | `161.153.194.227` | DNS only |

Secuencia:

1. Crear como DNS only.
2. Confirmar resolución a la IP OCI.
3. Confirmar que Caddy obtiene el certificado.
4. Probar `https://inventory.atomdev.cl`.
5. Mantener SSL/TLS en `Full (strict)`.
6. Activar `Proxied`.
7. Verificar una IP de Cloudflare y el header `server: cloudflare`.

Nunca usar `Flexible`.

## 13. Validación final

```bash
dig +short A inventory.atomdev.cl

curl -sS -o /dev/null \
  -w '%{http_code} %{remote_ip}\n' \
  https://inventory.atomdev.cl/

curl -sS -o /dev/null \
  -w '%{http_code}\n' \
  https://inventory.atomdev.cl/api/health
```

Con proxy activo, DNS debe devolver IPs de Cloudflare. Frontend y health deben responder `200`.

En DevTools verificar:

- sin `blocked:mixed-content`;
- sin llamadas a la IP OCI;
- sin llamadas HTTP;
- sin errores CORS;
- llamadas a `/api` correctas.

## 14. Rollback

Antes de desplegar conservar imágenes anteriores y backups.

Si falla un servicio:

1. identificar la imagen anterior;
2. restaurar etiqueta o digest;
3. recrear solo ese servicio con `--no-deps`;
4. verificar health y HTTP.

No ejecutar `docker system prune` durante la ventana de rollback. No borrar el volumen PostgreSQL.

Si falla Caddy, restaurar el archivo respaldado y recrear solo Caddy.

## 15. Problemas encontrados durante la instalación inicial

### Mixed content

El bundle antiguo contenía `http://161.153.194.227/api`. Se corrigió con `/api` y reconstruyendo Projects y Jira. Cambiar una variable sin reconstruir Next.js no basta.

### Base ausente

`travel_planner_db` no apareció al actualizar Compose porque PostgreSQL ya tenía volumen. Se creó después de respaldar.

### Build Next.js

`useSearchParams()` necesitó `Suspense`. Una actualización de `lucide-react` retiró exports de marca como `Github` y `Figma`; el build completo permitió detectarlo antes de reemplazar producción.

### Caddy sin cambios

Después de `rsync`, el contenedor conservó el inode anterior del bind mount. Fue necesario recrear únicamente Caddy.

### SSH durante builds

Una sesión puede perder respuesta por carga de CPU o I/O. Antes de repetir, reconectar y revisar contenedores e imágenes: el build puede haber terminado.

## Checklist

### Código

- [ ] Slugs, puerto, base y dominio definidos.
- [ ] API compila y expone health.
- [ ] Frontend usa `/api`.
- [ ] BFF conoce y espera al API.
- [ ] CORS incluye el dominio.
- [ ] Build de producción y TypeScript pasan.

### Docker y datos

- [ ] API y frontend agregados sin puertos públicos.
- [ ] Contexto Docker excluye secretos.
- [ ] Backup verificado.
- [ ] Base creada o migrada.
- [ ] Imágenes compatibles con ARM64.

### Despliegue

- [ ] Servicios existentes preservados.
- [ ] API y BFF saludables.
- [ ] Caddy enruta frontend y `/api`.
- [ ] DNS only funciona antes del proxy.
- [ ] Certificado de origen válido.
- [ ] Cloudflare Full (strict) y Proxied.
- [ ] HTTPS y API responden `200`.
- [ ] Sin mixed content ni CORS.
- [ ] Sin puertos públicos innecesarios.
- [ ] Rollback disponible.
