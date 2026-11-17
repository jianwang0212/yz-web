import datetime as dt
import hashlib
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
import cloud_cpu_client as client
import cloud_cpu_collect as collector


class CpuTests(unittest.TestCase):
    def setUp(self):
        self.end = 1800000000 // 3600 * 3600
        self.ids = ['synthetic-' + str(i) for i in range(4)]
        self.config = {'role': 'SyntheticRole', 'endpoint': 'metrics.cn-hangzhou.aliyuncs.com',
                       'instances': dict(zip(['a', 'b', 'c', 'd'], self.ids))}
        self.points = [{'instanceId': key, 'timestamp': (self.end - (720 - i) * 3600) * 1000,
                        'Average': 30 if i > 552 else 10}
                       for key in self.ids for i in range(1, 721)]

    def test_official_v3_signature_fixture(self):
        _, headers = client.sign_v3('ecs.cn-shanghai.aliyuncs.com', 'RunInstances',
            {'ImageId': 'win2019_1809_x64_dtc_zh-cn_40G_alibase_20230811.vhd', 'RegionId': 'cn-shanghai'},
            {'AccessKeyId': 'YourAccessKeyId', 'AccessKeySecret': 'YourAccessKeySecret'},
            version='2014-05-26', now=dt.datetime(2023, 10, 26, 10, 22, 32, tzinfo=dt.timezone.utc),
            nonce='3156853299f313e23d1673dc12e1703d')
        self.assertTrue(headers['Authorization'].endswith(
            '06563a9e1b43f5dfe96b81484da74bceab24a1d853912eee15083a6f0f3283c0'))

    def test_temporary_token_is_signed_header_not_url(self):
        url, headers = client.sign_v3('metrics.cn-hangzhou.aliyuncs.com', 'DescribeMetricList',
            {'MetricName': 'CPUUtilization'},
            {'AccessKeyId': 'demo-id', 'AccessKeySecret': 'demo-secret', 'SecurityToken': 'demo-token'})
        self.assertNotIn('demo-token', url)
        self.assertNotIn('demo-secret', url)
        self.assertIn('x-acs-security-token', headers['Authorization'])
        self.assertEqual(headers['x-acs-content-sha256'], hashlib.sha256(b'').hexdigest())

    def test_full_rolling_windows_and_exact_counts(self):
        data = collector.aggregate(self.points, self.ids, self.end)
        for host in data.values():
            self.assertEqual(host['windows']['7d']['cpu']['points'], 168)
            self.assertEqual(host['windows']['30d']['cpu']['points'], 720)
            self.assertEqual(host['windows']['7d']['cpu']['average'], 30)
            self.assertAlmostEqual(host['windows']['30d']['cpu']['average'], 14.666666666666666)
            self.assertEqual(host['windows']['30d']['cpu']['coveragePct'], 100)

    def test_zero_is_data_but_null_is_not(self):
        points = [{'instanceId': self.ids[0], 'timestamp': self.end * 1000, 'Average': 0},
                  {'instanceId': self.ids[0], 'timestamp': (self.end - 3600) * 1000, 'Average': None}]
        row = collector.aggregate(points, self.ids, self.end)[self.ids[0]]
        self.assertEqual(row['windows']['7d']['cpu']['average'], 0)
        self.assertEqual(row['windows']['7d']['cpu']['points'], 1)
        self.assertEqual(row['windows']['7d']['cpuStatus'], 'partial')

    def test_duplicates_deduped_and_conflicts_rejected(self):
        data = collector.aggregate(self.points + self.points[:3], self.ids, self.end)
        self.assertEqual(data[self.ids[0]]['windows']['30d']['cpu']['points'], 720)
        bad = dict(self.points[0], Average=99)
        with self.assertRaisesRegex(client.CloudError, 'CONFLICTING_DUPLICATE'):
            collector.aggregate(self.points + [bad], self.ids, self.end)

    def test_unapproved_instance_rejected(self):
        with self.assertRaisesRegex(client.CloudError, 'UNEXPECTED_INSTANCE'):
            collector.aggregate([{'instanceId': 'not-allowed'}], self.ids, self.end)

    def test_all_pages_queried(self):
        credentials = {'AccessKeyId': 'demo', 'AccessKeySecret': 'not-real', 'SecurityToken': 'test'}
        responses = [{'Success': True, 'Code': '200', 'Period': '3600',
                      'Datapoints': json.dumps(self.points[:2]), 'NextToken': 'page2'},
                     {'Success': True, 'Code': '200', 'Period': '3600',
                      'Datapoints': json.dumps(self.points[2:5])}]
        with patch.object(client, 'read_json', side_effect=responses) as mocked:
            points, _ = client.query_cpu(credentials, self.config['endpoint'], self.ids, self.end - 86400, self.end)
        self.assertEqual(len(points), 5)
        self.assertEqual(mocked.call_count, 2)
        self.assertIn('NextToken=page2', mocked.call_args_list[1].args[0])

    def test_failure_preserves_success_time_and_never_outputs_credentials(self):
        previous = {'status': 'ok', 'generated_epoch': 123, 'generated_at': 'old-time', 'hosts': {'a': {}}}
        with patch.object(collector, 'role_credentials', side_effect=client.CloudError('AccessDenied')):
            result, code = collector.collect(self.config, previous, self.end + 600)
        self.assertEqual(code, 1)
        self.assertEqual(result['status'], 'error')
        self.assertEqual(result['generated_epoch'], 123)
        self.assertEqual(result['hosts'], previous['hosts'])
        self.assertNotIn('AccessKeySecret', json.dumps(result))

    def test_success_is_four_hosts_with_complete_hour_end(self):
        with patch.object(collector, 'role_credentials', return_value={'AccessKeySecret': 'not-real'}), \
             patch.object(collector, 'query_cpu', return_value=(self.points, ['request-synthetic'])) as queried:
            result, code = collector.collect(self.config, None, self.end + 600)
        self.assertEqual(code, 0)
        self.assertEqual(queried.call_count, 3)
        for call in queried.call_args_list:
            self.assertEqual(call.args[4] - call.args[3], 10 * 86400)
        self.assertEqual(result['status'], 'ok')
        self.assertEqual(len(result['hosts']), 4)
        self.assertNotIn('not-real', json.dumps(result))
        self.assertEqual(result['as_of'], collector.iso(self.end))

    def test_cache_atomic_and_private(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'cache.json'
            collector.atomic_json(path, {'status': 'ok'})
            self.assertEqual(path.stat().st_mode & 0o777, 0o600)
            self.assertEqual(json.loads(path.read_text()), {'status': 'ok'})


if __name__ == '__main__':
    unittest.main()
