# MacroFit: entrada por texto y dictado

## Despliegue

- Fecha: 22 de octubre de 2026, 23:45, America/Santiago.
- Commit funcional: `03dc2ca5fc95a5eb43210fa8167a91f8291b5e9f`.
- Rama: `feat/app-improvements`.
- URL: <https://macrofit.atomdev.cl>.
- Servicios actualizados en orden: `macro-fit-api`, `bff-api`, `macro-fit-web`.
- Comando: `bash scripts/deploy-oci.sh --services macro-fit-api,bff-api,macro-fit-web --skip-local-build --yes`.
- El build local se había completado antes del despliegue. El script construyó las tres imágenes ARM64 en OCI y verificó la salud de cada servicio antes de continuar.
- No hubo cambios de esquema ni de variables remotas. PostgreSQL y Caddy conservaron sus contenedores. La configuración previa de Caddy coincidía con el servidor; no se modificaron DNS, reglas ni cachés de Cloudflare.

## Funcionalidad

El diario permite escribir o dictar una descripción, corregirla y enviarla a `POST /api/macrofit/analyze-meal-text`. BFF valida el JSON y lo envía al API interno. Gemini utiliza el mismo modelo, cuota, concurrencia y plazo total que el análisis de imágenes.

El resultado reutiliza el modal de ingredientes, conserva los gramos explícitos y distingue los pesos estimados. También muestra las suposiciones, permite editar gramos decimales y requiere confirmación antes de guardar en el diario.

El dictado usa el reconocimiento del navegador en español de Chile. Su soporte depende del navegador y del sistema operativo; la escritura sigue disponible cuando no existe soporte o se deniega el micrófono. No se comprobó un micrófono físico durante este despliegue.

## Validación

- Nx: 187 tests aprobados (45 de MacroFit API, 123 de BFF y 19 del frontend), lint sin errores, TypeScript y builds aprobados. Persisten advertencias de lint que no bloquean el build.
- Las tres imágenes Docker locales y los builds ARM64 remotos finalizaron correctamente.
- Antes del despliegue, tres casos con Gemini real mediante API/BFF locales verificaron cantidades explícitas y vagas, arroz pesado crudo, decimales, negaciones y rechazo de texto sin alimentos.
- Por HTTPS público, texto vacío y campos adicionales respondieron 400.
- El ejemplo de almuerzo respondió 200 en 2622 ms, identificó cinco alimentos y conservó 200 g de carne, 50 g de arroz, 40 g de palta y 9 g de mayonesa. La ensalada se marcó como estimada y se incluyeron suposiciones.
- Una segunda prueba desde el navegador público abrió el modal con los cinco alimentos y las cantidades correspondientes. No se confirmó el registro de esos datos de prueba en producción.
- La prueba con la fotografía de cazuela proporcionada previamente respondió `MACROFIT_PROVIDER_ANALYSIS=ok`.
- El bundle público incluye la nueva ruta y los controles de texto/voz; no contiene URLs internas ni la IP de origen. El service worker referencia el bundle vigente y responde `Cache-Control: no-cache, no-store, must-revalidate`, con `CF-Cache-Status: BYPASS`.
- La PWA ya instalada cargó la nueva versión tras una recarga normal, sin borrar almacenamiento local.
- Los tres servicios quedaron saludables y sin líneas recientes de error al finalizar el script. Se comprobaron los health checks internos, los frontends públicos y los rechazos 401 de rutas protegidas en las aplicaciones existentes.

Los valores de composición nutricional siguen siendo estimaciones del modelo; mencionar una marca no implica consultar o verificar su etiqueta.

## Respaldo y rollback

- Respaldo verificado: `/home/ubuntu/backups/deploy-20261023T024418Z`.
- Incluye PostgreSQL comprimido verificado con `gzip -t`, `.env.deploy`, Compose y Caddy.
- Imágenes anteriores: `project-manager-nx-<servicio>:rollback-20261023T024418Z` para los tres servicios seleccionados.
- El script comprobó que `.env.deploy` permaneció igual al respaldo.

Para volver a la versión anterior, etiquetar las imágenes de rollback como `latest` y recrear únicamente los servicios afectados con `--no-deps`, verificando después su salud. No se requiere restaurar datos por esta mejora.

El cambio previo de Caddy para Serviu y el informe previo de despliegue de Jira quedaron fuera del commit funcional de MacroFit.
