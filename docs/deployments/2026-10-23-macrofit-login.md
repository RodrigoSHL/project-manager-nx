# MacroFit: login de plataforma

## Despliegue

- Fecha: 23 de octubre de 2026, 00:44, America/Santiago.
- Commit funcional: `049a568` (`feat(macrofit): add platform login and isolate account records`).
- Rama: `feat/app-improvements`.
- URL: <https://macrofit.atomdev.cl/login>.
- Comando: `bash scripts/deploy-oci.sh --services bff-api,macro-fit-web --skip-local-build --yes`.
- Servicios actualizados en orden: `bff-api` y `macro-fit-web`.
- Las imágenes locales ya se habían construido y validado. El script construyó las imágenes ARM64 en OCI, verificó la salud y ejecutó las comprobaciones internas y HTTPS.
- MacroFit API, User API, PostgreSQL y Caddy conservaron sus contenedores. No se modificaron secretos, esquema de datos, DNS ni configuración de Cloudflare.

## Alcance

MacroFit reutiliza `/api/auth/login` y `/api/auth/profile` del BFF y las identidades de User API. Los tres endpoints públicos de análisis requieren JWT, incluido el alias anterior de fotografías. Health y readiness siguen públicos.

El frontend restaura la sesión validando el perfil, maneja expiración y logout y separa perfil, metas, diarios, alimentos y combos por cuenta dentro del navegador. Una cuenta nueva empieza con diario vacío. Los registros anteriores permanecen sin asignar hasta que su propietario confirma la importación; no se importaron durante las pruebas productivas.

Los datos de nutrición siguen siendo locales, sin sincronización entre dispositivos. La sesión usa JWT en localStorage, siguiendo el patrón existente; no se agregó SSO ni se cambió la política común de revocación de tokens.

## Validaciones

- 165 tests aprobados: 128 de BFF y 37 del frontend.
- Lint sin errores, TypeScript, builds Nx, las dos imágenes Docker y sintaxis de scripts aprobados.
- Los tres endpoints de análisis respondieron 401 a solicitudes anónimas y tokens inválidos, sin contactar al proveedor.
- Se creó una cuenta temporal de rol `user` mediante el registro real de la plataforma. No se modificaron cuentas existentes.
- Contraseña incorrecta: 401. Login válido: 200. Perfil del mismo usuario: 200.
- Un análisis de texto con JWT real respondió 200 en 1962 ms y conservó 200 g de carne, 50 g de arroz, 40 g de palta y 9 g de mayonesa.
- Un archivo de texto enviado como imagen con sesión válida respondió 415.
- Desde el navegador público se comprobó login, apertura de un diario vacío y logout. Los registros locales anteriores permanecieron sin importar. La PWA tomó la versión nueva tras una recarga normal, sin borrar almacenamiento.
- El bundle público incluye login y perfil y no contiene URLs internas ni la IP de origen. El service worker referencia el bundle vigente y responde `no-cache, no-store, must-revalidate`, con `CF-Cache-Status: BYPASS`.
- BFF y frontend saludables y sin líneas recientes de error al finalizar el script. Las aplicaciones existentes conservaron disponibilidad y las rutas protegidas siguieron respondiendo 401 sin JWT.
- La cuenta temporal se eliminó después de cerrar sesión, comprobando antes su UUID, correo y nombre. La consulta posterior respondió 404. Se eliminó también el archivo local privado de credenciales; no se guardaron contraseñas ni tokens en este informe.

## Respaldo y rollback

- Respaldo verificado: `/home/ubuntu/backups/deploy-20261023T034314Z`.
- Incluye PostgreSQL comprimido verificado con `gzip -t`, `.env.deploy`, Compose y Caddy.
- Imágenes anteriores: `project-manager-nx-bff-api:rollback-20261023T034314Z` y `project-manager-nx-macro-fit-web:rollback-20261023T034314Z`.
- El script comprobó que `.env.deploy` no cambió.

El rollback requiere restaurar conjuntamente las imágenes anteriores de BFF y frontend y recrear esos servicios con `--no-deps`. No hay migración que revertir. Los registros locales originales y los de cuentas se conservan en claves distintas.

El cambio previo de Caddy para Serviu y el informe previo de Jira quedaron fuera del commit funcional de MacroFit.
