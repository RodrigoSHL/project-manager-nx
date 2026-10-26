#!/usr/bin/env python3
"""Publish backup health without putting OCI credentials on the VM."""

import argparse
import datetime as dt
import json
import os
import pathlib
import socket


METRIC_NAMESPACE = "atomdev_backup"
METRIC_NAME = "VerifiedBackup"
AGE_METRIC_NAME = "VerifiedBackupAgeSeconds"


def publish_metric(oci, name, value):
    compartment_id = os.environ["ATOMDEV_BACKUP_METRIC_COMPARTMENT_ID"]
    region = os.environ.get("ATOMDEV_OCI_REGION", "sa-santiago-1")
    signer = oci.auth.signers.InstancePrincipalsSecurityTokenSigner()
    client = oci.monitoring.MonitoringClient(
        {},
        signer=signer,
        service_endpoint=f"https://telemetry-ingestion.{region}.oraclecloud.com",
        timeout=(10, 30),
    )
    metric = oci.monitoring.models.MetricDataDetails(
        compartment_id=compartment_id,
        namespace=METRIC_NAMESPACE,
        name=name,
        dimensions={"server": "atomdev-prod"},
        datapoints=[
            oci.monitoring.models.Datapoint(
                timestamp=dt.datetime.now(dt.timezone.utc), value=value, count=1
            )
        ],
    )
    response = client.post_metric_data(
        oci.monitoring.models.PostMetricDataDetails(
            metric_data=[metric], batch_atomicity="ATOMIC"
        )
    )
    if response.data.failed_metrics_count:
        raise RuntimeError(
            f"OCI rechazó {response.data.failed_metrics_count} métricas de respaldo"
        )


def signal_success(oci):
    publish_metric(oci, METRIC_NAME, 1.0)


def backup_age_seconds(path, now=None):
    """Age of the archive recorded only after upload and SHA-256 verification.

    Do not use the marker's mtime or the monitor's execution time as a backup
    timestamp: either would make an old backup appear fresh on every run.
    Invalid/missing markers fail closed; the separate absence alarm detects
    missing health samples even when the backup process or VM cannot run.
    """
    with open(path, encoding="utf-8") as source:
        marker = json.load(source)
    created = dt.datetime.strptime(marker["created_utc"], "%Y%m%dT%H%M%SZ").replace(
        tzinfo=dt.timezone.utc
    )
    expected_object = "daily/{}/atomdev-prod-{}.tar".format(
        created.strftime("%Y-%m-%d"), marker["created_utc"]
    )
    if marker["object"] != expected_object:
        raise ValueError("El objeto no coincide con la fecha del respaldo verificado")
    if type(marker["bytes"]) is not int or marker["bytes"] <= 0:
        raise ValueError("El tamaño del respaldo verificado no es válido")
    now = now if now is not None else dt.datetime.now(dt.timezone.utc)
    age = (now - created).total_seconds()
    if age < 0:
        raise ValueError("La fecha del respaldo verificado está en el futuro")
    return age


def signal_health(oci):
    marker = pathlib.Path(
        os.environ.get("ATOMDEV_BACKUP_BASE", "/home/ubuntu/backups")
    ) / "offsite-last-success.json"
    age = backup_age_seconds(marker)
    publish_metric(oci, AGE_METRIC_NAME, age)
    print("Edad del último respaldo verificado: {:.0f} segundos".format(age))


def signal_failure(oci, unit):
    topic_id = os.environ["ATOMDEV_BACKUP_TOPIC_ID"]
    endpoint = os.environ["ATOMDEV_BACKUP_TOPIC_ENDPOINT"]
    signer = oci.auth.signers.InstancePrincipalsSecurityTokenSigner()
    client = oci.ons.NotificationDataPlaneClient(
        {}, signer=signer, service_endpoint=endpoint
    )
    client.publish_message(
        topic_id,
        oci.ons.models.MessageDetails(
            title="AtomDev: revisar respaldo de producción",
            body=(
                f"La unidad {unit} falló en {socket.gethostname()} a las "
                f"{dt.datetime.now(dt.timezone.utc).isoformat()}. "
                "El respaldo o la publicación de su señal de salud requiere revisión. "
                "Consultar systemctl status y journalctl de la unidad. "
                "No se incluyen datos ni secretos del respaldo en este aviso."
            ),
        ),
    )


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("action", choices=("success", "failure", "health"))
    parser.add_argument("unit", nargs="?", default="atomdev-oci-backup.service")
    args = parser.parse_args()
    import oci

    if args.action == "success":
        signal_success(oci)
    elif args.action == "health":
        signal_health(oci)
    else:
        signal_failure(oci, args.unit)


if __name__ == "__main__":
    main()
