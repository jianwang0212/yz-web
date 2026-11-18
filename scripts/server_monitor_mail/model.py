"""Five confirmed hosts only; same resource thresholds as the private asset page."""
import json
import math
import re
from datetime import datetime, timezone, timedelta
from pathlib import Path

BJ = timezone(timedelta(hours=8), 'Asia/Shanghai')
IDS = ('thisisyz', 'a47g', 'japan', 'futu-algo', 'contabo-crypto')
RUNTIME = dict(zip(IDS, ('thisisyz', 'a47g', 'japan-clickhouse-grafana', 'futu-algo-sell-put', 'contabo-crypto')))
THRESHOLDS = {'cpu': (60, 80), 'memory': (75, 85), 'disk': (80, 90)}


def numeric(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value) and 0 <= value <= 100


def stamp(value):
    try:
        result = datetime.fromisoformat(str(value).replace('Z', '+00:00'))
        return result if result.tzinfo else None
    except (TypeError, ValueError):
        return None


def fresh(value, now, seconds):
    date = stamp(value)
    return bool(date and -60 <= (now - date).total_seconds() <= seconds)


def metric(value, kind, valid=True, at=None, partial=False, expected=True):
    status = 'unknown'
    if numeric(value) and valid:
        low, high = THRESHOLDS[kind]
        status = 'critical' if value >= high else 'warning' if value >= low else 'ok'
    date = stamp(at)
    return {'value': value if numeric(value) else None, 'status': status if expected else 'not_monitored',
            'at': date.astimezone(BJ).isoformat(timespec='seconds') if date else None, 'partial': bool(partial)}


def memory_value(text):
    def size(value):
        match = re.fullmatch(r'([\d.]+)([KMGTPE]?)(?:i?B?)?', value, re.I)
        return float(match[1]) * 1024 ** ' KMGTPE'.index(match[2].upper()) if match else None
    try:
        parts = str(text).split()
        total, available = size(parts[1]), size(parts[6])
        return math.floor(100 * (1 - available / total) + .5) if total and available is not None and 0 <= available <= total else None
    except (ValueError, IndexError, ZeroDivisionError):
        return None


def read_json(path):
    try:
        return json.loads(Path(path).read_text())
    except (OSError, ValueError):
        return {}


def build(assets, cpu, runtime, now=None):
    now = now or datetime.now(BJ)
    if now.tzinfo is None:
        raise ValueError('Timezone required')
    by_id = {row.get('id'): row for row in assets.get('rows', [])}
    live_hosts = runtime.get('hosts', [])
    live = {host.get('id'): host for host in live_hosts if isinstance(host, dict)} if isinstance(live_hosts, list) else {}
    rows = []
    for key in IDS:
        name = str(by_id.get(key, {}).get('name') or key)[:80]
        host = live.get(RUNTIME[key], {})
        data = host.get('data', {}) if isinstance(host.get('data', {}), dict) else {}
        at = data.get('collected_at')
        collected = bool(host.get('ok') and fresh(at, now, 180) and fresh(runtime.get('generated_at'), now, 180))
        disk = re.search(r'\s(\d{1,3})%\s', str(data.get('disk_root', '')))
        history = cpu.get('hosts', {}).get(key, {}) if isinstance(cpu.get('hosts'), dict) else {}
        cpu_valid = (cpu.get('source') == 'aliyun-cloudmonitor-api' and cpu.get('status') in ('ok', 'partial')
                     and fresh(cpu.get('generated_at'), now, 2700) and fresh(history.get('asOf'), now, 7200))
        windows = {}
        for period in ['7d', '30d']:
            window = history.get('windows', {}).get(period, {})
            value = (window.get('cpu') or {}).get('average')
            windows[period] = metric(value, 'cpu', cpu_valid, history.get('asOf'),
                                     window.get('cpuStatus') == 'partial', key != 'contabo-crypto')
        rows.append({'id': key, 'name': name, 'collected': collected,
                     'memory': metric(memory_value(data.get('memory')), 'memory', collected, at),
                     'disk': metric(int(disk[1]) if disk else None, 'disk', collected, at), 'cpu': windows})
    counts = {'critical': 0, 'warning': 0, 'unknown': 0, 'collected': sum(r['collected'] for r in rows), 'total': len(rows)}
    for row in rows:
        values = [row['memory'], row['disk'], *row['cpu'].values()]
        states = {m['status'] for m in values}
        if 'critical' in states:
            counts['critical'] += 1
        elif 'warning' in states:
            counts['warning'] += 1
        if 'unknown' in states or any(m['partial'] for m in values):
            counts['unknown'] += 1
    return {'schema': 1, 'type': 'server-monitor', 'reportDate': now.astimezone(BJ).date().isoformat(),
            'generatedAt': now.astimezone(BJ).isoformat(timespec='seconds'), 'rows': rows, 'summary': counts}


def collect(root, now=None):
    root = Path(root)
    try:
        match = re.search(r'<script type="application/json" id="asset-data">([\s\S]*?)</script>', (root / 'server-assets.html').read_text())
        assets = json.loads(match[1]) if match else {}
    except (OSError, ValueError):
        assets = {}
    return build(assets, read_json(root / 'server-assets-cpu.json'), read_json(root / 'server-monitor-data.json'), now)


def validate(report):
    date = stamp(report.get('generatedAt'))
    if report.get('schema') != 1 or report.get('type') != 'server-monitor' or not date or date.astimezone(BJ).date().isoformat() != report.get('reportDate'):
        raise ValueError('Invalid report identity/date')
    if tuple(row.get('id') for row in report.get('rows', [])) != IDS:
        raise ValueError('Unexpected hosts')
    counts = {'critical': 0, 'warning': 0, 'unknown': 0, 'collected': 0, 'total': 5}
    for row in report['rows']:
        if not isinstance(row.get('name'), str) or not 0 < len(row['name']) <= 80 or type(row.get('collected')) is not bool:
            raise ValueError('Invalid host')
        values = [('memory', row['memory']), ('disk', row['disk']), *[('cpu', row['cpu'][k]) for k in ['7d', '30d']]]
        for kind, value in values:
            if value['value'] is not None and not numeric(value['value']):
                raise ValueError('Invalid percentage')
            if value['status'] not in ['ok', 'warning', 'critical', 'unknown', 'not_monitored'] or type(value['partial']) is not bool:
                raise ValueError('Invalid status')
            if value['status'] in ['ok', 'warning', 'critical'] and metric(value['value'], kind)['status'] != value['status']:
                raise ValueError('Incorrect threshold')
            if value['status'] in ['ok', 'warning', 'critical'] and (not fresh(value.get('at'), date, 7200 if kind == 'cpu' else 180) or (kind != 'cpu' and not row['collected'])):
                raise ValueError('Stale data cannot have a current severity')
            if value['status'] == 'not_monitored' and (kind != 'cpu' or row['id'] != 'contabo-crypto'):
                raise ValueError('Unexpected unmonitored metric')
        states = {v['status'] for _, v in values}
        counts['critical'] += int('critical' in states)
        counts['warning'] += int('critical' not in states and 'warning' in states)
        counts['unknown'] += int('unknown' in states or any(v['partial'] for _, v in values))
        counts['collected'] += int(row['collected'])
    if report['summary'] != counts:
        raise ValueError('Summary mismatch')
    return report
