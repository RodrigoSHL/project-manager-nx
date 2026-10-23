# MacroFit: navegación y edición de cantidades

Despliegue completado el 23 de octubre de 2026 a las 17:00:07 de Chile.

## Alcance

- URL: https://macrofit.atomdev.cl
- Servicios: `macro-fit-api` → `bff-api` → `macro-fit-web`.
- Sidebar, barra de usuario, perfil/configuración, selector de fecha y comidas plegables.
- Accesos de IA con iconos y edición de cantidades por alimento.
- `PUT /api/macrofit/me/days/:date/meals/:id/quantity` recalcula desde la referencia nutricional histórica y conserva la pauta del diario.
- Sin nuevas migraciones, variables, cambios de DNS/Cloudflare ni recreación de Caddy/PostgreSQL.

Se desplegó una copia aislada del código pendiente sobre `9866d29`, sin crear commits nuevos. Se excluyeron los documentos y cambios locales ajenos a MacroFit. El Caddyfile de la copia conserva el contenido que ya existía en producción.

## Validación

- 297 pruebas aprobadas: 85 API (incluye PostgreSQL desechable), 140 BFF y 72 frontend.
- Builds Nx/TypeScript, Docker local y Docker ARM64 remoto correctos para los tres servicios.
- Los tres contenedores quedaron saludables, sin errores al arrancar.
- HTTPS, login, health y readiness: 200. Registros y análisis sin JWT: 401.
- Bundle publicado contiene los controles nuevos y no contiene URLs HTTP internas.
- Prueba funcional por HTTPS con dos identidades temporales: edición 140 g → 120 g, macros y porciones recalculados, persistencia, restauración sin redondeo acumulado, cantidades decimales en ml, reintentos idempotentes, conflicto 409 y aislamiento entre cuentas.
- Se preservaron los demás alimentos y el agua del diario de prueba.
- Limpieza transaccional: cero filas temporales restantes.
- Otros 15 contenedores conservaron su identidad; los smoke tests de las demás aplicaciones pasaron.
- Gemini se comprobó a nivel de configuración; no se hicieron llamadas al proveedor.

## Respaldo y rollback

- Backup verificado: `/home/ubuntu/backups/deploy-20261023T195808Z`.
- Incluye PostgreSQL completo, `.env.deploy`, Compose y Caddy.
- Imágenes anteriores: `project-manager-nx-<servicio>:rollback-20261023T195808Z`.
- El entorno remoto se comparó con el respaldo y no cambió.

Para revertir, etiquetar las imágenes anteriores como `latest` y recrear únicamente los tres servicios en orden API → BFF → frontend con `--no-deps`. No restaurar ni eliminar el volumen de PostgreSQL: este cambio conserva el esquema y agrega una referencia privada dentro del JSONB existente.

El preflight informó el puerto 111 ya existente en la VM. Este despliegue no modificó puertos ni reglas de red.
