#!/usr/bin/env python3
"""Publish backup health without putting OCI credentials on the VM."""

import argparse
import datetime as dt
import os
import socket


METRIC_NAMESPACE = "atomdev_backup"
METRIC_NAME = "VerifiedBackup"


def signal_success(oci):
    compartment_id = os.environ["ATOMDEV_BACKUP_METRIC_COMPARTMENT_ID"]
    region = os.environ.get("ATOMDEV_OCI_REGION", "sa-santiago-1")
    signer = oci.auth.signers.InstancePrincipalsSecurityTokenSigner()
    client = oci.monitoring.MonitoringClient(
        {},
        signer=signer,
        service_endpoint=f"https://telemetry-ingestion.{region}.oraclecloud.com",
    )
    metric = oci.monitoring.models.MetricDataDetails(
        compartment_id=compartment_id,
        namespace=METRIC_NAMESPACE,
        name=METRIC_NAME,
        dimensions={"server": "atomdev-prod"},
        datapoints=[
            oci.monitoring.models.Datapoint(
                timestamp=dt.datetime.now(dt.timezone.utc), value=1.0, count=1
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
    parser.add_argument("action", choices=("success", "failure"))
    parser.add_argument("unit", nargs="?", default="atomdev-oci-backup.service")
    args = parser.parse_args()
    import oci

    if args.action == "success":
        signal_success(oci)
    else:
        signal_failure(oci, args.unit)


if __name__ == "__main__":
    main()
