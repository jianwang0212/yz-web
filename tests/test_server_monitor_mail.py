import copy
import importlib
import io
import json
import os
from pathlib import Path
import sys
import tempfile
import unittest
from datetime import datetime, timedelta
from unittest.mock import patch

SOURCE = Path(__file__).resolve().parents[1] / 'scripts/server_monitor_mail'
sys.path.insert(0, str(SOURCE))
from model import BJ, IDS, RUNTIME, build, validate, metric, memory_value, collect
from render import render, subject, plain
from delivery import send

NOW = datetime(2026, 11, 18, 7, 10, tzinfo=BJ)


def fixture():
    assets = {'rows': [{'id': key, 'name': key} for key in IDS] + [{'id': 'futu-risk', 'name': 'excluded'}]}
    runtime = {'generated_at': NOW.isoformat(), 'hosts': [{'id': RUNTIME[key], 'ok': True, 'data': {'collected_at': NOW.isoformat(), 'memory': 'Mem: 100Gi 0B 0B 0B 0B 50Gi', 'disk_root': '/dev/test 10G 5G 5G 35% /'}} for key in IDS]}
    cpu = {'source': 'aliyun-cloudmonitor-api', 'status': 'ok', 'generated_at': NOW.isoformat(), 'hosts': {key: {'asOf': NOW.replace(minute=0).isoformat(), 'windows': {k: {'cpu': {'average': 2}, 'cpuStatus': 'available'} for k in ['7d', '30d']}} for key in IDS[:4]}}
    return assets, cpu, runtime


class SMTP:
    calls = []
    fail = False
    login_fail = False

    def __init__(self, *args, **kwargs):
        pass

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False

    def login(self, *args):
        if self.login_fail:
            raise RuntimeError('simulated login failure')

    def send_message(self, message):
        self.calls.append(message)
        if self.fail:
            raise RuntimeError('simulated uncertain SMTP result')
        return {}


class MonitorMail(unittest.TestCase):
    def setUp(self):
        SMTP.calls = []
        SMTP.fail = SMTP.login_fail = False

    def report(self):
        return build(*fixture(), now=NOW)

    def test_five_only_and_success(self):
        report = self.report()
        self.assertEqual(report['summary'], {'critical': 0, 'warning': 0, 'unknown': 0, 'collected': 5, 'total': 5})
        self.assertEqual([r['id'] for r in report['rows']], list(IDS))
        self.assertEqual(report['rows'][-1]['cpu']['7d']['status'], 'not_monitored')
        validate(report)

    def test_boundaries_zero_null_invalid(self):
        for kind, warn, red in [('cpu', 60, 80), ('memory', 75, 85), ('disk', 80, 90)]:
            for value, expected in [(0, 'ok'), (warn-.1, 'ok'), (warn, 'warning'), (red-.1, 'warning'), (red, 'critical'), (100, 'critical'), (None, 'unknown'), (True, 'unknown'), (float('nan'), 'unknown'), (-1, 'unknown'), (101, 'unknown')]:
                self.assertEqual(metric(value, kind)['status'], expected)

    def test_memory_uses_available_and_rounding(self):
        self.assertEqual(memory_value('Mem: 100Gi 1Gi 0B 0B 0B 13Gi'), 87)
        self.assertEqual(memory_value('Mem: 100Gi 1Gi 0B 0B 0B 100Gi'), 0)
        self.assertIsNone(memory_value('Mem: 1Gi 0B 0B 0B 0B 2Gi'))
        self.assertIsNone(memory_value('not a sample'))

    def test_high_counts_hosts_not_metric_count(self):
        a, c, r = fixture()
        r['hosts'][0]['data'].update(memory='Mem: 100Gi 0B 0B 0B 0B 13Gi', disk_root='/dev/test 10G 5G 5G 94% /')
        c['hosts'][IDS[0]]['windows']['7d']['cpu']['average'] = 88
        report = build(a, c, r, NOW)
        self.assertEqual(report['summary']['critical'], 1)
        self.assertIn('红 1', subject(report))
        self.assertIn('#d93025', render(report))
        self.assertIn('过高', render(report))

    def test_stale_not_green_or_false_zero(self):
        a, c, r = fixture()
        c['status'] = 'error'
        r['hosts'][0]['data']['collected_at'] = (NOW-timedelta(minutes=5)).isoformat()
        report = build(a, c, r, NOW)
        self.assertEqual(report['summary']['unknown'], 4)
        self.assertEqual(report['summary']['collected'], 4)
        self.assertEqual(report['rows'][0]['memory']['value'], 50)
        self.assertEqual(report['rows'][0]['memory']['status'], 'unknown')
        self.assertIn('历史读数', render(report))

    def test_missing_inputs_clear_failure(self):
        report = build({}, {}, {}, NOW)
        validate(report)
        self.assertEqual(report['summary']['unknown'], 5)
        self.assertEqual(report['summary']['collected'], 0)
        self.assertIn('数据获取失败', subject(report))
        self.assertNotIn('CPU7d 0%', plain(report))

    def test_partial_flags_data_quality(self):
        a, c, r = fixture()
        c['hosts'][IDS[0]]['windows']['7d']['cpuStatus'] = 'partial'
        report = build(a, c, r, NOW)
        self.assertEqual(report['summary']['unknown'], 1)
        self.assertIn('部分采样', render(report))

    def test_html_escaped_and_no_scripts(self):
        a, c, r = fixture()
        a['rows'][0]['name'] = '<script>alert(1)</script>'
        text = render(build(a, c, r, NOW))
        self.assertNotIn('<script>', text)
        self.assertIn('&lt;script&gt;', text)
        self.assertIn('max-width:640px', text)
        self.assertIn('https://thisisyz.com/projects/server-assets', text)

    def test_validation_rejects_mismatched_counts_and_host(self):
        report = self.report()
        report['summary']['critical'] = 1
        self.assertRaises(ValueError, validate, report)
        report = self.report()
        report['rows'][0]['id'] = 'not-allowed'
        self.assertRaises(ValueError, validate, report)

    def test_delivery_once_and_fixed_self_recipient(self):
        with tempfile.TemporaryDirectory() as state:
            report = self.report()
            config = {'SMTP_USER': 'me@example.test', 'SMTP_PASS': 'fixture-not-a-secret', 'ALERT_EMAIL': 'ignored@example.test'}
            result = send(report, state, config, SMTP, NOW)
            self.assertEqual(result['status'], 'sent')
            self.assertEqual(send(report, state, config, SMTP, NOW)['status'], 'already_sent')
            self.assertEqual(len(SMTP.calls), 1)
            self.assertEqual(SMTP.calls[0]['To'], 'me@example.test')
            self.assertEqual(SMTP.calls[0]['Message-ID'], '<server-monitor-daily-2026-11-18@thisisyz.com>')
            p = Path(state) / '2026-11-18-daily.json'
            self.assertEqual(p.stat().st_mode & 0o777, 0o600)
            self.assertNotIn('fixture-not-a-secret', p.read_text())

    def test_uncertain_never_blind_retry(self):
        with tempfile.TemporaryDirectory() as state:
            SMTP.fail = True
            report = self.report()
            config = {'SMTP_USER': 'me@example.test', 'SMTP_PASS': 'fixture'}
            self.assertRaises(RuntimeError, send, report, state, config, SMTP, NOW)
            self.assertRaises(RuntimeError, send, report, state, config, SMTP, NOW)
            self.assertEqual(len(SMTP.calls), 1)
            self.assertEqual(json.loads((Path(state)/'2026-11-18-daily.json').read_text())['status'], 'uncertain')

    def test_login_failure_safe_retry(self):
        with tempfile.TemporaryDirectory() as state:
            SMTP.login_fail = True
            report = self.report()
            config = {'SMTP_USER': 'me@example.test', 'SMTP_PASS': 'fixture'}
            self.assertRaises(RuntimeError, send, report, state, config, SMTP, NOW)
            self.assertFalse((Path(state)/'2026-11-18-daily.json').exists())
            SMTP.login_fail = False
            self.assertEqual(send(report, state, config, SMTP, NOW)['status'], 'sent')

    def test_rejects_wrong_date_stale_generation(self):
        with tempfile.TemporaryDirectory() as state:
            self.assertRaises(ValueError, send, self.report(), state, {}, SMTP, NOW+timedelta(days=1))
            self.assertRaises(ValueError, send, self.report(), state, {}, SMTP, NOW+timedelta(minutes=11))
            self.assertEqual(SMTP.calls, [])

    def test_preview_does_not_send(self):
        with patch('smtplib.SMTP_SSL', side_effect=AssertionError('preview must not send')):
            report = self.report()
            self.assertIn('服务器', subject(report))
            self.assertIn('服务器', render(report))
            self.assertIn('服务器', plain(report))

    def test_runner_status_uses_receipt_without_source_or_credentials(self):
        from run_report import main
        with tempfile.TemporaryDirectory() as state:
            day = datetime.now(BJ).date().isoformat()
            result = {'status': 'sent', 'reportDate': day, 'messageId': 'fixture', 'acceptedAt': NOW.isoformat()}
            (Path(state)/(day+'-daily.json')).write_text(json.dumps(result))
            with patch.object(sys, 'argv', ['run_report.py', '--status', '--state-dir', state]), patch('sys.stdout', new=io.StringIO()):
                self.assertEqual(main(), 0)


if __name__ == '__main__':
    unittest.main()
