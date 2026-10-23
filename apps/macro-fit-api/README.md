# MacroFit API

El catálogo personal, la búsqueda externa y la lectura de tablas nutricionales se describen en [Productos de MacroFit](../../docs/MACROFIT_PRODUCTS.md).

API NestJS interna para analizar imágenes y descripciones de comidas con Gemini. No contiene simuladores ni genera respuestas de ejemplo cuando falla el proveedor.

## Contrato

- Puerto: `MACRO_FIT_API_PORT=3007` (acepta `PORT` como fallback).
- Prefijo: `API_PREFIX=api`.
- `GET /api/health`: el proceso está activo. No comprueba Gemini.
- `GET /api/ready`: la clave de Gemini está configurada. No contacta al proveedor, no verifica su validez y no consume cuota.
- `POST /api/analyze-plate`: recibe multipart con `image`, `hints` opcional (máximo 500 caracteres) y `plateTypeHint` opcional (`plato_extendido`, `plato_hondo`, `bowl`).
- Imágenes JPEG, PNG o WebP de hasta 5 MiB y 16 millones de píxeles, sin animación. Se decodifican, redimensionan a un máximo de 1280×1280 y normalizan a JPEG sin metadatos antes de enviarlas al proveedor.
- JSON con imágenes base64 ya no forma parte del contrato. El cliente web siempre utiliza multipart.
- `POST /api/analyze-meal-text`: recibe JSON `{ "text": "Almorcé 200 g de carne y 50 g de arroz", "mealType": "lunch" }`. `text` se recorta y debe tener entre 5 y 2000 caracteres; `mealType` es opcional (`breakfast`, `colacion_am`, `lunch`, `colacion_pm`, `dinner`, `snacks`). Se rechazan campos adicionales.

El navegador accede mediante BFF: `POST /api/macrofit/analyze-plate`. BFF conserva `/api/analyze-plate` como alias para PWA anteriores. Los endpoints públicos de estado son `/api/macrofit/health` y `/api/macrofit/ready`.

Los análisis de imagen, su alias anterior y el análisis de texto requieren `Authorization: Bearer <JWT>` en el BFF, usando la sesión común de `/api/auth/login`. Una sesión ausente, inválida o vencida devuelve 401 antes de cargar la imagen o contactar al proveedor. Health y readiness permanecen públicos. Esta API no valida credenciales ni se publica directamente; el límite de autenticación está en el BFF.

El análisis de texto se publica solo mediante BFF en `POST /api/macrofit/analyze-meal-text`. Reutiliza `GEMINI_MODEL`, las validaciones nutricionales, el límite de concurrencia, la cuota y el plazo total de las imágenes. No requiere otro proveedor ni nuevas variables.

Su respuesta conserva el formato de ingredientes del análisis de imagen y agrega `meal_type` (incluye `unspecified`), `assumptions` y `items[].quantity_source` (`declared` para g/kg explícitos, `estimated` para cantidades vagas, unidades domésticas o piezas). El prompt pide conservar los gramos declarados, señalar las suposiciones de preparación y evitar afirmar que se verificó una etiqueta comercial. Los valores nutricionales son estimaciones del modelo, no una consulta a una base de etiquetas. Si se selecciona un tiempo de comida, esa selección prevalece sobre la inferencia. Si el modelo no identifica alimentos consumidos, la API devuelve 400 y no inventa una comida.

## Configuración

| Variable | Default / significado |
|---|---|
| `GEMINI_API_KEY` | Sin default. Ausente: readiness y análisis responden 503 |
| `GEMINI_MODEL` | `gemini-3.5-flash-lite` |
| `GEMINI_TIMEOUT_MS` | 30000, entero entre 1 y 30000; plazo total, incluido el reintento |
| `MACROFIT_REQUESTS_PER_MINUTE` | 10 solicitudes al proveedor por minuto e instancia; máximo configurable 1000 |
| `MACROFIT_MAX_CONCURRENT_ANALYSES` | 2 solicitudes al proveedor simultáneas; máximo configurable 20 |
| `CORS_ORIGIN` | Lista explícita de orígenes, utilizando la variable común del monorepo |

Un fallo HTTP temporal del proveedor admite un único reintento. Ambos intentos comparten el plazo total y cada llamada consume el límite por minuto. No se reintentan credenciales inválidas ni cuotas del proveedor agotadas.

Los límites son globales por proceso, en memoria: se reinician al recrear el contenedor y no son una cuota por usuario ni un presupuesto mensual. Los análisis requieren sesión, pero comparten estos límites entre las cuentas. Si se escala a varias réplicas, se requiere un límite compartido o una cuota del proveedor para controlar el total.

Los errores no incluyen payloads, claves o mensajes internos de Gemini:

| HTTP | Significado |
|---|---|
| 401 | Sesión ausente, inválida o vencida, rechazada por el BFF |
| 400 / 415 / 413 | Metadatos/imagen inválidos, formato no admitido o tamaño excesivo |
| 429 | Límite de llamadas o concurrencia de esta API |
| 502 | Fallo del proveedor o respuesta vacía/inválida |
| 503 | Clave ausente, configuración del proveedor inválida, proveedor sin cuota o no disponible |
| 504 | Se agotó el plazo de respuesta |

El timeout aborta la espera HTTP del SDK y libera los recursos locales. Cancelar una solicitud no garantiza cancelar el trabajo que el proveedor ya recibió ni evita necesariamente su cobro.

## Desarrollo y verificación

Iniciar API, BFF y frontend con Nx en terminales separadas:

```bash
npx nx serve macro-fit-api
npx nx serve bff-api
npx nx serve macro-fit-web
```

Configurar `MACROFIT_API_URL=http://localhost:3007/api` en el entorno del BFF. Vite utiliza localhost:3000 como proxy. La API necesita PostgreSQL: crea `macrofit_db`, configura las variables `MACROFIT_DB_*` (credenciales con fallback `DATABASE_*`) y `MACROFIT_MIGRATIONS_RUN=true`. Mantén `synchronize=false`.

En desarrollo, estas variables deben existir en el `.env` real de la raíz; actualizar `env.example` no modifica un `.env` existente. Reinicia `nx serve macro-fit-api` después de cambiarlo: las migraciones se ejecutan al iniciar la API, no al levantar solamente PostgreSQL. `docker-compose.yml` declara la base para volúmenes nuevos; un volumen existente conserva sus bases y no vuelve a ejecutar `init-db.sh`.

```bash
npx nx run-many -t build,lint,test -p macro-fit-api,macro-fit-web,bff-api --parallel=1
```

El build de MacroFit Web depende de `typecheck`; un fallo TypeScript bloquea la imagen. Los tests del proveedor usan mocks explícitos, exclusivamente en tests.

Para probar Gemini real de manera deliberada, con una foto de comida:

```bash
node scripts/smoke-macrofit.mjs http://localhost:3000 /ruta/foto.jpg
```

Esto consume una llamada del proveedor. No forma parte de los sondeos periódicos.
El script requiere `MACROFIT_SMOKE_TOKEN` en el entorno con un JWT válido de la plataforma; no imprime el token. El despliegue verifica que los análisis anónimos respondan 401 y solo prueba una foto real cuando se proporcionan tanto `MACROFIT_SMOKE_IMAGE` como `MACROFIT_SMOKE_TOKEN`.

El código de modelo fue contrastado con la [documentación oficial de Gemini](https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite).


## Registros personales en PostgreSQL

Se mantiene el API `macro-fit-api`, puerto interno 3007 (`MACRO_FIT_API_PORT`), el BFF `MACROFIT_API_URL=http://macro-fit-api:3007/api` y el dominio existente. No se necesitan cambios DNS, Cloudflare ni rutas nuevas de Caddy. Se reutilizan `Dockerfile.api` y `Dockerfile.vite`; ambos ya incluyen `libs`, donde vive `macrofit-contracts` con los tipos y validaciones compartidos.

La configuración usa `TypeOrmModule.forRootAsync`, igual que Inspection API, con variables `MACROFIT_DB_HOST`, `MACROFIT_DB_PORT`, `MACROFIT_DB_USERNAME`, `MACROFIT_DB_PASSWORD`, `MACROFIT_DB_NAME` y `MACROFIT_MIGRATIONS_RUN`. Host, puerto y credenciales admiten el fallback común `DATABASE_*`; la base por defecto es `macrofit_db`. `DATABASE_SSL` conserva la convención existente. `synchronize` siempre es falso.

La migración `CreateNutritionRecords1792713600000` crea seis tablas: perfiles/metas, diarios, comidas, alimentos propios, plantillas y operaciones de hidratación. No inserta filas de ejemplo. El propietario es el UUID externo de User API, sin claves foráneas entre bases. Los documentos nutricionales son JSONB validados y los diarios, propietarios e identificadores tienen claves e índices relacionales. La clave compuesta del diario se referencia desde comidas e hidratación. Un contador generado conserva el orden de una confirmación con varios alimentos.

Cada modificación usa una transacción y un bloqueo por usuario en PostgreSQL, compartido entre réplicas. Los lotes de comidas son atómicos; repetir los mismos identificadores no duplica entradas y reutilizarlos con otro contenido devuelve 409. La hidratación tiene un UUID de operación para evitar incrementos duplicados. El historial sobrevive al reinicio del proceso.

Todas las rutas públicas siguientes requieren JWT y usan el prefijo `/api/macrofit/me`. El BFF reemplaza `x-user-id` por el UUID verificado. El API interno recibe `/api/me` y exige esa identidad, siguiendo el límite de confianza de Travel API: no publicar el puerto interno fuera de la red Docker.

| Método y sufijo | Función |
|---|---|
| `GET /` | Perfil/metas (null si no existen), alimentos, combos y estado de importación |
| `PUT /settings` | Guardar `{profile, goals}` de forma atómica |
| `GET /days/:date` | Diario `YYYY-MM-DD`, vacío si todavía no existe |
| `POST /days/:date/meals` | Agregar `{entries: [...]}` en una transacción |
| `PUT /days/:date/meals/:id/quantity` | Corregir `{quantity: {amount, unit}, expectedQuantity: {amount, unit}}` conservando la unidad original |
| `PUT /days/:date/meals/:id/product-equivalence` | Guardar una equivalencia de un producto propio y clasificar el consumo de forma atómica |
| `DELETE /days/:date/meals/:id` | Retirar una comida propia |
| `POST /days/:date/water` | `{operationId, amountMl, reset?}`; incremento o reinicio |
| `PUT /foods`, `PUT /templates` | Guardar alimentos o combos propios |
| `DELETE /foods/:id`, `DELETE /templates/:id` | Eliminar un elemento propio |
| `POST /import` | Importar `{settings?, foods, templates, logs}` una vez sin sobrescribir datos del servidor |

Fechas reales, cantidades finitas, campos anidados, límites y campos desconocidos se validan con Zod. No se aceptan propietarios en los cuerpos. Lecturas personales llevan `Cache-Control: no-store`. El JSON de API/BFF admite hasta 5 MiB para historiales; no cambia el límite independiente de imágenes. `/api/health` ahora comprueba la conexión PostgreSQL y responde 503 si falla.

Editar una cantidad conserva identidad, fecha y posición del alimento. La primera edición guarda una referencia nutricional privada en el JSONB existente, que permite recalcular sin acumular redondeos ni consultar el catálogo actualizado. La respuesta no expone esa referencia. Las equivalencias usan la versión de pauta del diario y sus cantidades explícitas se ajustan proporcionalmente. La cantidad esperada evita sobrescribir un cambio concurrente (409); las unidades no se convierten automáticamente. No requiere migraciones nuevas.

La clasificación desde producto recibe `productId`, `expectedPlanVersion`, `expectedDayPlanVersion`, `expectedQuantity`, una `equivalence` explícita (`referenceAmount`, `unit`, `contributions`, `free`, `notes`) y una `quantity` opcional si hay que expresar el consumo en otra unidad. Verifica la propiedad de producto y consumo, valida el contrato estricto en BFF/API y rechaza versiones/cantidades desactualizadas con 409. Devuelve `{account, day}` validados por el contrato compartido. No consulta proveedores ni deduce equivalencias nutricionales.

Esta operación requiere la migración `AddDayProductEquivalences1792785600000`, registrada en la configuración habitual de TypeORM. Agrega `nutrition_daily_logs.product_rules` JSONB con un arreglo vacío para los días existentes. Se guarda una versión nueva de la pauta de cuenta con la referencia del producto y se extiende únicamente el día elegido, conservando su versión de metas y las referencias anteriores. Las referencias diferentes reciben identidades diferentes; no se modifican nutrientes ni otros consumos. Una aplicación explícita de una pauta nueva a hoy reemplaza también estas adiciones del día. Se mantiene `synchronize=false`; el despliegue ejecuta la migración mediante `MACROFIT_MIGRATIONS_RUN=true`.

Compose agrega la base al init de instalaciones nuevas y espera PostgreSQL saludable antes de iniciar MacroFit API, con migraciones activadas. Para volúmenes existentes, `scripts/deploy-oci.sh` crea la base si falta **después del backup**. No se recrea PostgreSQL. El rollback de imágenes conserva las tablas; `down` elimina las tablas y solo se usa en bases de prueba desechables.

La integración con PostgreSQL se ejecuta explícitamente contra una base temporal cuyo nombre empiece con `macrofit_test`:

```bash
MACROFIT_TEST_DATABASE_URL=postgresql://usuario:clave@localhost:5432/macrofit_test \
  NX_DAEMON=false NX_NO_CLOUD=true npx nx test macro-fit-api
```

Esta suite reinicia sus tablas con migraciones, comprueba CRUD, aislamiento, idempotencia, escrituras concurrentes, importación, reconexión y migraciones down/up. No usar una base con datos reales. Sin esa variable, la suite se omite; las pruebas unitarias y HTTP restantes siguen ejecutándose.
