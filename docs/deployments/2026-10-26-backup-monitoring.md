# Corrección de las alarmas de respaldo de AtomDev — 26 de octubre de 2026

## Problema y evidencia

La alarma `atomdev-prod-backup-verified-absence` usaba
`VerifiedBackup[1m]{server = "atomdev-prod"}.groupBy(server).absent(25h)` con
`pendingDuration=PT1M`, aunque la señal se emitía una vez al día.
`absent()` evalúa la ausencia dentro del intervalo `[1m]`; el parámetro `25h`
limita el periodo de detección hasta el reset, no es una espera previa al disparo.
Por eso cada respaldo la recuperaba durante un minuto y volvía a dispararse.
Referencia: [MQL de Oracle](https://docs.oracle.com/en-us/iaas/Content/Monitoring/Reference/mql.htm).

Los logs del 23, 24 y 25 de octubre acreditan respaldos diarios completos con
comparación SHA-256 del objeto remoto. El del día 25 terminó a las 07:00:21 UTC;
su objeto es `daily/2026-10-25/atomdev-prod-20261025T070003Z.tar`, de
164229120 bytes. También se comprobó por HEAD que ese objeto sigue existiendo
y coincide en tamaño con el registro de respaldo verificado.

## Diseño corregido

| Componente | Comportamiento |
|---|---|
| Respaldo diario | Conserva las 07:00 UTC, subida y lectura/comparación SHA-256; emite `VerifiedBackup` como antes. |
| Monitor cada cinco minutos | Publica `VerifiedBackupAgeSeconds` calculado desde `created_utc` de `offsite-last-success.json`. No ejecuta respaldos ni modifica el registro. |
| `atomdev-prod-backup-age` | `VerifiedBackupAgeSeconds[5m]{server = "atomdev-prod"}.groupBy(server).max() > 90000`, pendiente 1 minuto. Reutiliza el OCID de la alarma anterior. |
| `atomdev-prod-backup-monitor-absence` | `VerifiedBackupAgeSeconds[15m]{server = "atomdev-prod"}.groupBy(server).absent(72h)`, pendiente 1 minuto. |
| Aviso inmediato de fallo del respaldo | Conserva `OnFailure` y el tema existente. |

Las dos alarmas usan severidad CRITICAL, el tema existente, formato
`ONS_OPTIMIZED` y repetición cada seis horas durante un incidente. El tiempo
de aviso incluye el intervalo de publicación y la latencia/evaluación de OCI.
El monitor rechaza registros sin fecha válida, con fecha futura, con objeto
incoherente o tamaño no positivo. Si no puede leer el registro o publicar,
la ausencia de métricas activa la segunda alarma.

La comprobación periódica usa la constancia local de una verificación previa;
no vuelve a descargar el archivo cada cinco minutos ni constituye un ensayo
de restauración. OCI deja de seguir una ausencia después del periodo `72h` y
su reset interno: un aviso `RESET` no confirma que vuelva la VM ni el respaldo.
Comprobar muestras nuevas y su edad para cerrar un incidente prolongado.

## Archivos y validación

- `scripts/oci-backup-signal.py`: acción `health` y publicación compartida.
- `scripts/test_oci_backup_signal.py`: 12 pruebas; incluye límites de 24/25 horas,
  respaldo vencido, fecha futura, registro corrupto/ausente y publicación fallida.
- `infra/systemd/atomdev-oci-backup-health.service` y `.timer`.
- `infra/oci/atomdev-prod-backup-age-alarm.json` y
  `atomdev-prod-backup-monitor-absence-alarm.json`: parámetros CLI sin secretos.

Pruebas locales:

```bash
python3 -m unittest discover -s scripts -p test_oci_backup_signal.py -v
git diff --check
```

Se verificaron las unidades con `systemd-analyze verify` en la VM antes de
instalarlas. La primera ejecución productiva del monitor terminó correctamente
a las 03:47:58 UTC y publicó una edad de 74874 segundos. El timer quedó habilitado.
Se comprobaron también los ciclos automáticos de las 03:50 y 03:55 UTC,
ambos con `Result=success` y muestras crecientes (75002 y 75307 segundos).
OCI confirmó la recepción de las muestras; ambas alarmas quedaron habilitadas,
sin supresión, en estado `OK` al cierre de la comprobación de las 03:55 UTC.

También se publicaron tres series sintéticas, filtradas por el servidor de prueba
`atomdev-backup-monitor-selftest-20261026`, sin alarmas ni destinatarios:

| Caso | Entrada | Resultado de OCI |
|---|---|---|
| Respaldo vigente | Edad 86400 segundos | No supera el umbral de 25 horas. |
| Respaldo vencido | Edad 90001 segundos | La consulta de edad devuelve `1`. |
| Monitor ausente | Última muestra hace más de 15 minutos | La consulta de ausencia devuelve `1`; las series recientes devuelven `0`. |

No se alteraron las métricas del servidor productivo para estas pruebas ni se
enviaron correos de prueba. Se guardaron las respuestas en
`test-query-age.json` y `test-query-absence.json` en el directorio local de evidencia.
Esto verifica las consultas de OCI; no constituye un nuevo ensayo de entrega de
correo ni una espera real de 25 horas.

La alarma de edad conserva el OCID
`ocid1.alarm.oc1.sa-santiago-1.amaaaaaatg4f2qqadudrgbeenkplk3zxcmdd3znt6d3v7r4ueaih3sicgo7a`.
La alarma de ausencia del monitor tiene el OCID
`ocid1.alarm.oc1.sa-santiago-1.amaaaaaatg4f2qqat6ym5xkk2muf3tupjwfhwax3wn7z6dh5q3c6br34ylmq`.

## Copia previa y rollback

La VM conserva `/home/ubuntu/backups/monitor-fix-20261026T034755Z/`, con
`oci-backup-signal.py.before`, los archivos instalados y `original-alarm.json`.
La configuración y resultados de OCI también se guardaron localmente en
`/private/tmp/atomdev-backup-monitor-20261026/`. No se modifican bases de datos,
contenedores, `.env.deploy` ni el timer diario.

Para revertir el monitor, detener/deshabilitar solamente
`atomdev-oci-backup-health.timer`, esperar a que termine su servicio y restaurar
`oci-backup-signal.py.before` con permisos de lectura para `ubuntu`. Deshabilitar
la alarma de ausencia del monitor antes de detenerlo para no generar un aviso
esperado. Restaurar la definición de la alarma original desde el JSON requiere
convertir las claves de respuesta API a los parámetros de `alarm update`;
el archivo completo de `alarm get` no es entrada directa de `--from-json`.
Reinstalar la consulta original recupera también sus falsos positivos y solo
sirve como rollback temporal. El respaldo diario puede continuar con su script
de señal anterior.
