#!/usr/bin/env python3
"""Refresh rolling7/30d CPU from CloudMonitor. No persistent cloud credentials."""
import argparse
import datetime as dt
import json
import math
import os
from pathlib import Path
import statistics
import tempfile
import time
from cloud_cpu_client import CloudError, query_cpu, role_credentials

PERIOD = 3600


def iso(epoch):
    return dt.datetime.fromtimestamp(epoch, dt.timezone(dt.timedelta(hours=8))).isoformat(timespec='seconds')


def aggregate(points, instances, end, period=PERIOD):
    allowed = set(instances)
    series = {key: {} for key in allowed}
    for point in points:
        key = point.get('instanceId')
        if key not in allowed:
            raise CloudError('UNEXPECTED_INSTANCE_IN_RESPONSE')
        value, timestamp = point.get('Average'), point.get('timestamp')
        if value is None or isinstance(value, bool) or timestamp is None:
            continue
        try:
            value, timestamp = float(value), int(timestamp) // 1000
        except (ValueError, TypeError, OverflowError):
            continue
        if not math.isfinite(value) or not 0 <= value <= 100 or not end - 30 * 86400 < timestamp <= end:
            continue
        if timestamp in series[key] and series[key][timestamp] != value:
            raise CloudError('CONFLICTING_DUPLICATE_DATAPOINT')
        series[key][timestamp] = value
    hosts = {}
    for key, by_time in series.items():
        windows = {}
        for label, days in [('7d', 7), ('30d', 30)]:
            start = end - days * 86400
            values = [v for t, v in by_time.items() if start < t <= end]
            expected = days * 86400 // period
            if len(values) > expected:
                raise CloudError('MORE_POINTS_THAN_EXPECTED_PERIOD')
            cpu = None
            if values:
                ordered = sorted(values)
                pos = (len(values) - 1) * .95
                p95 = ordered[math.floor(pos)] + (ordered[math.ceil(pos)] - ordered[math.floor(pos)]) * (pos % 1)
                cpu = {'average': statistics.mean(values), 'p95': p95, 'points': len(values),
                       'expectedPoints': expected, 'coveragePct': round(100 * len(values) / expected, 2),
                       'periodSeconds': period, 'statistic': 'Average'}
            windows[label] = {'start': iso(start), 'end': iso(end), 'cpu': cpu,
                              'cpuStatus': 'available' if len(values) == expected else 'partial' if values else 'unavailable'}
        hosts[key] = {'asOf': iso(end), 'scope': 'aliyun_ecs', 'windows': windows}
    return hosts


def atomic_json(path, data):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile('w', dir=path.parent, encoding='utf8', delete=False) as stream:
        json.dump(data, stream, ensure_ascii=False, indent=2)
        stream.write('\n')
        temporary = stream.name
    os.chmod(temporary, 0o600)
    os.replace(temporary, path)


def collect(config, previous=None, now=None):
    now = int(time.time() if now is None else now)
    # Use completed hourly buckets, allow5min for upstream reporting.
    end = ((now - 300) // PERIOD) * PERIOD
    previous = previous or {}
    try:
        instances = list(config['instances'].values())
        if len(instances) != 4 or len(set(instances)) != 4:
            raise CloudError('CONFIG_MUST_ALLOWLIST_FOUR_INSTANCES')
        credentials = role_credentials(config['role'])
        points, requests = [], []
        # Bound upstream query cost: three non-overlapping10-day ranges.
        for offset in [30, 20, 10]:
            batch, ids = query_cpu(credentials, config['endpoint'], instances,
                                   end - offset * 86400, end - (offset - 10) * 86400, PERIOD)
            points.extend(batch)
            requests.extend(ids)
        by_instance = aggregate(points, instances, end)
        hosts = {name: by_instance[instance] for name, instance in config['instances'].items()}
        if any(not host['windows']['30d']['cpu'] for host in hosts.values()):
            raise CloudError('MISSING_INSTANCE_HISTORY')
        partial = any(w['cpuStatus'] != 'available' for h in hosts.values() for w in h['windows'].values())
        result = {'schema': 1, 'status': 'partial' if partial else 'ok', 'source': 'aliyun-cloudmonitor-api',
                  'api': 'DescribeMetricList', 'namespace': 'acs_ecs_dashboard', 'metric': 'CPUUtilization',
                  'generated_at': iso(now), 'generated_epoch': now, 'last_attempt_at': iso(now),
                  'as_of': iso(end), 'refresh_seconds': 900, 'period_seconds': PERIOD,
                  'request_ids': requests, 'hosts': hosts}
        return result, 0
    except CloudError as error:
        # Keep the last successful data/time, but make failure unmistakable.
        result = dict(previous)
        result.update({'schema': 1, 'status': 'error', 'source': 'aliyun-cloudmonitor-api',
                       'last_attempt_at': iso(now), 'error_code': str(error), 'refresh_seconds': 900})
        result.setdefault('hosts', {})
        return result, 1


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--config', default='/etc/server-assets-cloud-cpu.json')
    parser.add_argument('--output', default='/opt/zy-personal-web-clean/projects/server-assets-cpu.json')
    args = parser.parse_args()
    config = json.loads(Path(args.config).read_text())
    try:
        previous = json.loads(Path(args.output).read_text())
    except (FileNotFoundError, ValueError):
        previous = None
    result, code = collect(config, previous)
    atomic_json(args.output, result)
    print(json.dumps({'status': result['status'], 'as_of': result.get('as_of'),
                      'generated_at': result.get('generated_at'), 'host_count': len(result['hosts']),
                      'error_code': result.get('error_code')}, ensure_ascii=False))
    raise SystemExit(code)


if __name__ == '__main__':
    main()
