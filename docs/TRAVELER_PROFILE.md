# Perfil del viajero

El módulo se integra en `travel-planner-api`, `bff-api`, `files-api` y
`travel-planner-app`; no crea otro servicio ni duplica usuarios o viajes.

## Datos y migración

La migración `1784593000000-CreateTravelerProfile` crea:

- `traveler_profiles`: datos personales, médicos y preferencias de privacidad;
- `travel_documents`: metadatos documentales, números excluidos de las consultas
  normales, archivos y vencimientos;
- `traveler_resources`: seguros, contactos, direcciones, medicamentos y
  recordatorios extensibles;
- `trip_documents`: asociación sin duplicar archivos;
- `trip_document_checklist`: checklist sugerido y editable por usuario y viaje.

En producción se ejecuta con `TRAVEL_MIGRATIONS_RUN=true` y
`TYPEORM_SYNCHRONIZE=false`, después del backup habitual de PostgreSQL.

## Seguridad

Todas las rutas públicas pasan por JWT en el BFF. El API de viajes recibe la
identidad interna y vuelve a comprobar propiedad en cada consulta o mutación.
Los IDs son UUID y una consulta de un recurso ajeno responde como no encontrado.
Los números se excluyen por defecto mediante `select: false`, se muestran
enmascarados y solo se recuperan en el endpoint de revelado con confirmación.

Los archivos se mantienen privados en `files-api`. El BFF valida que el usuario
sea dueño del documento antes de subir, listar, visualizar, descargar o borrar.
Se aceptan PDF, JPEG, PNG, HEIC y HEIF hasta `FILES_MAX_FILE_SIZE_BYTES`; el nombre
físico es un UUID y no se expone la clave de storage.

Limitaciones de infraestructura: el proveedor actual entrega contenido mediante
un endpoint autenticado del mismo origen, no mediante URLs firmadas. Tampoco hay
servicio de antivirus, cifrado de campos a nivel aplicación, correo/push ni
garantía offline. No deben habilitarse enlaces públicos hasta incorporar esas
capacidades. El borrado de un documento elimina lógicamente sus metadatos; los
archivos asociados deben eliminarse explícitamente antes de borrar el documento.

## Pruebas y vencimientos

```bash
npx jest --config apps/travel-planner-api/jest.config.ts --runInBand
npx tsc -p apps/travel-planner-api/tsconfig.app.json --noEmit
npx tsc -p apps/bff-api/tsconfig.app.json --noEmit
npx tsc -p apps/travel-planner-app/tsconfig.json --noEmit
NX_DAEMON=false npx nx build travel-planner-api --configuration=production
NX_DAEMON=false npx nx build bff-api --configuration=production
NODE_ENV=production npx next build apps/travel-planner-app
```

Para probar alertas, crear documentos con vencimiento anterior a hoy, dentro de
los próximos 180 días y posterior a 180 días. El dashboard debe clasificarlos
como vencidos, próximos a vencer y vigentes, respectivamente.
