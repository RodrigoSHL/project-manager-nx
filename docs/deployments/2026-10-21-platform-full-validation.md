# Despliegue completo y verificación de la plataforma

Fecha: 21 de octubre de 2026, America/Santiago.

## Resultado

Se desplegaron las ocho APIs, los seis proyectos frontend, la instancia QA de
Inspection y Caddy en OCI. Los 17 contenedores, incluido PostgreSQL, quedaron
activos y sin reinicios; los servicios con healthcheck están saludables.
PostgreSQL no fue recreado. Las verificaciones HTTPS y de comunicación interna
pasaron. El análisis real con Gemini no pasó: hubo alta demanda del proveedor
y posteriormente un timeout. No se devolvieron resultados nutricionales ficticios.

## Versiones y respaldos

- Despliegue completo: commit `14572cf`, finalizado a las 17:47.
- Corrección de caché PWA: `e58845e`.
- Corrección de clasificación de timeouts del SDK: `1dcea8a`.
- Segundo despliegue de MacroFit API, ambos Inspection Web, MacroFit Web y Caddy:
  finalizado a las 18:16.
- Backup inicial: `/home/ubuntu/backups/deploy-20261021T203923Z`.
- Backup previo a las correcciones adicionales:
  `/home/ubuntu/backups/deploy-20261021T211444Z`.
- Etiquetas de rollback: `rollback-20261021T203923Z` y
  `rollback-20261021T211444Z`, para los servicios seleccionados en cada despliegue.

Ambos respaldos contienen PostgreSQL comprimido, `.env.deploy`, Compose y Caddy.
Se verificaron los archivos gzip y que `.env.deploy` remoto permaneciera idéntico
a las copias. No se imprimieron secretos ni se sustituyó el entorno remoto.

## Verificaciones realizadas

| Comprobación | Resultado |
| --- | --- |
| Compose y preflight ARM64, disco y servicios existentes | Pasan |
| Builds locales y ARM64 remotos de todas las aplicaciones | Pasan |
| APIs y BFF por la red interna | Healthchecks saludables |
| Rutas protegidas de Travel e Inspection sin JWT | 401 |
| Mailer interno y envío sin token | Health 200 y rechazo 401; no se envió correo |
| MacroFit health y readiness públicos | 200; readiness solo comprueba configuración |
| MacroFit: carga de texto | 415 |
| Búsqueda de URLs prohibidas en bundles Travel, Inspection y MacroFit | Limpios |
| Cuatro imágenes Next: raíz y recurso JavaScript estático | 200 |
| Vite: raíz, health, ruta SPA y encabezados PWA | Pasan |
| MacroFit API tras corregir timeouts | 27 tests pasan |
| Navegador: Project, Jira y Travel | Formularios de inicio de sesión visibles |
| Navegador: Inspection, QA y AtomDev | Páginas públicas visibles |
| Navegador: guardar combo de MacroFit | Guarda los cuatro alimentos y cantidades; sin errores de consola |

Los sitios públicos respondieron 200 por HTTPS: `atomdev.cl`, `www.atomdev.cl`,
`projects.atomdev.cl`, `jira.atomdev.cl`, `travel.atomdev.cl`,
`inspection.atomdev.cl`, `qa-inspection.atomdev.cl` y `macrofit.atomdev.cl`.
Se verificó el proxy de Cloudflare.

La migración `InitialUserSchema1792540800000` quedó registrada. Las huellas de
las filas de `users`, `workspaces` y `workspace_members` coincidieron antes y
después. Las evidencias están en `user-schema-before.json` y
`user-schema-after.json` dentro del respaldo inicial.

## Incidente de caché detectado durante la prueba

Cloudflare entregaba `/sw.js` con `CF-Cache-Status: HIT` y
`Cache-Control: max-age=14400`. Ese archivo conservaba el bundle antiguo
`index-CS1NTm8Y.js`, que todavía fallaba al guardar combos, mientras el servidor
ya publicaba `index-DDCie5aS.js`.

Se añadieron encabezados `no-cache, no-store, must-revalidate` para `sw.js`,
`registerSW.js` y `manifest.webmanifest`, y `no-cache` para `index.html` en el
Nginx compartido de Vite. Se incorporaron comprobaciones al script de imágenes web.
Se purgaron únicamente esas tres URLs en los tres hosts PWA desde Cloudflare.
Inspection registra su service worker desde el bundle: sus dos URLs
`registerSW.js` no existen y responden correctamente 404.

Los siete archivos existentes respondieron 200 con los nuevos encabezados y sin
HIT de CDN. El navegador recibió el nuevo bundle de MacroFit después de actualizar
el service worker y recargar. Se guardó un combo de prueba en el almacenamiento
local del navegador de verificación. No se borraron datos locales ni caches offline
de los usuarios.

## Gemini: comprobación real y limitación pendiente

El usuario autorizó una foto JPEG de comida. Se realizaron dos intentos de análisis:

1. El primero respondió 503. La consulta directa de metadatos del modelo respondió
   200 y confirmó soporte de generación. Una generación mínima respondió
   `503 UNAVAILABLE`, indicando alta demanda del modelo.
2. El segundo respondió 502; el log interno mostró que el SDK había devuelto 504.
   Se corrigió su clasificación para que los estados 408/504 del proveedor se
   propaguen como 504. La corrección tiene pruebas y fue desplegada.

No se modificaron el modelo, la clave ni el plazo de 15 segundos para ocultar el
fallo. No hubo un análisis real exitoso y no se hizo otra llamada al proveedor
después de publicar la corrección de clasificación. Readiness 200 no demuestra
disponibilidad ni validez de un análisis real.

## Alcance y observaciones

Estas comprobaciones cubren despliegue, arranque, rutas, autorización sin sesión,
dependencias y el guardado local de combos. No sustituyen pruebas de negocio con
usuarios autenticados, envíos reales de correo ni una prueba de precisión nutricional.

Los APIs y PostgreSQL no publican puertos al host. Caddy publica 80/443 y mantiene
8081/8082 ligados a loopback. El preflight detectó además un listener del sistema
preexistente en 111 y UFW inactivo; no se modificó ese servicio ni se auditó su
exposición mediante las reglas de red OCI en esta intervención.

El archivo local previo de Inspection, pendiente de commit, se conservó fuera de
los commits de esta tarea. No se hizo push.
