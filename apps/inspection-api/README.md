# Inspection API

API NestJS para la estructura organizacional y el catálogo de activos de
GridAssets.

## Contrato local

- Puerto: `3005`
- Prefijo: `/api`
- Base PostgreSQL: `inspection_db`
- Migraciones: `INSPECTION_MIGRATIONS_RUN=true`
- Sincronización automática de esquema: desactivada; todos los cambios usan
  migraciones.

## Desarrollo local

Desde la raíz del monorepo:

```bash
docker compose up -d postgres
npx nx serve inspection-api
```

El Compose de desarrollo publica PostgreSQL en `localhost:5432`. La API carga
las credenciales generales desde `.env`, usa `inspection_db` como base
predeterminada y ejecuta migraciones cuando
`INSPECTION_MIGRATIONS_RUN=true`. El Compose de producción no publica ese
puerto porque sus servicios se comunican por la red privada de Docker.

## Endpoints internos

```text
GET /api/health
GET /api/tenants
GET /api/tenants/:tenantId/sites
GET /api/tenants/:tenantId/asset-types
POST /api/tenants/:tenantId/asset-types
PATCH /api/tenants/:tenantId/asset-types/:assetTypeId
GET /api/tenants/:tenantId/asset-types/:assetTypeId/work-types
PUT /api/tenants/:tenantId/asset-types/:assetTypeId/work-types/:workTypeId
DELETE /api/tenants/:tenantId/asset-types/:assetTypeId/work-types/:workTypeId
GET /api/tenants/:tenantId/work-types
POST /api/tenants/:tenantId/work-types
PATCH /api/tenants/:tenantId/work-types/:workTypeId
GET /api/tenants/:tenantId/sites/:siteId/assets
GET /api/tenants/:tenantId/sites/:siteId/assets/:assetId
GET /api/tenants/:tenantId/sites/:siteId/assets/:assetId/work-types
GET /api/tenants/:tenantId/sites/:siteId/assets/:assetId/work-type-configurations
PUT /api/tenants/:tenantId/sites/:siteId/assets/:assetId/work-type-configurations/:workTypeId
DELETE /api/tenants/:tenantId/sites/:siteId/assets/:assetId/work-type-configurations/:workTypeId
POST /api/tenants/:tenantId/sites/:siteId/assets
PATCH /api/tenants/:tenantId/sites/:siteId/assets/:assetId
DELETE /api/tenants/:tenantId/sites/:siteId/assets/:assetId
```

El BFF publica el mismo catálogo y sus mutaciones bajo `/api/inspection`. La
API exige siempre `tenantId` y `siteId` para consultar o modificar activos. La
base también impide relacionar sitios, activos, tipos y habilitaciones con un
tenant diferente. `assets.asset_type_id` referencia el catálogo de tipos de su
empresa. La configuración específica de un activo tiene prioridad sobre la de
su tipo al calcular los trabajos permitidos. Los nodos raíz deben ser
subestaciones, no se pueden crear ciclos y un activo con hijos no se puede
eliminar.

Asociar un trabajo a un tipo de activo crea la regla heredada para todos sus
equipos; desasociarlo elimina esa regla. En un activo concreto, `PUT` guarda una
excepción `enabled: true|false` y `DELETE` la elimina para volver a heredar. Un
tipo de catálogo se retira mediante `PATCH active=false`, conservando sus
referencias. `SUBSTATION` permanece activo y con su código protegido porque
identifica los nodos raíz.

La autenticación multi-tenant todavía no forma parte de este módulo. Cuando se
implemente, el BFF deberá obtener el tenant permitido desde la sesión y no desde
una selección libre del navegador.

## Pendiente para la siguiente iteración

- Obtener `tenantId` desde una sesión autenticada y validar sus permisos en el
  BFF.
- Incorporar auditoría de cambios antes de habilitar mutaciones en producción.
