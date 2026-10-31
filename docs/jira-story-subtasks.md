# Subtareas de historias de usuario

La jerarquía de Jira es **Épica → Historia de usuario → Subtarea**. Las subtareas
son tickets completos: tienen código, estado, responsable, sprint, comentarios y
archivos propios.

## Uso

- El detalle de una HDU muestra sus subtareas con el mismo listado de código,
  título y estado usado para las historias de una épica. Pulsar una fila abre el
  ticket correspondiente.
- `Crear subtarea` abre el formulario con la HDU seleccionada y propone el sprint
  de la historia. Si ese sprint ya está cerrado, propone crear sin sprint.
- El formulario general también permite crear subtareas seleccionando una HDU.
- El detalle de una subtarea permite cambiar su historia y volver al detalle de
  la HDU. Los lectores pueden navegar; los cambios requieren permiso de escritura.
- Un ticket existente se puede convertir en subtarea seleccionando su historia.

## Persistencia y validación

`POST /api/projects/:projectId/tickets` y `PATCH .../tickets/:ticketId` admiten
`parentTicketId`. Solo un ticket de tipo `subtask` puede usarlo, y el padre debe
ser un ticket `story` del mismo proyecto. No se permiten autorreferencias ni
subtareas de subtareas. `epicId` conserva su función de vincular HDU con épicas.

La creación y los cambios de jerarquía se serializan mediante el bloqueo del
proyecto. Una HDU con subtareas no se puede eliminar ni convertir a otro tipo
hasta reasignar o eliminar sus subtareas. Convertir una subtarea en tarea común
quita su vínculo con la HDU. Los estados, responsables y sprints siguen siendo
independientes; no hay propagación automática de cambios a los hijos.

La migración `AddStorySubtaskTickets1793491200000` agrega `parentTicketId`, índice,
clave foránea y restricciones. Los tickets anteriores quedan con padre nulo;
las subtareas antiguas sin HDU se pueden seguir editando y asociar desde su
detalle. La tabla histórica `subtasks` permanece intacta.

El proyecto seleccionado se conserva entre recargas en `localStorage`, con la
clave `jira-web:projectId:<workspaceId>`. Cada workspace recuerda su selección.
Solo se restauran proyectos devueltos por la API autenticada; los enlaces a
tickets tienen prioridad sobre la preferencia guardada.

Desplegar `project-api` (con migración) antes de `jira-web`. Las rutas existentes
del BFF ya transmiten el campo y conservan los controles de acceso.

## Pruebas

La suite de interfaz cubre listados, navegación, permisos y creación desde una
HDU, incluidos los sprints cerrados. La suite PostgreSQL comprueba migración,
persistencia, reasignación, protección de padres y concurrencia:

```sh
STORY_SUBTASKS_TEST_DATABASE_URL=postgresql://usuario@127.0.0.1:55439/story_subtasks_validation \
  npx jest --config apps/project-api/jest.config.ts --runInBand \
  --runTestsByPath apps/project-api/src/app/tickets/story-subtasks.integration.spec.ts
```
