# GridAssets: respuestas con campos opcionales nulos

## Problema y corrección

La sincronización rechazaba respuestas descargadas y editadas sin conexión:

- selección digital: `valueNumber: null` producía `valueNumber must be numeric`;
- medición analógica: `selectedOptionId: null` producía
  `payload.selectedOptionId must be a UUID`.

Los campos no utilizados por cada tipo de concepto se almacenan como `null` en
PostgreSQL. El parser de Push solo aceptaba campos ausentes (`undefined`).

`SyncChangeParser` normaliza ambos campos opcionales con `?? undefined` antes de
validar. Conserva el cero, exige números finitos y mantiene la validación UUID.
El procesador sigue exigiendo un valor acorde al concepto y una opción que
pertenezca al snapshot del trabajo. No se cambia el payload original del outbox.

## Alcance

Archivos de código modificados:

- `apps/inspection-api/src/app/sync/sync-change.parser.ts`;
- `apps/inspection-api/src/app/sync/sync-change.parser.spec.ts`.

Servicio seleccionado: `inspection-api`, puerto interno `3005`, base existente
`inspection_db`. El navegador continúa usando `/api/inspection` a través del BFF
en `https://inspection.atomdev.cl`. No se agregan migraciones ni variables.

Se utilizó `scripts/deploy-oci.sh --services inspection-api --yes` desde una copia
aislada de las fuentes productivas, excluyendo secretos, claves y artefactos.
Antes de aplicar el fix se verificó que ambos archivos productivos coincidieran
con su versión base local. La simulación confirmó que únicamente cambiaría el
contenido de esos dos archivos; el resto de diferencias del repositorio local
quedó fuera del despliegue.

## Validaciones

- Las pruebas nuevas fallaron inicialmente con los dos mensajes del incidente.
- Jest de `inspection-api`: 17 suites, 91 pruebas aprobadas.
- Prettier: ambos archivos aprobados.
- Docker local usando las fuentes y dependencias productivas: build aprobado,
  incluyendo TypeScript y Webpack.
- Prueba del bundle compilado en un contenedor local sin red: cinco respuestas
  válidas aceptadas y 14 respuestas inválidas rechazadas. Incluye selección,
  medición, cero, texto, opcionales ausentes, valores completamente vacíos y una
  opción UUID ajena al snapshot. Solo utiliza repositorios en memoria.
- Consulta agregada de solo lectura antes del despliegue: se encontraron los dos
  mensajes del incidente, asociados a trabajos en estado `IN_PROGRESS`.
- Build ARM64 productivo aprobado. Imagen publicada:
  `sha256:b7d5dfa66d42a549cb047fd479fcc51ef80a14a2457a52551eaa42acfebca504`.
- Contenedor `inspection-api`: `running healthy`, cero líneas de error desde el
  arranque durante la verificación.
- BFF y upstream Inspection: HTTP 200. Las rutas protegidas continúan devolviendo
  HTTP 401 sin autenticación.
- GridAssets, login y los otros sitios comprobados por el script: HTTP 200 por
  HTTPS. La verificación de Cloudflare del script también pasó.
- La misma prueba del bundle compilado pasó dentro del contenedor productivo:
  cinco respuestas válidas y 14 inválidas, sin escrituras en base de datos.

El build inicial contra el checkout de trabajo falló por un conflicto previo
entre `@swc/cli ~0.6.0` y el peer opcional de `@nestjs/cli 10.4.9`. No se alteraron
dependencias para este fix. Se validó y desplegó la copia de producción con sus
versiones existentes.

## Respaldo y seguimiento

Respaldo previo verificado por el script:
`/home/ubuntu/backups/deploy-20261021T025525Z`, con PostgreSQL completo,
`.env.deploy`, Compose y Caddy. El identificador usa UTC; el despliegue comenzó
el 20 de octubre a las 23:55 en America/Santiago.

Imagen anterior conservada:
`project-manager-nx-inspection-api:rollback-20261021T025525Z`.

Estado: publicado y verificado el 21 de octubre, aproximadamente a las 00:08 en
America/Santiago. Solo se recreó `inspection-api`.

La conexión SSH del build dejó de entregar salida y posteriormente terminó con
`Connection reset by peer` / `Broken pipe`. Antes de continuar se comprobó por
otra conexión que el build había finalizado, que la nueva imagen existía y que
la imagen anterior seguía atendiendo. Se retomó con las funciones originales
`deploy_services`, `verify_remote` y `verify_external`, después de verificar de
nuevo el respaldo comprimido, configuración sin cambios, checksums de los dos
archivos e imagen anterior igual a la etiqueta de rollback. No se repitió el
build ni el backup. La reanudación terminó con código cero.

Una vez publicado, el usuario debe reintentar **Sincronizar ahora** desde el mismo
navegador/dispositivo que conserva IndexedDB. No se borran datos locales ni se
reingresan respuestas. La subida de fotos continúa después de aceptar las
respuestas. La recuperación efectiva de esos pendientes requiere ese reintento.

En el primer despliegue los cambios del fix quedaron sin commit en el checkout
de trabajo. El 21 de octubre se detectó que el parser y las pruebas ya no estaban
modificados y que el fix no figuraba en el historial de las ramas revisadas.

Se recuperaron ambos archivos desde la copia aislada usada en el despliegue,
verificando sus SHA-256 contra los registrados durante esa publicación. Se
actualizó `feat/app-improvements` mediante fast-forward desde `origin/main`
(`2b9ce10`) y se restauró el fix en esa rama, junto con este registro, para
conservarlo en un commit propio. No se realizó un nuevo despliegue durante esta
recuperación.

Validación posterior a integrar `main`: 17 suites y 91 pruebas de
`inspection-api` aprobadas, Prettier aprobado y build Nx de producción con
TypeScript/Webpack aprobado. El primer intento de Nx dentro del sandbox no pudo
iniciar sus workers; la misma compilación fuera del sandbox terminó
correctamente.
