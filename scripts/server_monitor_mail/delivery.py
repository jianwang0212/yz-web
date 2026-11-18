"""Fixed self-recipient SMTP with durable daily dedupe and uncertain-send guard."""
import fcntl
import hashlib
import json
import os
import smtplib
import ssl
import tempfile
from datetime import datetime
from email.message import EmailMessage
from pathlib import Path
from model import BJ, stamp, validate
from render import subject, render, plain


def atomic(path, data):
    path = Path(path)
    fd, name = tempfile.mkstemp(prefix='.receipt-', dir=path.parent)
    try:
        with os.fdopen(fd, 'w') as stream:
            json.dump(data, stream, ensure_ascii=False, allow_nan=False)
            stream.flush()
            os.fsync(stream.fileno())
        os.chmod(name, 0o600)
        os.replace(name, path)
        directory = os.open(path.parent, os.O_RDONLY | getattr(os, 'O_DIRECTORY', 0))
        try:
            os.fsync(directory)
        finally:
            os.close(directory)
    finally:
        if Path(name).exists():
            Path(name).unlink()


def send(report, state, config, smtp_factory=smtplib.SMTP_SSL, now=None):
    validate(report)
    now = now or datetime.now(BJ)
    # A server monitoring mail describes today's observed snapshot, not yesterday's health report.
    if report['reportDate'] != now.astimezone(BJ).date().isoformat() or not -60 <= (now - stamp(report['generatedAt'])).total_seconds() <= 600:
        raise ValueError('Only a fresh report for today can be sent')
    state = Path(state)
    state.mkdir(parents=True, exist_ok=True, mode=0o700)
    key = report['reportDate'] + '-daily'
    receipt = state / (key + '.json')
    with (state / (key + '.lock')).open('a') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        if receipt.exists():
            prior = json.loads(receipt.read_text())
            if prior.get('status') == 'sent':
                return dict(prior, status='already_sent')
            raise RuntimeError('Uncertain prior send; reconcile Message-ID in Gmail before retrying')
        recipient = config['SMTP_USER']  # No caller-selected destination; same self mailbox as GT/LY.
        message = EmailMessage()
        message['From'] = message['To'] = recipient
        message['Subject'] = subject(report)
        message['Message-ID'] = '<server-monitor-daily-' + report['reportDate'] + '@thisisyz.com>'
        message.set_content(plain(report))
        message.add_alternative(render(report), subtype='html')
        result = {'status': 'sending', 'reportDate': report['reportDate'], 'kind': 'daily',
                  'messageId': str(message['Message-ID']), 'recipient': recipient,
                  'payloadSha256': hashlib.sha256(json.dumps(report, sort_keys=True, ensure_ascii=False, allow_nan=False).encode()).hexdigest(),
                  'startedAt': now.isoformat(), 'subject': str(message['Subject'])}
        with smtp_factory(config.get('SMTP_HOST', 'smtp.gmail.com'), int(config.get('SMTP_PORT', 465)),
                          context=ssl.create_default_context(), timeout=30) as server:
            server.login(config['SMTP_USER'], config['SMTP_PASS'])
            atomic(receipt, result)
            try:
                if server.send_message(message):
                    raise RuntimeError('Recipient refused')
            except BaseException:
                atomic(receipt, dict(result, status='uncertain'))
                raise
            result.update(status='sent', acceptedAt=datetime.now(BJ).isoformat())
            atomic(receipt, result)
        return result
