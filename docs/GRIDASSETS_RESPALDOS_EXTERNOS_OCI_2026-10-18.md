# Respaldos externos de producción — 18 de octubre de 2026

## Qué se respalda

Una copia diaria de **todas las bases del PostgreSQL compartido**, no solo `inspection_db`: `files_db`, `inspection_db`, `project_management_db`, `travel_planner_db` y `user_management_db` (más la base administrativa `postgres`). Hoy `files_db` guarda las fotos y otros archivos sincronizados en `file_blobs.data` (`bytea`), por lo que viajan dentro del respaldo SQL.

El archivo también incluye `.env.deploy`, `docker-compose.prod.yml` y `docker/Caddyfile`, necesarios para reconstruir el despliegue. El código se recupera del repositorio Git y las imágenes se vuelven a construir. **No incluye** fotos o respuestas que todavía permanezcan solo en IndexedDB de un navegador sin sincronizar.

## Destino y programación

- Bucket privado OCI Object Storage: `atomdev-prod-backups-scl`, namespace `axqqg7mdu7lk`, región `sa-santiago-1`.
- Objetos: `daily/AAAA-MM-DD/atomdev-prod-AAAAMMDDTHHMMSSZ.tar`.
- `atomdev-oci-backup.timer`: cada día a las 07:00 UTC. Con `Persistent=true`, systemd recupera una ejecución perdida después de reiniciar la VM.
- Regla de ciclo de vida `delete-after-30-days`: elimina objetos después de 30 días. Los respaldos antiguos de `/home/ubuntu/backups` permanecen en la VM y **no** están sujetos a esta regla.
- La VM usa OCI Instance Principals. Su grupo dinámico está limitado a esta instancia; la política le permite crear y leer objetos del bucket, sin borrarlos. OCI cifra los objetos en reposo; el archivo también viaja por TLS. El contenido de `.env.deploy` sigue siendo sensible: no copiar el `.tar` a equipos o buckets públicos.

## Cómo funciona

`scripts/backup-oci.sh` usa `pg_dumpall`, comprime el SQL, agrega los tres archivos de configuración y sus SHA-256 a un `.tar`, lo sube con `scripts/oci-backup-object.py` y vuelve a leer el objeto remoto completo para comparar tamaño y SHA-256. Una carga fallida termina con código distinto de cero. El script usa `flock` para impedir dos ejecuciones simultáneas y elimina sus temporales al salir. El último éxito queda en `/home/ubuntu/backups/offsite-last-success.json`.

La VM usa el SDK oficial `oci` en `/home/ubuntu/.local/oci-cli-venv` (el directorio conservó ese nombre aunque se instaló el SDK, no el CLI). Las unidades versionadas están en `infra/systemd/` y las declaraciones IAM en `infra/oci/`.

Para reinstalar la automatización en otra VM, clonar este repositorio, crear un entorno virtual de Python e instalar `infra/oci/backup-requirements.txt`. Copiar las unidades de `infra/systemd/` a `/etc/systemd/system/`, ejecutar `systemctl daemon-reload` y activar `atomdev-oci-backup.timer`. La ruta del intérprete del entorno virtual y las rutas del repositorio en los scripts y la unidad deben coincidir con las de la nueva VM. También se debe cambiar la regla del grupo dinámico de OCI para autorizar **la nueva instancia**; la política actual está limitada a la VM de producción original. Comprobar el acceso al bucket y ensayar una restauración antes de confiar en la programación.

## Verificación operativa

```bash
systemctl list-timers atomdev-oci-backup.timer --no-pager
systemctl status atomdev-oci-backup.timer --no-pager
systemctl status atomdev-oci-backup.service --no-pager
journalctl -u atomdev-oci-backup.service -n 50 --no-pager
cat /home/ubuntu/backups/offsite-last-success.json
```

El respaldo se considera vigente si el objeto existe en OCI, su verificación terminó bien y el `created_utc` del último éxito tiene menos de 24 horas desde la ejecución esperada. El archivo de estado local es una ayuda, **no sustituye** la comprobación del objeto remoto. Si el servicio falla, leer `journalctl`, corregir la causa y ejecutar `sudo systemctl start atomdev-oci-backup.service`; luego verificar el nuevo objeto.

## Restauración de ensayo

En la VM, `bash /home/ubuntu/project-manager-nx/scripts/verify-oci-backup.sh` descarga el último objeto, comprueba los checksums, restaura el SQL en un contenedor PostgreSQL 15 temporal con `--network none` y sin puertos publicados, y comprueba las bases, tablas y archivos. El contenedor y la copia local se borran al terminar. Se puede pasar un nombre de objeto como argumento para ensayar otra fecha.

El 18 de octubre se probó el objeto `daily/2026-10-18/atomdev-prod-20261018T192757Z.tar` (155.852.800 bytes, SHA-256 `e89c3364a39b0e5069376f8f29d4047b79add654c2268354d8a1a066f8eea325`). La descarga, checksums e importación pasaron. Se restauraron las cinco bases de aplicación, con 26 tablas en `inspection_db`, tres en `files_db` y **62 archivos sincronizados / 136.578.488 bytes**. La importación reportó cero errores SQL. No se tocó la base de producción.

Este ensayo prueba la integridad de datos y configuración. Aún falta un simulacro de reconstrucción completa de servicios, autenticación, apertura de un trabajo, visualización de una foto e informe, medición de RTO y un aviso externo automático en caso de fallo. Por eso no se publica todavía un SLA de recuperación.

## Restauración ante incidente

1. Elegir un objeto verificado y descargarlo en un entorno privado. Conservar el original intacto.
2. Comprobar `sha256sum -c SHA256SUMS` y `gzip -t postgres-all.sql.gz`.
3. Provisionar una VM/volumen limpio y PostgreSQL 15. Restaurar `postgres-all.sql.gz` con `psql` como superusuario. Probar primero sin puertos públicos y sin conectar aplicaciones que escriban.
4. Reponer `.env.deploy`, Compose y Caddy con permisos restrictivos. Traer el código del commit correcto y reconstruir imágenes.
5. Verificar acceso por tenant, un trabajo, una foto sincronizada y un informe antes de abrir tráfico.
6. Registrar punto recuperado, tiempo real y cualquier dato posterior al respaldo que se deba reconstruir.

La frecuencia diaria implica una pérdida potencial de hasta aproximadamente 24 horas de cambios del servidor. Las fotos aún no sincronizadas del navegador requieren conservar ese navegador y sincronizarlas; no están en el backup remoto.
