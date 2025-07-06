# Módulo de Archivos

Este módulo proporciona funcionalidad completa para almacenar y gestionar archivos binarios directamente en la base de datos PostgreSQL usando el tipo `BYTEA`.

## Características

- ✅ Almacenamiento de archivos binarios en PostgreSQL usando `BYTEA`
- ✅ Asociación con entidades del sistema (usuarios, proyectos, solicitudes)
- ✅ Validación de que solo una entidad esté asociada por archivo
- ✅ Endpoints RESTful completos
- ✅ Soporte para UUID como identificadores
- ✅ Índices optimizados para consultas por entidad

## Entidad File

La entidad `File` incluye las siguientes columnas:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | Identificador único del archivo |
| `filename` | VARCHAR(255) | Nombre original del archivo |
| `mimetype` | VARCHAR(100) | Tipo MIME del archivo |
| `size` | BIGINT | Tamaño del archivo en bytes |
| `fileData` | BYTEA | Datos binarios del archivo |
| `uploadedAt` | TIMESTAMP | Fecha y hora de subida |
| `userId` | UUID | ID del usuario propietario (opcional) |
| `projectId` | UUID | ID del proyecto asociado (opcional) |
| `requestId` | UUID | ID de la solicitud asociada (opcional) |

## Endpoints Disponibles

### Subir Archivo Individual
```http
POST /files
Content-Type: multipart/form-data

file: [archivo]
userId?: string (UUID)
projectId?: string (UUID)
requestId?: string (UUID)
```

### Subir Múltiples Archivos
```http
POST /files/multiple
Content-Type: multipart/form-data

files: [archivo1, archivo2, archivo3, ...]
userId?: string (UUID)
projectId?: string (UUID)
requestId?: string (UUID)
```

**Respuesta:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "filename": "documento.pdf",
  "mimetype": "application/pdf",
  "size": 1048576,
  "uploadedAt": "2024-01-15T10:30:00Z",
  "userId": "550e8400-e29b-41d4-a716-446655440001",
  "projectId": null,
  "requestId": null
}
```

### Descargar Archivo
```http
GET /files/:id
```

**Respuesta:** Archivo binario con headers apropiados para descarga.

### Obtener Información del Archivo
```http
GET /files/info/:id
```

**Respuesta:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "filename": "documento.pdf",
  "mimetype": "application/pdf",
  "size": 1048576,
  "uploadedAt": "2024-01-15T10:30:00Z",
  "userId": "550e8400-e29b-41d4-a716-446655440001",
  "projectId": null,
  "requestId": null
}
```

### Listar Archivos por Usuario
```http
GET /files/user/:userId
```

### Listar Archivos por Proyecto
```http
GET /files/project/:projectId
```

### Listar Archivos por Solicitud
```http
GET /files/request/:requestId
```

### Eliminar Archivo
```http
DELETE /files/:id
```

**Respuesta:**
```json
{
  "message": "Archivo eliminado exitosamente"
}
```

## Validaciones

### Al Subir Archivos
- ✅ Al menos uno de los campos `userId`, `projectId` o `requestId` debe estar presente
- ✅ Solo se puede asociar un archivo a una entidad a la vez
- ✅ Los IDs deben ser UUIDs válidos
- ✅ El archivo es obligatorio

### Al Descargar/Consultar
- ✅ El ID del archivo debe ser un UUID válido
- ✅ El archivo debe existir en la base de datos

## Ejemplos de Uso

### Subir archivo asociado a un usuario
```bash
curl -X POST http://localhost:3000/files \
  -F "file=@documento.pdf" \
  -F "userId=550e8400-e29b-41d4-a716-446655440001"
```

### Subir archivo asociado a un proyecto
```bash
curl -X POST http://localhost:3000/files \
  -F "file=@imagen.jpg" \
  -F "projectId=550e8400-e29b-41d4-a716-446655440002"
```

### Descargar archivo
```bash
curl -O -J http://localhost:3000/files/550e8400-e29b-41d4-a716-446655440000
```

### Listar archivos de un proyecto
```bash
curl http://localhost:3000/files/project/550e8400-e29b-41d4-a716-446655440002
```

## Consideraciones de Rendimiento

- Los archivos se almacenan directamente en la base de datos
- Se utilizan índices en las columnas `userId`, `projectId` y `requestId` para optimizar consultas
- Para archivos grandes, considera implementar streaming o límites de tamaño
- La tabla `files` puede crecer significativamente, monitorea el espacio en disco

## Migración de Base de Datos

La tabla se crea automáticamente cuando `synchronize: true` está habilitado en la configuración de TypeORM. Para producción, se recomienda usar migraciones:

```sql
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename VARCHAR(255) NOT NULL,
  mimetype VARCHAR(100) NOT NULL,
  size BIGINT NOT NULL,
  file_data BYTEA NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  user_id UUID,
  project_id UUID,
  request_id UUID
);

CREATE INDEX idx_files_user_id ON files(user_id);
CREATE INDEX idx_files_project_id ON files(project_id);
CREATE INDEX idx_files_request_id ON files(request_id);
``` 