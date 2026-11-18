#!/bin/sh
set -eu
# Existing self-mail credentials; never copy or print them.
set -a
. /etc/gtarb/alert.env
set +a
# One added report route; existing health command and payload handling are unchanged.
if [ "${SSH_ORIGINAL_COMMAND:-}" = "server-monitor-daily-report" ]; then
    exec /usr/bin/python3 /root/server-monitor-daily-mail/receive.py
fi
exec /usr/bin/python3 /root/health-daily-mail/relay.py
