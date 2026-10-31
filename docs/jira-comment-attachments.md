# Archivos en comentarios de Jira

Los comentarios nuevos y las respuestas permiten seleccionar varios archivos y
publicar con o sin texto. Las imágenes muestran una miniatura; cada adjunto abre
el visor existente y ofrece descarga. Se conservan los tipos admitidos por
Archivos del ticket y el límite de 10 MB por archivo, con hasta 10 archivos por
comentario.

## Persistencia y permisos

- Los archivos se suben una sola vez al almacenamiento del ticket mediante
  `POST /api/storage/files`, con su `projectId` y `ownerId` habituales.
- `POST /api/projects/:projectId/tickets/:ticketId/comments` recibe `body`, el
  `parentCommentId` opcional y `attachmentIds` opcional (UUID únicos).
- El BFF comprueba el acceso al proyecto, la pertenencia del ticket y que todos
  los archivos referenciados pertenezcan a ese proyecto y ticket.
- Project API guarda las referencias en `comments.attachmentIds` (`uuid[]`).
  Un comentario debe tener texto o al menos un adjunto. Las ediciones de texto
  conservan las referencias, y solo su autor puede editar o eliminar comentarios.
- La sección Archivos y cada comentario muestran el mismo archivo. Eliminar un
  comentario conserva sus archivos en el ticket; eliminar un archivo desde
  Archivos deja un aviso de archivo no disponible en el comentario.

## Subidas parciales

Los archivos se seleccionan en un borrador y se suben al pulsar Publicar o
Responder. Si una subida o la publicación falla, el borrador conserva el texto y
las referencias de los archivos ya subidos. Reintentar no vuelve a subir esos
archivos. Los archivos subidos ya figuran en Archivos del ticket, aunque el
usuario luego los quite del borrador o cierre el editor.

## Validación y despliegue

La migración `AddCommentAttachments1793404800000` agrega una columna con un array
vacío por defecto para los comentarios anteriores. Desplegar en orden
`project-api` → `bff-api` → `jira-web`; no requiere reconstruir `files-api`.

Las pruebas incluyen publicación con adjuntos, respuestas sin texto, reintentos,
límites, permisos, miniaturas, visor y persistencia tras recargar el detalle.
La prueba de migración usa una base PostgreSQL local descartable:

```sh
COMMENT_ATTACHMENTS_TEST_DATABASE_URL=postgresql://usuario@127.0.0.1:55439/comment_attachments_validation \
  npx jest --config apps/project-api/jest.config.ts --runInBand \
  --runTestsByPath apps/project-api/src/app/comments/comment-attachments.integration.spec.ts
```
