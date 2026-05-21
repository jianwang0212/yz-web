import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(__filename), '..');
const zappRoot = path.join(repoRoot, 'zapp');
const appsJsonPath = path.join(zappRoot, 'apps.json');
const sshKey = process.env.ZAPP_SSH_KEY || path.join(process.env.HOME || '', '.ssh/id_ed25519_thisisyz_zapp');
const remote = process.env.ZAPP_REMOTE || 'root@thisisyz.com';
const remoteRoot = process.env.ZAPP_REMOTE_ROOT || '/opt/zy-personal-web-clean/zapp/';
const requiredAppId = process.env.ZAPP_REQUIRED_APP_ID || 'live-call';

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    cwd: repoRoot,
    encoding: options.encoding || 'utf8',
    stdio: options.stdio || 'pipe'
  });
}

function readAppsJson(filePath) {
  const payload = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const app = payload.apps?.find((item) => item.id === requiredAppId);
  if (!app) {
    throw new Error(`${filePath} does not contain required app "${requiredAppId}". Refusing to deploy.`);
  }
  return { payload, app };
}

readAppsJson(appsJsonPath);

if (!fs.existsSync(sshKey)) {
  throw new Error(`SSH key not found: ${sshKey}`);
}

console.log(`Deploying canonical Zapp from ${zappRoot}`);
console.log(`Remote target: ${remote}:${remoteRoot}`);

run(
  'rsync',
  [
    '-az',
    '--delete',
    '-e',
    `ssh -i ${sshKey} -o StrictHostKeyChecking=accept-new`,
    `${zappRoot}/`,
    `${remote}:${remoteRoot}`
  ],
  { stdio: 'inherit' }
);

run('ssh', ['-i', sshKey, remote, 'systemctl reload-or-restart zy-personal-web.service && systemctl is-active zy-personal-web.service'], {
  stdio: 'inherit'
});

const onlineAppsJson = run('curl', ['-fsS', 'https://thisisyz.com/zapp/apps.json']);
const onlinePayload = JSON.parse(onlineAppsJson);
const onlineApp = onlinePayload.apps?.find((item) => item.id === requiredAppId);

if (!onlineApp) {
  throw new Error(`Deployment verification failed: online apps.json does not contain "${requiredAppId}".`);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      storeBuild: onlinePayload.store?.build,
      requiredAppId,
      appBuild: onlineApp.build,
      appUrl: onlineApp.url
    },
    null,
    2
  )
);
