import importlib.util
import pathlib
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


if __name__ == "__main__":
    unittest.main()
