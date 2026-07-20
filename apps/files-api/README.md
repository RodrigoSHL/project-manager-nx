# Files API

Servicio central de archivos del monorepo. PostgreSQL conserva siempre los
metadatos. El contenido se entrega a un proveedor mediante el contrato
`FileStorageProvider`; el proveedor inicial (`database`) usa una tabla `bytea`
en la base `files_db`.

## Arquitectura de almacenamiento

```text
FilesController
  -> FilesService
      -> stored_files (metadatos PostgreSQL)
      -> StorageProviderRegistry (selecciona por storageProvider)
          -> DatabaseStorageProvider (actual)
          -> S3StorageProvider (futuro)
          -> GcsStorageProvider (futuro)
```

Cambiar el almacenamiento de escritura no requiere modificar el contrato HTTP
ni la tabla de metadatos. Cada archivo registra `storageProvider` y
`storageKey`; el registro usa ese valor para seguir leyendo archivos antiguos
desde su proveedor original y permite una migración gradual.

## Variables

| Variable                    | Predeterminado | Uso                             |
| --------------------------- | -------------- | ------------------------------- |
| `PORT`                      | `3004`         | Puerto HTTP                     |
| `FILES_DB_HOST`             | `localhost`    | Host PostgreSQL                 |
| `FILES_DB_PORT`             | `5432`         | Puerto PostgreSQL               |
| `FILES_DB_NAME`             | `files_db`     | Base exclusiva                  |
| `FILES_DB_USERNAME`         | `postgres`     | Usuario PostgreSQL              |
| `FILES_DB_PASSWORD`         | `postgres`     | Clave PostgreSQL                |
| `FILES_STORAGE_DRIVER`      | `database`     | Proveedor de contenido          |
| `FILES_MAX_FILE_SIZE_BYTES` | `10485760`     | Límite por archivo              |
| `FILES_MIGRATIONS_RUN`      | `false`        | Ejecutar migraciones al iniciar |

En desarrollo, `FILES_DB_HOST`, `FILES_DB_PORT`, `FILES_DB_USERNAME` y
`FILES_DB_PASSWORD` heredan respectivamente de las variables `DATABASE_*` si
no se definen. `FILES_DB_NAME` permanece independiente y usa `files_db` por
defecto.

## Endpoints

- `GET /api/health`
- `POST /api/files` (`multipart/form-data`)
- `GET /api/files?application=&ownerType=&ownerId=`
- `GET /api/files/:id`
- `GET /api/files/:id/content`
- `DELETE /api/files/:id`

Ejemplo:

```bash
curl -X POST http://localhost:3004/api/files \
  -F file=@document.pdf \
  -F application=project-web \
  -F ownerType=project \
  -F ownerId=550e8400-e29b-41d4-a716-446655440000 \
  -F 'metadata={"category":"documentation"}'
```

`ownerType` y `ownerId` son opcionales, pero deben enviarse juntos. No se
fuerza UUID en `ownerId`, para que aplicaciones futuras puedan usar su propio
tipo de identificador.

## Agregar S3, GCS u otro proveedor

1. Implementar `FileStorageProvider` bajo `files/storage/`.
2. Registrarlo en `StorageProviderRegistry` sin retirar los proveedores que aún
   tengan archivos.
3. Seleccionarlo mediante `FILES_STORAGE_DRIVER`.
4. Agregar sus credenciales solo al entorno de despliegue, nunca al repositorio.

Para producción, `TYPEORM_SYNCHRONIZE` debe permanecer en `false` y
`FILES_MIGRATIONS_RUN` en `true`.
