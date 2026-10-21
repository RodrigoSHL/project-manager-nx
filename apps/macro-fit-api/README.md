# MacroFit API

API NestJS interna para analizar imágenes con Gemini. No contiene simuladores ni genera respuestas de ejemplo cuando falla el proveedor.

## Contrato

- Puerto: `MACRO_FIT_API_PORT=3007` (acepta `PORT` como fallback).
- Prefijo: `API_PREFIX=api`.
- `GET /api/health`: el proceso está activo. No comprueba Gemini.
- `GET /api/ready`: la clave de Gemini está configurada. No contacta al proveedor, no verifica su validez y no consume cuota.
- `POST /api/analyze-plate`: recibe multipart con `image`, `hints` opcional (máximo 500 caracteres) y `plateTypeHint` opcional (`plato_extendido`, `plato_hondo`, `bowl`).
- Imágenes JPEG, PNG o WebP de hasta 5 MiB y 16 millones de píxeles, sin animación. Se decodifican, redimensionan a un máximo de 1280×1280 y normalizan a JPEG sin metadatos antes de enviarlas al proveedor.
- JSON con imágenes base64 ya no forma parte del contrato. El cliente web siempre utiliza multipart.

El navegador accede mediante BFF: `POST /api/macrofit/analyze-plate`. BFF conserva `/api/analyze-plate` como alias para PWA anteriores. Los endpoints públicos de estado son `/api/macrofit/health` y `/api/macrofit/ready`.

## Configuración

| Variable | Default / significado |
|---|---|
| `GEMINI_API_KEY` | Sin default. Ausente: readiness y análisis responden 503 |
| `GEMINI_MODEL` | `gemini-3.1-flash-lite` |
| `GEMINI_TIMEOUT_MS` | 15000, entero entre 1 y 30000 |
| `MACROFIT_REQUESTS_PER_MINUTE` | 10 solicitudes al proveedor por minuto e instancia; máximo configurable 1000 |
| `MACROFIT_MAX_CONCURRENT_ANALYSES` | 2 solicitudes al proveedor simultáneas; máximo configurable 20 |
| `CORS_ORIGIN` | Lista explícita de orígenes, utilizando la variable común del monorepo |

Los límites son globales por proceso, en memoria: se reinician al recrear el contenedor y no son una cuota por usuario ni un presupuesto mensual. La calculadora sigue siendo pública. Si se escala a varias réplicas, se requiere un límite compartido o una cuota del proveedor para controlar el total.

Los errores no incluyen payloads, claves o mensajes internos de Gemini:

| HTTP | Significado |
|---|---|
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

Configurar `MACROFIT_API_URL=http://localhost:3007/api` en el entorno del BFF. Vite utiliza localhost:3000 como proxy. La API no necesita base de datos; los registros de la calculadora siguen en localStorage.

```bash
npx nx run-many -t build,lint,test -p macro-fit-api,macro-fit-web,bff-api --parallel=1
```

El build de MacroFit Web depende de `typecheck`; un fallo TypeScript bloquea la imagen. Los tests del proveedor usan mocks explícitos, exclusivamente en tests.

Para probar Gemini real de manera deliberada, con una foto de comida:

```bash
node scripts/smoke-macrofit.mjs http://localhost:3000 /ruta/foto.jpg
```

Esto consume una llamada del proveedor. No forma parte de los sondeos periódicos.

El código de modelo fue contrastado con la [documentación oficial de Gemini](https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-lite).
