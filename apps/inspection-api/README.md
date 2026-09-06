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

## Endpoints internos

```text
GET /api/health
GET /api/tenants
GET /api/tenants/:tenantId/sites
GET /api/tenants/:tenantId/sites/:siteId/assets
GET /api/tenants/:tenantId/sites/:siteId/assets/:assetId
POST /api/tenants/:tenantId/sites/:siteId/assets
PATCH /api/tenants/:tenantId/sites/:siteId/assets/:assetId
DELETE /api/tenants/:tenantId/sites/:siteId/assets/:assetId
```

El BFF publica el mismo catálogo y sus mutaciones bajo `/api/inspection`. La
API exige siempre `tenantId` y `siteId` para consultar o modificar activos. La
base también impide relacionar un sitio o activo padre con un tenant diferente.
Los nodos raíz deben ser subestaciones, no se pueden crear ciclos y un activo
con hijos no se puede eliminar.

La autenticación multi-tenant todavía no forma parte de este módulo. Cuando se
implemente, el BFF deberá obtener el tenant permitido desde la sesión y no desde
una selección libre del navegador.

## Pendiente para la siguiente iteración

- Obtener `tenantId` desde una sesión autenticada y validar sus permisos en el
  BFF.
- Agregar comandos de creación y edición cuando el módulo visual los necesite.
- Incorporar auditoría de cambios antes de habilitar mutaciones en producción.
