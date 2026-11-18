#!/usr/bin/env python3
"""Website-host runner; native timer and Codex fallback share one daily receipt."""
import argparse
import fcntl
import json
import os
import subprocess
from datetime import datetime
from pathlib import Path
from model import BJ, collect, validate
from delivery import atomic
from render import subject, render, plain


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--send', action='store_true')
    p.add_argument('--status', action='store_true')
    p.add_argument('--preview-dir', type=Path)
    p.add_argument('--config', type=Path, default=Path('/etc/server-monitor-daily-mail.json'))
    p.add_argument('--state-dir', type=Path, default=Path('/var/lib/server-monitor-daily-mail'))
    a = p.parse_args()
    day = datetime.now(BJ).date().isoformat()
    a.state_dir.mkdir(parents=True, exist_ok=True, mode=0o700)
    receipt = a.state_dir / (day + '-daily.json')
    with (a.state_dir / 'run.lock').open('a') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        if a.status:
            result = json.loads(receipt.read_text()) if receipt.exists() else {'status': 'not_delivered', 'reportDate': day}
            print(json.dumps(result, ensure_ascii=False))
            return 0 if result.get('status') == 'sent' else 1
        if a.send and receipt.exists():
            result = json.loads(receipt.read_text())
            if result.get('status') != 'sent' or not result.get('messageId') or not result.get('acceptedAt'):
                raise RuntimeError('Invalid receipt; reconcile Gmail, never blindly resend')
            print(json.dumps(dict(result, status='already_sent'), ensure_ascii=False))
            return 0
        config = json.loads(a.config.read_text())
        report = collect(config['source_root'])
        validate(report)
        if a.preview_dir:
            a.preview_dir.mkdir(parents=True, exist_ok=True, mode=0o700)
            atomic(a.preview_dir / 'report.json', report)
            (a.preview_dir / 'email.html').write_text(render(report))
            (a.preview_dir / 'email.txt').write_text(plain(report))
        if not a.send:
            print(json.dumps({'status': 'preview', 'reportDate': day, 'subject': subject(report), 'summary': report['summary']}, ensure_ascii=False))
            return 0
        credential = Path(os.environ['CREDENTIALS_DIRECTORY']) / 'mail-key'
        cmd = ['ssh', '-F', '/dev/null', '-o', 'BatchMode=yes', '-o', 'IdentitiesOnly=yes', '-o', 'IdentityAgent=none',
               '-o', 'StrictHostKeyChecking=yes', '-o', 'UserKnownHostsFile=' + config['known_hosts'],
               '-o', 'ConnectTimeout=15', '-i', str(credential), config['relay_host'], 'server-monitor-daily-report']
        wire = json.dumps(report, ensure_ascii=False, allow_nan=False)
        if len(wire.encode()) > 65536:
            raise ValueError('Report exceeds relay limit')
        r = subprocess.run(cmd, input=wire, capture_output=True, text=True, timeout=90)
        if r.returncode:
            raise RuntimeError('Mail relay failed (exit ' + str(r.returncode) + '); reconcile remote receipt before retrying')
        result = json.loads(r.stdout)
        if result.get('status') not in ('sent', 'already_sent') or result.get('reportDate') != day or result.get('recipient') != config['recipient'] or not result.get('messageId') or not result.get('acceptedAt'):
            raise RuntimeError('Invalid relay acknowledgment')
        atomic(receipt, dict(result, status='sent'))
        print(json.dumps(result, ensure_ascii=False))
        return 0


if __name__ == '__main__':
    try:
        raise SystemExit(main())
    except Exception as error:
        print(json.dumps({'status': 'error', 'errorType': type(error).__name__, 'message': str(error)}))
        raise SystemExit(1)
