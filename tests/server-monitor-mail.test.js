import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
test('daily server mail Python source/data/delivery safety contracts',()=>{const r=spawnSync('python3',['tests/test_server_monitor_mail.py'],{encoding:'utf8'});assert.equal(r.status,0,r.stdout+'\n'+r.stderr);});
test('primary server timer is Beijing07:10 and uses existing credential only in memory',()=>{const timer=fs.readFileSync('scripts/server-monitor-daily-mail.timer','utf8'),service=fs.readFileSync('scripts/server-monitor-daily-mail.service','utf8');assert.match(timer,/07:10:00 Asia\/Shanghai/);assert.match(timer,/Persistent=true/);assert.match(service,/LoadCredential=mail-key:/);assert.doesNotMatch(service,/SMTP_PASS|AKID/);});
