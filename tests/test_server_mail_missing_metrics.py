"""Synthetic regressions for missing resource data in both email bodies."""
import unittest
from html import escape
from test_server_monitor_mail import fixture, NOW
from model import build, validate
from render import issues, plain, render, subject


class MissingMetrics(unittest.TestCase):
    def test_missing_and_unparseable_resources_never_all_clear(self):
        for host_index in (0, 4):
            for field, metric, label in [('memory', 'memory', '内存'),
                                          ('disk_root', 'disk', '根盘')]:
                for sample in ('absent', None, '', 'not a sample'):
                    with self.subTest(host=host_index, field=field, sample=sample):
                        a, c, r = fixture()
                        data = r['hosts'][host_index]['data']
                        if sample == 'absent':
                            del data[field]
                        else:
                            data[field] = sample
                        report = validate(build(a, c, r, NOW))
                        row = report['rows'][host_index]
                        self.assertTrue(row['collected'])
                        self.assertEqual(row[metric]['status'], 'unknown')
                        self.assertEqual(report['summary']['unknown'], 1)
                        message = row['name'] + '：' + label + '采样缺失或无法解析'
                        self.assertIn(message, issues(report)[1])
                        self.assertIn(label + '采样缺失', subject(report))
                        for body in (render(report), plain(report)):
                            self.assertIn(message, body)
                            self.assertNotIn('已采集指标均在当前阈值内', body)

    def test_missing_both_resources_preserves_other_alerts_and_escaping(self):
        a, c, r = fixture()
        a['rows'][0]['name'] = '<host & test>'
        r['hosts'][0]['data'].update(memory='', disk_root='invalid')
        c['hosts']['thisisyz']['windows']['7d']['cpu']['average'] = 88
        report = build(a, c, r, NOW)
        alerts, missing = issues(report)
        self.assertEqual(len(alerts), 1)
        self.assertEqual(len(missing), 2)
        self.assertIn('CPU近7天均值', alerts[0][1])
        self.assertEqual(report['summary']['unknown'], 1)
        for message in missing:
            self.assertIn(escape(message), render(report))
            self.assertIn(message, plain(report))
        self.assertNotIn('<host & test>', render(report))

    def test_failed_collection_uses_single_collection_notice(self):
        a, c, r = fixture()
        r['hosts'][0]['ok'] = False
        r['hosts'][0]['data'].update(memory='', disk_root='')
        report = build(a, c, r, NOW)
        self.assertEqual(issues(report)[1], ['thisisyz：当前采集不可用或过期，不代表宕机'])
        for body in (render(report), plain(report)):
            self.assertNotIn('已采集指标均在当前阈值内', body)

    def test_valid_zero_resources_and_unmonitored_cpu_still_all_clear(self):
        a, c, r = fixture()
        for host in r['hosts']:
            host['data'].update(memory='Mem: 100Gi 0B 0B 0B 0B 100Gi',
                                disk_root='/dev/test 10G 0G 10G 0% /')
        report = build(a, c, r, NOW)
        self.assertEqual(report['summary']['unknown'], 0)
        self.assertEqual(issues(report), ([], []))
        for body in (render(report), plain(report)):
            self.assertIn('已采集指标均在当前阈值内', body)


if __name__ == '__main__':
    unittest.main()
