# Cierre de sprints en Jira

En **Sprint actual**, un usuario con permisos de escritura puede pulsar **Finalizar sprint**. El diálogo muestra todos los tickets del sprint, independientemente de los filtros del tablero, y permite enviar los pendientes al backlog o a otro sprint abierto del mismo proyecto.

- Los tickets `done` y `cancelled` conservan su sprint y estado.
- Los pendientes enviados al backlog quedan con `sprintId: null` y estado `backlog`.
- Los pendientes enviados a otro sprint conservan su estado; los que estaban en `backlog` pasan a `todo`.
- El cierre deja el proyecto sin sprint activo. El siguiente se activa con el botón **Activar**.
- **Sprints finalizados** muestra la fecha real de cierre, el resumen y una copia de los tickets y sus estados al finalizar. Abrir un ticket desde ese historial muestra su información actual.
- Los sprints cerrados no se pueden editar, eliminar, reactivar ni usar para nuevas asignaciones. Las ediciones posteriores de los tickets no cambian el resumen histórico.

## API

`PATCH /api/projects/:projectId/sprints/:sprintId/complete` en el BFF; requiere acceso de escritura al proyecto.

```json
{ "targetSprintId": null }
```

`null` o la ausencia del campo envía los pendientes al backlog. Para otro destino, usar el UUID de un sprint abierto del mismo proyecto. Responde con el sprint cerrado, `completedAt` y `completionSummary`.

El cierre y los traslados usan una única transacción y un bloqueo por proyecto compartido con las escrituras de tickets y la activación de sprints. Un segundo cierre se rechaza; una falla al guardar revierte también los traslados.

## Base de datos y despliegue

La migración `AddSprintCompletion1792627200000` agrega `completedAt` (timestamptz nullable) y `completionSummary` (jsonb nullable). Los sprints existentes quedan abiertos, conservando su valor de `isActive`; el vencimiento de la fecha no los cierra automáticamente.

La migración está registrada en `database.config.ts`. El Compose de producción ya configura `PROJECT_MIGRATIONS_RUN=true`; al desplegar debe actualizarse `project-api` antes que `bff-api` y `jira-web`. Este cambio no despliega los servicios.

El estado activo se modifica mediante `/activate`; el PATCH genérico del sprint ya no acepta `isActive`.

## Verificación

Pruebas unitarias y de interfaz:

```sh
npx jest --config apps/project-api/jest.config.ts --runInBand
npx jest --config apps/jira-web/jest.config.ts --runInBand
npx jest --config apps/bff-api/jest.config.ts --runInBand --runTestsByPath apps/bff-api/src/app/project-api/project-api.controller.spec.ts
```

Pruebas transaccionales: usar exclusivamente una base PostgreSQL desechable local llamada `sprint_completion_validation`. La suite crea y elimina su propio schema y comprueba traslado, historial, rollback, concurrencia y migración.

```sh
SPRINT_COMPLETION_TEST_DATABASE_URL=postgres://postgres@127.0.0.1:55438/sprint_completion_validation \
  npx jest --config apps/project-api/jest.config.ts --runInBand --runTestsByPath \
  apps/project-api/src/app/sprints/sprint-completion.integration.spec.ts
```
