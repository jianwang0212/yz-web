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
const requiredAppIds = (process.env.ZAPP_REQUIRED_APP_IDS || process.env.ZAPP_REQUIRED_APP_ID || 'live-call,zi-style-reply')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    cwd: repoRoot,
    encoding: options.encoding || 'utf8',
    stdio: options.stdio || 'pipe'
  });
}

function readAppsJson(filePath) {
  const payload = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const appsById = new Map((payload.apps || []).map((item) => [item.id, item]));
  const missingAppIds = requiredAppIds.filter((id) => !appsById.has(id));
  if (missingAppIds.length > 0) {
    throw new Error(`${filePath} does not contain required app(s) "${missingAppIds.join(', ')}". Refusing to deploy.`);
  }
  return { payload, appsById };
}

function readOnlineAppsJsonWithRetry(url, attempts = 20) {
  let lastError = null;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      if (attempt > 1) {
        console.log(`Retrying live manifest verification (${attempt}/${attempts})...`);
      }
      return run('curl', ['-fsS', url]);
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        run('sleep', ['1']);
      }
    }
  }
  throw lastError;
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

const onlineAppsJson = readOnlineAppsJsonWithRetry('https://thisisyz.com/zapp/apps.json');
const onlinePayload = JSON.parse(onlineAppsJson);
const onlineAppsById = new Map((onlinePayload.apps || []).map((item) => [item.id, item]));
const missingOnlineAppIds = requiredAppIds.filter((id) => !onlineAppsById.has(id));

if (missingOnlineAppIds.length > 0) {
  throw new Error(`Deployment verification failed: online apps.json does not contain "${missingOnlineAppIds.join(', ')}".`);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      storeBuild: onlinePayload.store?.build,
      requiredAppIds,
      apps: Object.fromEntries(
        requiredAppIds.map((id) => {
          const app = onlineAppsById.get(id);
          return [id, { build: app.build, url: app.url }];
        }),
      )
    },
    null,
    2
  )
);
