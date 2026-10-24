# MacroFit Web

La sección **Mis productos** permite crear y editar un catálogo personal, importar fichas de Open Food Facts o transcribir una etiqueta con IA. Ver [flujo, contratos y opciones de cámara/galería](../../docs/MACROFIT_PRODUCTS.md).

Frontend Vite/React con instalación PWA y registros personales en PostgreSQL a través de la API. Se construye con `Dockerfile.vite` y se sirve como SPA desde Nginx en el puerto interno 80. El frontend no conecta directamente con PostgreSQL y no necesita Node en runtime ni variables `NEXT_PUBLIC_*`.

Las llamadas de análisis usan `/api/macrofit/analyze-plate` en el mismo origen. En desarrollo, Vite las envía al BFF en localhost:3000; en producción, Caddy las envía a `bff-api:3000`. El BFF llama al API interno en el puerto 3007.

## Login y registros por cuenta

`/login` reutiliza las cuentas existentes de la plataforma: `POST /api/auth/login` valida credenciales mediante BFF y User API y devuelve el JWT; `GET /api/auth/profile` valida la sesión antes de montar el diario. El diseño sigue el panel de presentación y formulario de ProjectHub, FlowBoard y GridAssets, con los colores de MacroFit.

El JWT se guarda en `sessionStorage` bajo `macrofit_access_token` y se adjunta como `Authorization: Bearer` a los registros y análisis. La sesión es propia de la pestaña y no se conserva al finalizarla. Las versiones anteriores usaban localStorage; al actualizar hay que iniciar sesión otra vez. No se almacenan contraseñas ni se reutiliza el token persistente anterior. Como en los otros frontends, no hay SSO entre subdominios ni revocación nueva de JWT en el servidor.
Una sesión ausente, inválida o vencida lleva al login. Se restaura consultando el perfil del servidor, nunca confiando únicamente en el JWT decodificado. Un 401 cierra la sesión; un 403 conserva la sesión y muestra el error. Si no se puede validar el perfil por un fallo de red, los registros permanecen ocultos y se ofrece reintentar, conservando el token. Los redirects pasan por la librería común `security-navigation` y solo admiten destinos del mismo origen.

Perfil, metas, alimentos propios, combos y diarios se guardan por `user_id` en `macrofit_db`. Todas las llamadas pasan por `/api/macrofit/me` y el BFF deriva el usuario desde el JWT verificado, nunca del body ni de una cabecera proporcionada por el navegador. Los administradores tampoco pueden acceder a registros personales ajenos. Cambiar de cuenta desmonta el espacio de trabajo y descarta las respuestas pendientes.

Una cuenta nueva muestra un formulario con campos biométricos vacíos. No se crea un perfil ficticio, no se precargan consumos ni se asigna automáticamente la pauta MEDS. Las metas se calculan y guardan cuando el usuario completa sus datos; la pauta por porciones es un preset opcional. El catálogo común y los combos de referencia son datos estáticos de consulta, no consumos registrados. Los combos guardados incluyen una copia de la información nutricional para reutilizar incluso alimentos provenientes de un análisis.

La pantalla espera la confirmación del servidor antes de actualizar consumos o mostrar éxito. Si falla una escritura, se conserva el formulario y se exige actualizar los registros antes de reintentar: una desconexión no permite saber si el servidor alcanzó a guardar. Los cambios de día y sesión descartan respuestas antiguas. Los registros requieren conexión; el service worker solo conserva recursos estáticos, no respuestas de `/api`.

La única lectura de localStorage sirve para importar versiones anteriores, tanto claves globales como claves de la cuenta actual. El usuario debe confirmar la propiedad. La importación es transaccional, se marca una vez por usuario en PostgreSQL y preserva perfiles, alimentos y días que ya existan en el servidor. Excluye el perfil predeterminado original y las entradas `seed-*`; si un día contenía ejemplos, su hidratación se inicia en cero porque antes venía precargada con 2100 ml. El aviso explica este ajuste. Los originales anteriores se conservan como respaldo, también después de importar, para no perder versiones de datos que ya existan en el servidor. No se vuelven a usar para el diario ni se escriben registros personales nuevos en localStorage.

MacroFit es un seguimiento personal sin tenants nuevos. Health y readiness siguen públicos; health comprueba PostgreSQL y readiness comprueba la configuración del proveedor. El backend ejecuta una migración real y usa `synchronize=false`. Ver el contrato de persistencia en [MacroFit API](../macro-fit-api/README.md).

## Registrar por texto o voz

El diario y cada tiempo de comida ofrecen **Escribir / Dictar comida** o **Texto / Voz**. El usuario escribe o dicta, corrige el texto y pulsa **Analizar descripción**. Solo entonces se envía JSON a `/api/macrofit/analyze-meal-text`; el texto no se envía automáticamente mientras se dicta.

El dictado usa `SpeechRecognition` o `webkitSpeechRecognition`, en español de Chile, cuando el navegador lo admite en un contexto seguro (HTTPS o localhost). La compatibilidad depende del navegador, sistema operativo y modo PWA; puede usar un servicio remoto del navegador y requerir conexión. MacroFit no graba ni sube audio a su API. Si no se admite el dictado o se deniega el micrófono, permanece disponible la escritura y el dictado del teclado del teléfono. El micrófono se libera al cerrar el formulario o al ocultar la aplicación.

El resultado abre el mismo modal que una foto, mostrando además el texto original, las cantidades indicadas/estimadas y las suposiciones. Se pueden modificar gramos decimales, desmarcar alimentos y cambiar el tiempo de comida antes de confirmar. Sin un tiempo explícito, se intenta inferir del texto y se propone almuerzo como fallback visible. Un error conserva el borrador abierto; no se agregan alimentos hasta confirmar el resultado.

Se mantiene Gemini 3.5 Flash-Lite, que admite texto y respuestas estructuradas. Las cantidades vagas y la composición nutricional se estiman y deben revisarse; una marca mencionada no implica que se haya consultado su etiqueta.

Fuentes: [modelo Gemini](https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite), [reconocimiento de voz del navegador](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition).

`nx build macro-fit-web` ejecuta primero `typecheck`. La generación del service worker está habilitada en producción y deshabilitada en desarrollo/tests. Los archivos `dev-dist` se excluyen de lint y del contexto Docker.

Los errores del análisis se muestran al usuario y no agregan alimentos al registro. La selección de platos, las imágenes admitidas, los límites y la configuración están descritos en [MacroFit API](../macro-fit-api/README.md).

## Navegación y diario

El workspace usa un sidebar con Diario, Mis productos, Mi pauta, Calculadora, Mi perfil y Configuración. La barra superior muestra la identidad de la cuenta y el logout; el selector de fecha pertenece al diario. En móvil el menú es un panel lateral con cierre por fondo/Escape, foco contenido y restauración del foco al cerrar. La instalación PWA se ofrece desde el sidebar o Configuración.

Mi perfil consulta la cuenta y los datos nutricionales existentes; su edición de datos/metas abre la calculadora y mantiene el guardado actual en el servidor. Configuración agrupa los accesos reales a los módulos, sin agregar preferencias locales ni cambiar la autenticación.

Los tiempos de comida comienzan plegados, conservan el conteo de alimentos y kcal y se expanden de forma independiente. Al añadir alimentos a una sección existente se abre para revisar el registro. Cada cabecera conserva acciones de texto/voz, cámara, combos y agregar como iconos, con nombres accesibles y títulos explicativos. El estado de navegación y expansión solo vive en memoria.

Los accesos generales de IA también son iconos de micrófono y cámara. Cada alimento registrado ofrece un lápiz para editar su cantidad en la unidad original. Guardar actualiza el mismo registro y recalcula calorías, macros y porciones de pauta desde su información nutricional histórica; no depende de cambios posteriores del catálogo. Si otra sesión cambió la cantidad, se solicita actualizar el diario antes de reintentar.

Las tarjetas del diario distinguen cantidad consumida, energía y nutrientes de ese consumo, con etiquetas completas y un resumen por tiempo de comida. El aporte a la pauta se muestra por separado en porciones; los botones «Asignar equivalencia» y «Cambiar equivalencia» abren el formulario existente. Los accesos principales de IA usan botones sólidos verde/violeta, conservando iconos sin texto y nombres accesibles.

El clasificador del diario permite buscar en **Mis productos** (nombre, marca o código) y en **Equivalencias de mi pauta** (nombre, alias o grupo), sin distinguir mayúsculas o tildes. Muestra los nutrientes por cantidad de referencia, permite copiar una equivalencia o definir sus porciones/grupos explícitamente y deja visible el aporte de la cantidad consumida antes de guardar. Un producto importado no obtiene porciones automáticamente a partir de sus macros. «Libre según mi pauta» es una decisión explícita del usuario, no una clasificación automática de condimentos.

«Guardar equivalencia y clasificar» actualiza la pauta reutilizable y el consumo en una transacción mediante el BFF. Conserva los nutrientes del consumo y las metas/versiones de los demás días. Las referencias agregadas al día se guardan en PostgreSQL y se recuperan al volver a abrirlo. Una referencia modificada recibe otra identidad para preservar consumos ya clasificados. En móvil el clasificador ocupa la pantalla y lleva al detalle al elegir un alimento; mantiene foco, cierre por Escape y bloqueo del fondo.

La ayuda del diario y de la ficha del producto agrupa **Buscar en mi pauta** y **Proponer con IA** antes de la explicación, los errores y los resultados. La primera consulta referencias guardadas y generales disponibles; la segunda pide una equivalencia nueva usando la ficha nutricional. Las propuestas muestran fundamento, supuestos, fuente cuando existe y el aporte proporcional del consumo o cantidad base del producto. La cantidad de intercambio puede ser distinta de la etiqueta dentro de la misma unidad: una ficha por 100 g admite una referencia de 15 g.

**Aplicar al formulario** solo completa campos editables. Después de revisarlos, **Guardar equivalencia** confirma la incorporación a la pauta. Las solicitudes se cancelan al cambiar de producto o cerrar el modal, y las respuestas de otra versión/selección se rechazan. Si Gemini falla, el error queda visible y las referencias anteriores siguen disponibles. Las propuestas de IA se distinguen de las reglas guardadas y no se presentan como parte de la pauta original.
