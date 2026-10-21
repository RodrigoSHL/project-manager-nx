# MacroFit: disponibilidad de Gemini y errores de análisis

Fecha: 21 de octubre de 2026, America/Santiago.

## Diagnóstico

La publicación anterior dejó operativos los servicios, pero no verificó un análisis
real exitoso. El usuario reportó fallos frecuentes y mostró un 504 en el escáner.

Se reprodujo un 503 público en 3,54 segundos. La respuesta era JSON de la API,
reenviada por BFF y Caddy. Al comparar directamente desde OCI con la misma foto,
`gemini-3.1-flash-lite` devolvió 503 por alta demanda en 11,78 segundos, sin error
de cuota. `gemini-3.5-flash-lite` devolvió un análisis estructurado válido en
7,07 segundos. No se cambió producción durante esta comparación.

## Correcciones

- Commit `9e2799a`: modelo predeterminado 3.5 Flash-Lite, plazo total de 30 segundos,
  generación con thinking mínimo y salida limitada a 8192 tokens.
- Un único reintento para HTTP 408/500/502/503/504. Comparte la señal de cancelación
  y el plazo total; cada intento consume el límite de solicitudes al proveedor.
  No se reintentan credenciales inválidas, cuota del proveedor agotada ni JSON inválido.
- Los reintentos internos del SDK quedan desactivados para evitar multiplicarlos.
- Commit `a28351a`: BFF conserva los errores HTTP aunque el upstream devuelva HTML;
  los timeouts durante lectura siguen siendo 504. El frontend muestra mensajes
  útiles incluso si el gateway no devuelve JSON, en lugar de `504:` vacío.
- API 30 s, BFF 35 s y navegador 45 s mantienen margen entre capas.
- Se alinearon los ejemplos, Compose, documentación y entorno local ignorado.
  En el entorno remoto solo se actualizaron `GEMINI_MODEL` y `GEMINI_TIMEOUT_MS`.

No se añadieron simuladores ni otros proveedores. Los análisis exitosos se obtienen
de Gemini y pasan la validación del contrato antes de mostrarse.

La [tarifa publicada por Google](https://ai.google.dev/gemini-api/docs/pricing)
para 3.5 Flash-Lite es USD 0,30 de entrada y USD 2,50 de salida por millón de tokens,
frente a USD 0,25 y USD 1,50 de 3.1 Flash-Lite en la modalidad estándar de pago.
La disponibilidad futura del proveedor no queda garantizada por estas pruebas.

## Verificación real

Se usó la foto JPEG de cazuela autorizada por el usuario, con la pista
`cazuela vacuno`. No se incorporó la foto ni ninguna clave al repositorio.

| Recorrido | Resultados consecutivos |
| --- | --- |
| Imágenes nuevas locales: BFF → API → Gemini | 200 en 4,40 / 2,93 / 2,99 s; seis ingredientes y total válido |
| HTTPS público: Cloudflare → Caddy → BFF → API → Gemini | 200 en 3,47 / 2,99 / 3,13 s; seis ingredientes y total válido |
| Navegador público: cargar foto y analizar | Resultado “Cazuela de vacuno”, seis ingredientes, ajuste de porciones visible y sin errores de consola |

Las siete pruebas reales pasaron. En la interfaz no se confirmó el registro del
plato en el diario. Esta muestra no constituye una garantía de disponibilidad del
proveedor ni una comprobación de precisión nutricional.

Pasaron build, lint y tests de los tres proyectos afectados. Se añadieron pruebas
para recuperación real del segundo intento, presupuesto compartido, cuota de
reintentos y mensajes de error HTML; las 109 pruebas del BFF pasaron tras el último
ajuste de lectura del cuerpo. Los lint conservan advertencias anteriores.

El despliegue `macrofit-full` finalizó a las 20:38 con API, BFF, Web y Caddy.
Las verificaciones internas y HTTPS de las aplicaciones existentes pasaron.

## Respaldos y rollback

- Entorno anterior al cambio de modelo:
  `/home/ubuntu/backups/macrofit-env-20261021T233611Z/.env.deploy`.
- Respaldo completo de esta publicación:
  `/home/ubuntu/backups/deploy-20261021T233714Z`.
- Imágenes anteriores: `rollback-20261021T233714Z`.

El respaldo completo incluye PostgreSQL, entorno, Compose y Caddy. Para volver al
comportamiento anterior también se debe considerar el respaldo del entorno previo
al cambio de modelo; restaurar solo una imagen no cambia las variables efectivas.

## Aclaración sobre Cloudflare

En la intervención anterior se purgaron nueve URLs concretas: `sw.js`,
`registerSW.js` y `manifest.webmanifest` de MacroFit, Inspection y QA. Se había
verificado que el CDN conservaba el service worker antiguo durante cuatro horas,
lo que cargaba JavaScript anterior con el fallo de combos.

No se cambiaron DNS, proxy, certificados, reglas de caché ni reglas de seguridad en
Cloudflare. Los encabezados que evitan conservar esos archivos se configuraron en
Nginx. La purga renueva copias derivadas y no elimina registros de usuario ni datos
offline. Esta intervención de disponibilidad de Gemini no modificó Cloudflare ni
necesitó otra purga; el navegador recibió el nuevo frontend mediante su actualización
normal del service worker.
