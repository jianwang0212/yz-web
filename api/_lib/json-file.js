import fs from 'node:fs/promises';
import path from 'node:path';

export async function ensureParentDir(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

export async function readJsonFile(filePath, fallback = null) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export async function readJsonFileWithStat(filePath) {
  const [stat, raw] = await Promise.all([
    fs.stat(filePath),
    fs.readFile(filePath, 'utf8')
  ]);

  return {
    stat,
    value: JSON.parse(raw)
  };
}

export async function writeJsonFile(filePath, value) {
  await ensureParentDir(filePath);
  await fs.writeFile(filePath, JSON.stringify(value, null, 2), 'utf8');
}
