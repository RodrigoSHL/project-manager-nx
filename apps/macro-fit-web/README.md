# MacroFit Web

Frontend Vite/React con instalación PWA y almacenamiento local. Se construye con `Dockerfile.vite` y se sirve como SPA desde Nginx en el puerto interno 80. No necesita Node en runtime, variables `NEXT_PUBLIC_*` ni PostgreSQL.

Las llamadas de análisis usan `/api/macrofit/analyze-plate` en el mismo origen. En desarrollo, Vite las envía al BFF en localhost:3000; en producción, Caddy las envía a `bff-api:3000`. El BFF llama al API interno en el puerto 3007.

## Registrar por texto o voz

El diario y cada tiempo de comida ofrecen **Escribir / Dictar comida** o **Texto / Voz**. El usuario escribe o dicta, corrige el texto y pulsa **Analizar descripción**. Solo entonces se envía JSON a `/api/macrofit/analyze-meal-text`; el texto no se envía automáticamente mientras se dicta.

El dictado usa `SpeechRecognition` o `webkitSpeechRecognition`, en español de Chile, cuando el navegador lo admite en un contexto seguro (HTTPS o localhost). La compatibilidad depende del navegador, sistema operativo y modo PWA; puede usar un servicio remoto del navegador y requerir conexión. MacroFit no graba ni sube audio a su API. Si no se admite el dictado o se deniega el micrófono, permanece disponible la escritura y el dictado del teclado del teléfono. El micrófono se libera al cerrar el formulario o al ocultar la aplicación.

El resultado abre el mismo modal que una foto, mostrando además el texto original, las cantidades indicadas/estimadas y las suposiciones. Se pueden modificar gramos decimales, desmarcar alimentos y cambiar el tiempo de comida antes de confirmar. Sin un tiempo explícito, se intenta inferir del texto y se propone almuerzo como fallback visible. Un error conserva el borrador abierto; no se agregan alimentos hasta confirmar el resultado.

Se mantiene Gemini 3.5 Flash-Lite, que admite texto y respuestas estructuradas. Las cantidades vagas y la composición nutricional se estiman y deben revisarse; una marca mencionada no implica que se haya consultado su etiqueta.

Fuentes: [modelo Gemini](https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite), [reconocimiento de voz del navegador](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition).

`nx build macro-fit-web` ejecuta primero `typecheck`. La generación del service worker está habilitada en producción y deshabilitada en desarrollo/tests. Los archivos `dev-dist` se excluyen de lint y del contexto Docker.

Los errores del análisis se muestran al usuario y no agregan alimentos al registro. La selección de platos, las imágenes admitidas, los límites y la configuración están descritos en [MacroFit API](../macro-fit-api/README.md).
