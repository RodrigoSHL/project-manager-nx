# Alertas y ensayo integral de recuperación — 20 de octubre de 2026

## Estado

**Alertas activas desde el 20 de octubre de 2026.** La VM ejecutó un respaldo manual completo con el nuevo código; el objeto `daily/2026-10-20/atomdev-prod-20261020T133004Z.tar` quedó verificado y OCI recibió la métrica `VerifiedBackup` a las 13:31 UTC. El servicio terminó con `Result=success`, el timer diario siguió habilitado y la alarma `atomdev-prod-backup-verified-absence` quedó habilitada en estado `OK`.

Se ejecutó el aviso de prueba `ensayo-manual` sin forzar un fallo del respaldo. OCI aceptó la publicación y el usuario confirmó recepción en ambos buzones. El ensayo previo restauró las bases y 62 archivos; aún falta levantar la aplicación desde una copia aislada y medir el tiempo total.

Destinatarios activos: `shl.catalan@gmail.com` y `rodrigo@atomdev.cl`. Ambos confirmaron la suscripción OCI y se verificó su estado `ACTIVE`.

## Diseño

1. `backup-oci.sh` ya verifica la copia en Object Storage leyendo y comparando SHA-256. Al terminar emite `atomdev_backup.VerifiedBackup=1` con dimensión `server=atomdev-prod`. No emite una señal antes de verificar el objeto remoto.
2. Si falla el servicio, `OnFailure` inicia `atomdev-oci-backup-alert@.service`, que publica un aviso al tema OCI. El mensaje contiene fecha, host y unidad; nunca incluye el archivo, sus secretos ni el log SQL.
3. Una alarma de OCI Monitoring consulta `VerifiedBackup[1m]{server = "atomdev-prod"}.groupBy(server).absent(25h)`. Detecta ausencia de señales aunque la VM se apague. El margen de una hora sobre las 24 horas evita avisar mientras termina el respaldo programado a las 07:00 UTC. Si el respaldo tarda más, revisar ese margen con tiempos reales.

El archivo `offsite-last-success.json` sigue siendo una referencia local. Una señal de Monitoring fallida hace fallar la tarea para activar el aviso inmediato, aunque el objeto ya se haya copiado y verificado. Esto exige revisar el resultado antes de repetir un respaldo: puede existir una copia íntegra con la alerta de telemetría.

## Reinstalación segura en OCI y la VM

No instalar la nueva unidad `atomdev-oci-backup.service` antes de completar la configuración OCI: requiere `/etc/atomdev-backup-alert.env` y permiso para publicar métricas. Mantener la unidad/timer actual hasta entonces.

1. En el compartimento de operación, crear un tema `atomdev-prod-backup-alerts` de Notifications. Crear dos suscripciones EMAIL con los correos anteriores. Verificar que ambas pasen de `PENDING` a `ACTIVE` al confirmar los enlaces recibidos. En la instalación actual, el tema está en el compartimento raíz de la tenencia.
2. Añadir a la política del grupo dinámico de la VM las dos declaraciones nuevas en `infra/oci/atomdev-prod-backup-policy.json`: permiso de métricas en `atomdev_backup` y `ONS_TOPIC_PUBLISH`. Las declaraciones de Object Storage existentes se mantienen.
3. Obtener el OCID del compartimento de métricas, OCID del tema y `api-endpoint` del tema (`oci ons topic get --topic-id ...`). Crear en la VM `/etc/atomdev-backup-alert.env`, propiedad `root:root`, modo `0600` (systemd lo lee antes de iniciar el proceso `ubuntu`), con:

   ```ini
   ATOMDEV_BACKUP_METRIC_COMPARTMENT_ID=ocid1.compartment...
   ATOMDEV_BACKUP_TOPIC_ID=ocid1.onstopic...
   ATOMDEV_BACKUP_TOPIC_ENDPOINT=<api-endpoint-del-tema>
   ATOMDEV_OCI_REGION=sa-santiago-1
   ```

   Estos son identificadores de recursos, no claves. El SDK usa Instance Principals; no copiar una API key a la VM. Validar el endpoint real del tema, sin prefijos duplicados.

4. Actualizar el código de la VM, copiar las dos unidades de `infra/systemd/` a `/etc/systemd/system/`, ejecutar `systemctl daemon-reload` y conservar el timer habilitado. Ejecutar `sudo systemctl start atomdev-oci-backup.service`; revisar el objeto verificado, el estado `active (exited)` y la métrica `VerifiedBackup` en OCI.
5. Crear la alarma de ausencia deshabilitada, con namespace `atomdev_backup`, consulta MQL anterior, severidad `CRITICAL`, destino el tema y duración pendiente `PT1M`. Después de confirmar que la primera métrica es visible, habilitar la alarma. En la instalación actual se eligió formato de correo `ONS_OPTIMIZED`.
6. Ensayar el aviso inmediato invocando **solo** `scripts/oci-backup-signal.py failure ensayo-manual` desde la VM con el archivo de entorno cargado; no provocar un fallo del backup real. Confirmar recepción en ambos correos. Para probar el disparo real de la alarma de ausencia sin esperar 25 horas, crear una métrica/alarma de prueba separada con periodo corto; no detener el respaldo productivo. Esta prueba de disparo por ausencia todavía no se ha realizado.

La suscripción EMAIL requiere confirmación del destinatario según [OCI Notifications](https://docs.oracle.com/en-us/iaas/Content/Notification/Tasks/create-subscription-basic.htm). La sintaxis y el comportamiento de `absent()` están descritos por [OCI Monitoring](https://docs.oracle.com/en-us/iaas/Content/Monitoring/Tasks/create-alarm-absence.htm).

## Ensayo integral pendiente

El ensayo debe ejecutarse en una red y volúmenes Docker nuevos, sin Caddy, puertos públicos ni montaje del volumen `postgres_data` de producción. Registrar hora de inicio, descarga y verificación, importación SQL, arranque, pruebas funcionales y fin. Usar un objeto conocido por fecha y hash; conservarlo intacto.

1. Crear una VM o proyecto Compose temporal aislado. Descargar el objeto y verificar `SHA256SUMS`; restaurar el SQL en PostgreSQL 15 nuevo. El script `scripts/verify-oci-backup.sh` ya cubre este paso y cuenta tablas/archivos, pero elimina su contenedor al terminar. Para el ensayo integral, mantener una copia restaurada **independiente** en un volumen temporal.
2. Levantar `user-api`, `files-api`, `inspection-api` y `bff-api` desde el commit asociado al respaldo, apuntando solamente al PostgreSQL temporal. Desactivar migraciones y sincronización automática de esquemas para comprobar los datos restaurados sin modificarlos. No conectar ese entorno al DNS, Caddy o la red de producción.
3. Comprobar `/api/health`; iniciar sesión con una cuenta de prueba habilitada en ese respaldo o una credencial de ensayo gestionada separadamente. Verificar que un usuario de otro tenant no puede consultar el tenant elegido.
4. Consultar un Work existente y el listado de versiones de informe; leer una foto sincronizada mediante `/api/storage/files/:id/content`; generar o descargar `/api/inspection/tenants/:tenantId/works/:workId/report/pdf`. Comparar identificadores y contenido con el inventario tomado antes del ensayo. No crear un informe final ni editar datos de producción.
5. Registrar RTO observado desde el inicio hasta la primera lectura completa. Registrar RPO como diferencia entre la última escritura conocida y `created_utc` del respaldo. Documentar fallos, tamaño y duración por etapa. Eliminar solo el entorno temporal tras conservar la evidencia no sensible.

No se puede declarar superada esta prueba solo con el arranque de PostgreSQL. El resultado debe acreditar login, Work, foto e informe sobre datos restaurados. Hasta medirlo, no prometer un RTO contractual.
