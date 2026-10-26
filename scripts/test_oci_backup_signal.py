import importlib.util
import datetime as dt
import json
import os
import pathlib
import tempfile
import unittest
from unittest import mock


SCRIPT = pathlib.Path(__file__).with_name("oci-backup-signal.py")
SPEC = importlib.util.spec_from_file_location("oci_backup_signal", SCRIPT)
SIGNAL = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(SIGNAL)


class BackupSignalTests(unittest.TestCase):
    def setUp(self):
        self.oci = mock.Mock()
        self.oci.monitoring.models.MetricDataDetails.side_effect = lambda **kw: kw
        self.oci.monitoring.models.Datapoint.side_effect = lambda **kw: kw
        self.oci.monitoring.models.PostMetricDataDetails.side_effect = lambda **kw: kw
        self.oci.ons.models.MessageDetails.side_effect = lambda **kw: kw

    @mock.patch.dict("os.environ", {"ATOMDEV_BACKUP_METRIC_COMPARTMENT_ID": "ocid1.compartment.test"})
    def test_success_publishes_verified_metric(self):
        self.oci.monitoring.MonitoringClient.return_value.post_metric_data.return_value.data.failed_metrics_count = 0
        SIGNAL.signal_success(self.oci)
        client = self.oci.monitoring.MonitoringClient.return_value
        post = client.post_metric_data.call_args.args[0]
        metric = post["metric_data"][0]
        self.assertEqual(metric["namespace"], "atomdev_backup")
        self.assertEqual(metric["name"], "VerifiedBackup")
        self.assertEqual(metric["dimensions"], {"server": "atomdev-prod"})
        self.assertEqual(metric["datapoints"][0]["value"], 1.0)
        self.assertEqual(post["batch_atomicity"], "ATOMIC")

    @mock.patch.dict("os.environ", {"ATOMDEV_BACKUP_METRIC_COMPARTMENT_ID": "ocid1.compartment.test"})
    def test_rejected_metric_fails_backup_task(self):
        self.oci.monitoring.MonitoringClient.return_value.post_metric_data.return_value.data.failed_metrics_count = 1
        with self.assertRaises(RuntimeError):
            SIGNAL.signal_success(self.oci)

    @mock.patch.dict(
        "os.environ",
        {
            "ATOMDEV_BACKUP_TOPIC_ID": "ocid1.onstopic.test",
            "ATOMDEV_BACKUP_TOPIC_ENDPOINT": "https://cell.example.invalid",
        },
    )
    def test_failure_sends_nonsecret_message(self):
        SIGNAL.signal_failure(self.oci, "atomdev-oci-backup.service")
        topic, message = self.oci.ons.NotificationDataPlaneClient.return_value.publish_message.call_args.args
        self.assertEqual(topic, "ocid1.onstopic.test")
        self.assertIn("atomdev-oci-backup.service", message["body"])
        self.assertNotIn("ocid1.onstopic.test", message["body"])
        self.assertNotIn("https://cell.example.invalid", message["body"])


class BackupAgeTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.path = pathlib.Path(self.temp.name) / "offsite-last-success.json"
        self.created = dt.datetime(2026, 10, 25, 7, 0, 3, tzinfo=dt.timezone.utc)
        self.marker = {
            "created_utc": "20261025T070003Z",
            "object": "daily/2026-10-25/atomdev-prod-20261025T070003Z.tar",
            "bytes": 164229120,
        }
        self.write_marker()

    def write_marker(self):
        self.path.write_text(json.dumps(self.marker), encoding="utf-8")

    def test_age_uses_verified_backup_timestamp_and_grows_between_checks(self):
        os.utime(self.path, None)
        for seconds in (0, 86400, 90000, 90001, 172800):
            with self.subTest(seconds=seconds):
                now = self.created + dt.timedelta(seconds=seconds)
                self.assertEqual(SIGNAL.backup_age_seconds(self.path, now), seconds)
                self.assertEqual(
                    SIGNAL.backup_age_seconds(self.path, now) > 90000,
                    seconds > 90000,
                )

    def test_missing_marker_fails_closed(self):
        with self.assertRaises(FileNotFoundError):
            SIGNAL.backup_age_seconds(self.path.with_name("missing.json"))

    def test_corrupt_marker_fails_closed(self):
        self.path.write_text("{", encoding="utf-8")
        with self.assertRaises(ValueError):
            SIGNAL.backup_age_seconds(self.path)

    def test_invalid_or_missing_date_fails_closed(self):
        for date in (None, "yesterday", "20261325T070003Z"):
            with self.subTest(date=date):
                self.marker["created_utc"] = date
                self.write_marker()
                with self.assertRaises((TypeError, ValueError)):
                    SIGNAL.backup_age_seconds(self.path)
        del self.marker["created_utc"]
        self.write_marker()
        with self.assertRaises(KeyError):
            SIGNAL.backup_age_seconds(self.path)

    def test_mismatched_object_fails_closed(self):
        self.marker["object"] = "daily/2026-10-24/atomdev-prod-20261024T070003Z.tar"
        self.write_marker()
        with self.assertRaisesRegex(ValueError, "objeto"):
            SIGNAL.backup_age_seconds(self.path)

    def test_invalid_size_fails_closed(self):
        for size in (0, -1, True, "164229120", None):
            with self.subTest(size=size):
                self.marker["bytes"] = size
                self.write_marker()
                with self.assertRaisesRegex(ValueError, "tamaño"):
                    SIGNAL.backup_age_seconds(self.path)

    def test_future_backup_fails_closed(self):
        with self.assertRaisesRegex(ValueError, "futuro"):
            SIGNAL.backup_age_seconds(self.path, self.created - dt.timedelta(seconds=1))

    def test_health_reports_stale_age_instead_of_a_fresh_success(self):
        created = dt.datetime.now(dt.timezone.utc) - dt.timedelta(seconds=90001)
        stamp = created.strftime("%Y%m%dT%H%M%SZ")
        self.marker.update(
            created_utc=stamp,
            object="daily/{}/atomdev-prod-{}.tar".format(created.strftime("%Y-%m-%d"), stamp),
        )
        self.write_marker()
        oci = mock.Mock()
        oci.monitoring.models.MetricDataDetails.side_effect = lambda **kw: kw
        oci.monitoring.models.Datapoint.side_effect = lambda **kw: kw
        oci.monitoring.models.PostMetricDataDetails.side_effect = lambda **kw: kw
        client = oci.monitoring.MonitoringClient.return_value
        client.post_metric_data.return_value.data.failed_metrics_count = 0
        with mock.patch.dict(os.environ, {
            "ATOMDEV_BACKUP_BASE": self.temp.name,
            "ATOMDEV_BACKUP_METRIC_COMPARTMENT_ID": "ocid1.compartment.test",
        }):
            SIGNAL.signal_health(oci)
        metric = client.post_metric_data.call_args.args[0]["metric_data"][0]
        self.assertEqual(metric["name"], "VerifiedBackupAgeSeconds")
        self.assertEqual(metric["dimensions"], {"server": "atomdev-prod"})
        self.assertGreater(metric["datapoints"][0]["value"], 90000)

    def test_invalid_marker_never_publishes_health(self):
        self.path.write_text("{}", encoding="utf-8")
        oci = mock.Mock()
        with mock.patch.dict(os.environ, {"ATOMDEV_BACKUP_BASE": self.temp.name}):
            with self.assertRaises(KeyError):
                SIGNAL.signal_health(oci)
        oci.monitoring.MonitoringClient.assert_not_called()


if __name__ == "__main__":
    unittest.main()
