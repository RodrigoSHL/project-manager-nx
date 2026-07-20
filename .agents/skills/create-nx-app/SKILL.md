---
name: create-nx-app
description: Crea e integra aplicaciones nuevas en el monorepo Nx de Project Manager, incluyendo apps NestJS o Next.js, módulos y servicios, PostgreSQL, migraciones, variables y secretos, BFF, Docker Compose, Caddy, despliegue OCI y validaciones. Usar cuando Codex deba agregar una API, frontend, microservicio o aplicación completa al monorepo, replicar el patrón de project-api/user-api/travel-planner-api/files-api, conectar una base nueva o dejar una app preparada para producción.
---

# Crear una aplicación Nx

## Cargar las fuentes operativas

Leer completamente, antes de diseñar o editar:

1. `../deploy-oci-app/SKILL.md`.
2. `../../../docs/ADDING_APPLICATION_OCI.md`.
3. `references/integration-checklist.md`.

Leer además los archivos reales que entren en alcance. La guía no reemplaza el
estado del repositorio.

## Descubrir el estado

Ejecutar `bash scripts/inspect-workspace.sh` desde el directorio de esta skill.
Pasar opcionalmente `<slug> <puerto> <base>` para detectar colisiones:

```text
bash scripts/inspect-workspace.sh inventory-api 3005 inventory_db
```

Comprobar también `git status --short` y preservar cambios del usuario. Si se
inspeccionan `.env` o `.env.deploy`, mostrar solo nombres de variables; nunca
valores.

## Clasificar el alcance

Determinar si se solicita:

- solo API NestJS;
- solo frontend Next.js;
- aplicación completa API + frontend;
- integración local, productiva o despliegue efectivo.

No desplegar, crear DNS ni modificar producción si el usuario solo pidió
implementación local.

## Definir el contrato

Registrar antes de generar:

- slug Nx de API y frontend;
- puerto interno único;
- base, prefijo de variables y credenciales que reutiliza;
- variable y URL Docker del BFF;
- prefijos HTTP públicos;
- health endpoint;
- autenticación/autorización;
- migraciones y datos iniciales;
- dominio, si corresponde.

Inferir nombres consistentes y el siguiente puerto libre cuando sea seguro.
Detenerse solo si una decisión cambia materialmente el producto.

## Generar con Nx

Usar siempre el generador instalado en el repositorio. Leer primero el schema
local en `node_modules/@nx/<plugin>/src/generators/application/schema.json` y
hacer un `--dry-run` cuando las opciones no sean evidentes.

Patrón NestJS vigente:

```text
NX_DAEMON=false nx generate @nx/nest:application apps/<api> \
  --name=<api> --linter=eslint --unitTestRunner=jest \
  --e2eTestRunner=none --strict --no-interactive
```

Usar el generador `@nx/next:application` para Next.js con las opciones del
schema local. No construir manualmente un proyecto que Nx puede generar.

Si aparece `Waiting for graph construction`, comprobar procesos activos y
usar `nx reset`; no borrar `.nx` a ciegas. Si Console Ninja inyecta Webpack y
falla con `EPERM 127.0.0.1`, repetir el mismo comando con la autorización de
ejecución necesaria, no cambiar el comando Nx.

## Implementar por capas

Aplicar solo las capas del alcance, en este orden:

1. API NestJS, dominio, DTOs, entidades, health y tests.
2. PostgreSQL y migraciones.
3. Frontend Next.js con `NEXT_PUBLIC_API_URL=/api`.
4. Cliente/controlador/proxy BFF.
5. Compose, dependencias y health checks.
6. Caddy y dominio.
7. variables de ejemplo y documentación común.
8. script/perfil de despliegue si la app debe ser seleccionable.

Para TypeORM, cargar `.env` antes de resolver opciones. Preferir
`TypeOrmModule.forRootAsync` y una función de configuración; evitar constantes
que lean `process.env` durante la importación de módulos. Usar variables
específicas de la app con fallback a `DATABASE_*` solo para desarrollo.

Crear migraciones reales. Permitir `synchronize` solo como comodidad local y
forzar `TYPEORM_SYNCHRONIZE=false` en producción.

## Manejar bases y secretos

- Agregar nombres y valores no sensibles a `env.example` y
  `env.deploy.example`.
- No inventar, imprimir ni commitear contraseñas, JWT, claves cloud o tokens.
- Modificar `.env` local solo dentro del alcance solicitado y sin mostrar sus
  valores.
- Respaldar `.env.deploy` remoto antes de modificarlo y nunca reemplazarlo con
  el archivo local.
- Agregar la base a `docker/init-db.sh` para volúmenes nuevos.
- En un volumen existente, respaldar PostgreSQL y crear la base manualmente;
  no borrar ni recrear el volumen.
- Confirmar propietario y privilegios de la base con el usuario que usará la
  API.

## Integrar red y producción

No publicar APIs internos ni PostgreSQL con `ports`. Entre contenedores usar
nombres Compose (`postgres`, `<api>`, `bff-api`), nunca `localhost`.

Si se integra al BFF, agregar su variable URL, ruta/cliente y dependencia
saludable. Si se publica frontend, agregar Caddy, CORS y dominio. Si debe
desplegarse con `scripts/deploy-oci.sh`, actualizar las listas/perfiles del
script; no dejar un servicio presente en Compose pero imposible de seleccionar.

Para producción, seguir `deploy-oci-app` y preferir:

```text
npm run deploy:oci:dry-run
npm run deploy:oci
```

## Validar y entregar

Ejecutar la sección aplicable de `references/integration-checklist.md`. Como
mínimo exigir lint, tests, build Nx, `docker compose config --quiet`, build de
imágenes afectadas, health y flujo funcional principal.

Cerrar indicando:

- contrato y endpoints creados;
- archivos y servicios modificados;
- variables agregadas sin revelar secretos;
- validaciones y resultados;
- acciones manuales de base/DNS/despliegue;
- backup/rollback si se tocó producción;
- estado de Git y commit.
