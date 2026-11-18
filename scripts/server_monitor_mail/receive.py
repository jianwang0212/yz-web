#!/usr/bin/env python3
"""Forced SSH command accepts one bounded structured server report, never raw HTML."""
import json
import os
import sys
from delivery import send


def main():
    raw = sys.stdin.buffer.read(65537)
    if not 0 < len(raw) <= 65536:
        raise ValueError('Invalid report size')
    report = json.loads(raw)
    # Destination, MIME content and subject cannot be supplied by a caller.
    if set(report) != {'schema', 'type', 'reportDate', 'generatedAt', 'rows', 'summary'}:
        raise ValueError('Unexpected report fields')
    print(json.dumps(send(report, '/root/server-monitor-daily-mail/receipts', os.environ), ensure_ascii=False))


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        print(json.dumps({'status': 'error', 'errorType': type(error).__name__}), file=sys.stderr)
        sys.exit(1)
