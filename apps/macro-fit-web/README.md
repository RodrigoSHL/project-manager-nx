# MacroFit Web

Frontend Vite/React con instalación PWA y almacenamiento local. Se construye con `Dockerfile.vite` y se sirve como SPA desde Nginx en el puerto interno 80. No necesita Node en runtime, variables `NEXT_PUBLIC_*` ni PostgreSQL.

Las llamadas de análisis usan `/api/macrofit/analyze-plate` en el mismo origen. En desarrollo, Vite las envía al BFF en localhost:3000; en producción, Caddy las envía a `bff-api:3000`. El BFF llama al API interno en el puerto 3007.

## Login y registros por cuenta

`/login` reutiliza las cuentas existentes de la plataforma: `POST /api/auth/login` valida credenciales mediante BFF y User API y devuelve el JWT; `GET /api/auth/profile` valida la sesión antes de montar el diario. El diseño sigue el panel de presentación y formulario de ProjectHub, FlowBoard y GridAssets, con los colores de MacroFit.

El token usa la clave `access_token` de localStorage, como las aplicaciones existentes, y se adjunta como `Authorization: Bearer` a los análisis. Cada origen conserva su propia sesión; compartir usuarios no implica SSO entre subdominios. No se almacenan contraseñas. Una futura migración común a cookies HttpOnly permitiría reducir la exposición del token ante XSS.

Una sesión ausente, inválida o vencida lleva al login. Se restaura consultando el perfil del servidor, nunca confiando únicamente en el JWT decodificado. Un 401 cierra la sesión; un 403 conserva la sesión y muestra el error. Si no se puede validar el perfil por un fallo de red, los registros permanecen ocultos y se ofrece reintentar, conservando el token. Los redirects pasan por la librería común `security-navigation` y solo admiten destinos del mismo origen.

Perfil, metas, alimentos, combos y diarios se guardan bajo `macrofit:<userId>:<clave>`. Cambiar de cuenta remonta el espacio de trabajo, libera los modales y el micrófono, descarta respuestas pendientes y evita escrituras de la sesión anterior. Cerrar sesión conserva los datos para la próxima entrada de esa cuenta. Los datos siguen siendo locales a ese navegador, sin sincronización entre dispositivos ni cifrado del almacenamiento. Un login no sustituye la protección del dispositivo compartido.

Las cuentas nuevas empiezan con un diario vacío, sin registrar automáticamente las comidas de ejemplo. Los registros anteriores sin cuenta no se muestran ni asignan automáticamente: un aviso permite confirmar que son propios e importarlos una sola vez. Se conservan los originales y no se reemplazan claves ya existentes en la cuenta de destino.

MacroFit es un seguimiento personal: cualquier identidad autenticada de la plataforma puede usarlo, sin roles nuevos, tenants, permisos de administrador sobre diarios ajenos ni migraciones de base de datos. La API nutricional permanece interna y sin persistencia; el BFF protege los tres endpoints públicos de análisis, incluido el alias antiguo de imágenes. Health y readiness siguen sin autenticación.

## Registrar por texto o voz

El diario y cada tiempo de comida ofrecen **Escribir / Dictar comida** o **Texto / Voz**. El usuario escribe o dicta, corrige el texto y pulsa **Analizar descripción**. Solo entonces se envía JSON a `/api/macrofit/analyze-meal-text`; el texto no se envía automáticamente mientras se dicta.

El dictado usa `SpeechRecognition` o `webkitSpeechRecognition`, en español de Chile, cuando el navegador lo admite en un contexto seguro (HTTPS o localhost). La compatibilidad depende del navegador, sistema operativo y modo PWA; puede usar un servicio remoto del navegador y requerir conexión. MacroFit no graba ni sube audio a su API. Si no se admite el dictado o se deniega el micrófono, permanece disponible la escritura y el dictado del teclado del teléfono. El micrófono se libera al cerrar el formulario o al ocultar la aplicación.

El resultado abre el mismo modal que una foto, mostrando además el texto original, las cantidades indicadas/estimadas y las suposiciones. Se pueden modificar gramos decimales, desmarcar alimentos y cambiar el tiempo de comida antes de confirmar. Sin un tiempo explícito, se intenta inferir del texto y se propone almuerzo como fallback visible. Un error conserva el borrador abierto; no se agregan alimentos hasta confirmar el resultado.

Se mantiene Gemini 3.5 Flash-Lite, que admite texto y respuestas estructuradas. Las cantidades vagas y la composición nutricional se estiman y deben revisarse; una marca mencionada no implica que se haya consultado su etiqueta.

Fuentes: [modelo Gemini](https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite), [reconocimiento de voz del navegador](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition).

`nx build macro-fit-web` ejecuta primero `typecheck`. La generación del service worker está habilitada en producción y deshabilitada en desarrollo/tests. Los archivos `dev-dist` se excluyen de lint y del contexto Docker.

Los errores del análisis se muestran al usuario y no agregan alimentos al registro. La selección de platos, las imágenes admitidas, los límites y la configuración están descritos en [MacroFit API](../macro-fit-api/README.md).
