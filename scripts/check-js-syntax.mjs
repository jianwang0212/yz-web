import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const ignoredDirs = new Set(['.git', 'node_modules', '.vercel', 'design_iterations']);
const files = [];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (ignoredDirs.has(entry)) continue;
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      walk(fullPath);
    } else if (entry.endsWith('.js') || entry.endsWith('.mjs')) {
      files.push(fullPath);
    }
  }
}

walk(root);

for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], {
    cwd: root,
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    process.stderr.write(`Syntax check failed: ${relative(root, file)}\n`);
    process.stderr.write(result.stderr || result.stdout);
    process.exit(result.status || 1);
  }
}

console.log(`Checked ${files.length} JavaScript files.`);
