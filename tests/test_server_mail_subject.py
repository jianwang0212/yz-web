import sys
from pathlib import Path
import unittest
sys.path.insert(0,str(Path(__file__).resolve().parent))
from test_server_monitor_mail import fixture,NOW
from model import build
from render import subject

class AlertSubject(unittest.TestCase):
    def test_exact_user_example(self):
        a,c,r=fixture();r['hosts'][3]['data']['memory']='Mem: 100Gi 0B 0B 0B 0B 12Gi'
        self.assertEqual(subject(build(a,c,r,NOW)),'服务器 日监控 · Futu 内存过高')
    def test_warning_message_not_counts(self):
        a,c,r=fixture();r['hosts'][3]['data']['memory']='Mem: 100Gi 0B 0B 0B 0B 20Gi'
        self.assertEqual(subject(build(a,c,r,NOW)),'服务器 日监控 · Futu 内存偏高')
    def test_critical_first_and_cpu_period_deduped(self):
        a,c,r=fixture();c['hosts']['a47g']['windows']['7d']['cpu']['average']=88;c['hosts']['a47g']['windows']['30d']['cpu']['average']=90;r['hosts'][0]['data']['disk_root']='/dev/test 10G 5G 5G 80% /'
        s=subject(build(a,c,r,NOW));self.assertEqual(s.count('A47g CPU均值过高'),1);self.assertLess(s.index('A47g'),s.index('ThisisYZ'));self.assertNotIn('红 ',s);self.assertNotIn('采集 5/5',s)
    def test_normal_is_resource_scoped(self):
        self.assertEqual(subject(build(*fixture(),NOW)),'服务器 日监控 · 资源指标正常')
    def test_stale_or_missing_never_normal(self):
        a,c,r=fixture();r['hosts'][3]['ok']=False;s=subject(build(a,c,r,NOW));self.assertIn('Futu 采集异常',s);self.assertNotIn('正常',s)
    def test_cpu_partial_explicit(self):
        a,c,r=fixture();c['hosts']['japan']['windows']['7d']['cpuStatus']='partial';self.assertIn('GT CPU数据不完整',subject(build(a,c,r,NOW)))
    def test_all_missing_preserves_failure_title(self):
        self.assertEqual(subject(build({}, {}, {}, NOW)),'服务器 日监控 · 数据获取失败')
    def test_many_alerts_bounded(self):
        a,c,r=fixture()
        for h in r['hosts']:h['data']['memory']='Mem: 100Gi 0B 0B 0B 0B 5Gi';h['data']['disk_root']='/dev/test 10G 5G 5G 95% /'
        s=subject(build(a,c,r,NOW));self.assertLessEqual(len(s),140);self.assertIn('等报警',s)

if __name__=='__main__':unittest.main()
