# Despliegue Jira, Mailer e Inspection — 2026-10-04

Despliegue completado en OCI (`ubuntu@161.153.194.227`, `/home/ubuntu/project-manager-nx`) mediante `scripts/deploy-oci.sh`.

## Alcance

- `project-api`: notificaciones de menciones en comentarios y migración `AddCommentMentionNotifications1791072000000`.
- `mailer-api`: proveedor Resend y plantilla de menciones de Jira; acceso interno autenticado.
- `jira-web`: enlaces a tickets/comentarios y presentación de menciones.
- `inspection-web` y `inspection-web-qa`: actualización del frontend con enlaces y crédito a AtomDev.
- `caddy`: configuración de las rutas desplegadas.

Base Git: `39c90c0`, más los cambios locales de la integración de menciones todavía sin commit. El cambio de Inspection corresponde al commit `6ef2e73`. Los demás servicios conservaron sus imágenes existentes.

## Configuración aplicada

- `MAILER_PROVIDER=resend`.
- Remitente: `AtomDev <no-reply@notificaciones.atomdev.cl>`.
- `MAILER_API_URL=http://mailer-api:3006/api`.
- `JIRA_WEB_URL=https://jira.atomdev.cl`.
- `JIRA_MENTION_EMAILS_ENABLED=true` en producción, activado después de comprobar la salud de los servicios.
- Credenciales cargadas desde el entorno local sin incorporarlas al repositorio ni a este registro.

## Validación

- Builds locales y builds de imágenes ARM64 completados.
- Lint y build de Inspection correctos; este proyecto no tiene un target Nx de test.
- Jira, Inspection producción y QA respondieron HTTP 200 mediante HTTPS y Cloudflare.
- Health checks internos correctos para Mailer, Project, BFF, User, Files, Travel e Inspection.
- Rutas protegidas sin credenciales respondieron 401.
- La plantilla de Mailer respondió 400 a un payload vacío con autenticación válida y 401 sin token.
- Migración registrada y tabla de notificaciones presentes en PostgreSQL.
- Proveedor Resend, remitente y URL de Jira verificados en los contenedores.
- Bundles públicos de Jira e Inspection sin URLs internas detectadas.
- Sin errores recientes detectados en los servicios desplegados. En el cierre, la cola de menciones estaba vacía.
- Verificación visual de Inspection: los dos enlaces nuevos apuntan a `https://atomdev.cl`.

No se generaron comentarios ni correos de prueba en producción durante este despliegue. El envío se probará con una mención real desde Jira.

## Respaldos y rollback

Respaldos remotos de PostgreSQL y configuración, con archivo gzip de la base validado:

- `/home/ubuntu/backups/pre-mailer-config-20261004T050351Z`: antes de incorporar la configuración de Mailer.
- `/home/ubuntu/backups/deploy-20261004T050514Z`: antes de reconstruir y reemplazar los servicios, con Mailer configurado y menciones desactivadas.
- `/home/ubuntu/backups/mention-activation-20261004T050846Z`: configuración antes de activar las menciones.

Las imágenes previamente existentes tienen el tag de rollback `rollback-20261004T050514Z`. Mailer es un servicio nuevo y no tiene una imagen previa.

Para revertir la integración, primero desactivar `JIRA_MENTION_EMAILS_ENABLED` y recrear Project API; después restaurar las imágenes/configuración correspondientes al alcance que se quiera revertir. La migración es aditiva: no restaurar la base automáticamente, ya que eso descartaría datos creados después del respaldo.

## URLs

- Jira: https://jira.atomdev.cl
- Inspection: https://inspection.atomdev.cl
- Inspection QA: https://qa-inspection.atomdev.cl

Mailer permanece accesible únicamente en la red interna de Docker.
