# Actualizaciones de MacroFit

MacroFit usa el registro PWA con `registerType: prompt` y `skipWaiting: false`, siguiendo el patrón de GridAssets (`inspection-web`). Cuando termina de descargarse una nueva versión, aparece **Nueva versión disponible**, con el botón **Actualizar ahora**. La activación y la recarga requieren pulsarlo; conviene guardar primero cualquier formulario abierto.

**Recordarme más tarde** reduce el aviso a un botón flotante que permite volver a abrirlo. No descarta la versión pendiente. Un fallo al activar permite reintentar.

Además de la comprobación habitual del registro del service worker, se busca una actualización cada cinco minutos mientras la página está visible y con conexión, y al volver a la pestaña o recuperar conectividad. Los eventos se limitan a una comprobación por minuto y se omiten mientras se instala una versión. Los fallos de esta comprobación no interrumpen la aplicación. Los listeners e intervalos se eliminan al desmontar el componente.

El aviso también funciona en la pantalla de login y en la aplicación instalada. Los archivos `sw.js`, `registerSW.js` y `manifest.webmanifest` ya tienen cabeceras que impiden cachearlos en nginx; no se añaden cambios de infraestructura.

## Primera actualización desde la versión anterior

Una pestaña que conserva el JavaScript anterior no puede mostrar un componente que todavía no contiene. Después de publicar esta mejora, esa pestaña necesita una recarga inicial para incorporar el aviso. Las siguientes publicaciones podrán notificarse desde la aplicación. La compatibilidad de la búsqueda de Open Food Facts para clientes anteriores se conserva.

## Comprobación manual

1. Publicar una versión e instalar/abrir MacroFit; confirmar que el service worker la controla.
2. Mantener la pestaña abierta y publicar otra versión que cambie un recurso precacheado.
3. Volver a MacroFit o esperar la comprobación periódica. El nuevo service worker debe quedar en espera y debe aparecer el aviso.
4. Cerrar el aviso con **Recordarme más tarde**; comprobar que el botón permanece y que no se pierde el formulario abierto.
5. Guardar el formulario y pulsar **Actualizar ahora**. Confirmar la recarga con la versión nueva.

Referencia: [Vite PWA: aviso de actualización](https://vite-pwa-org.netlify.app/guide/prompt-for-update), [comprobaciones periódicas](https://vite-pwa-org.netlify.app/guide/periodic-sw-updates).
