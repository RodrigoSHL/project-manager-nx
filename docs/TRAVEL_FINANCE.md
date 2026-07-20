# Finanzas de Travel Planner

## Diseño

El módulo extiende la aplicación existente: navegador → BFF autenticado → Travel
Planner API → PostgreSQL. No incorpora otro servicio ni una fuente externa obligatoria.

- Los montos se almacenan como `bigint` en unidades mínimas. El tipo de cambio se
  guarda como `numeric(24,12)` y la conversión se calcula con aritmética entera.
- Cada gasto conserva monto/moneda original, tasa aplicada y monto en la moneda base.
- Las divisiones se persisten en `expense_splits`; no se reconstruyen desde el gasto.
- Una liquidación es un registro separado y nunca modifica el costo del viaje.
- Los gastos usan borrado lógico. Las liquidaciones se anulan con usuario y fecha.
- Una actividad admite costo planificado y como máximo un gasto real vinculado. La
  restricción única en `expenses.activityId` evita contabilizarla dos veces.
- El formulario de actividad permite opcionalmente crear ese gasto al guardar. El
  usuario elige categoría, pagador, participantes y tasa manual cuando la moneda es
  distinta de la moneda base. Los precios por persona se multiplican por la cantidad
  de participantes antes de registrar el gasto.
- El propietario administra todos los gastos. Un editor crea gastos y modifica o
  elimina los que creó. Los viewers solo consultan. La API verifica que pagadores,
  participantes y actividades pertenezcan al viaje.

## Migración

`1784332900000-CreateTripFinance.ts` agrega `trips.baseCurrency`, los campos
financieros opcionales de `activities` y las tablas `trip_budgets`, `expenses`,
`expense_splits`, `settlements` y `exchange_rates`, con claves, checks e índices.
Es compatible con viajes y actividades existentes porque los campos nuevos de
actividad son opcionales y la moneda base tiene `USD` como valor inicial.

En producción, `travel-planner-api` ya usa `TRAVEL_MIGRATIONS_RUN=true` y
`TYPEORM_SYNCHRONIZE=false`; la migración se ejecuta al iniciar el servicio. Antes de
desplegar debe realizarse el backup PostgreSQL exigido por `ADDING_APPLICATION_OCI.md`.
No se realizó despliegue ni se modificó una base remota como parte de este cambio.

## API

Todas las rutas requieren JWT en el BFF y se publican bajo
`/api/trips/:tripId/finance`:

- `GET|PUT /budget`
- `GET|POST /expenses`
- `PATCH|DELETE /expenses/:id`
- `POST /expenses/:id/duplicate`
- `GET /summary`
- `GET /balances`
- `POST /settlements`
- `POST /settlements/:id/void`
- `GET|POST /rates`

El listado acepta paginación, búsqueda, fecha, categoría, participante, pagador,
tipo, estado, moneda, ciudad, actividad y ordenamiento. Resumen y balances se
calculan en la API; el frontend no necesita descargar el historial completo.

## Verificación local

```bash
npx jest --config apps/travel-planner-api/jest.config.ts --runInBand
NODE_ENV=production NX_DAEMON=false npx nx run-many -t build \
  -p travel-planner-api,bff-api,travel-planner-app --parallel=1 --skip-nx-cache
NODE_ENV=production NX_DAEMON=false npx nx lint travel-planner-app --skip-nx-cache
```

## Alcance preparado para iteraciones posteriores

La primera versión admite URL de comprobante, ítems y grupo recurrente en el modelo,
pero no almacena archivos ni programa recurrencias automáticamente porque el proyecto
no tiene infraestructura de uploads o jobs. Los presupuestos por categoría/persona y
los tipos de cambio históricos están modelados en la API; la UI inicial prioriza el
presupuesto total y la tasa manual. Reembolsos se dejaron fuera deliberadamente: no se
aceptan montos negativos y deben incorporarse luego como un tipo explícito y auditable.
