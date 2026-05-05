import path from 'node:path';
import { readJsonFile } from './json-file.js';

const INVENTORY_FILE = path.join(process.cwd(), 'data', 'socialpulse-inventory.json');

const EMPTY_INVENTORY = {
  generatedAt: null,
  indexPath: '',
  expectedPlatforms: ['instagram', 'x', 'reddit', 'xiaohongshu', 'douyin', 'zhihu'],
  totalPackages: 0,
  completePackages: 0,
  readyPackages: 0,
  partialPackages: 0,
  blockedPackages: 0,
  publishedPlatformPosts: 0,
  readyPlatformPosts: 0,
  platformSummaries: [],
  nextReadyPackages: [],
  recentlyCompletedPackages: [],
  issues: [],
  loadError: 'No inventory snapshot has been deployed yet.'
};

export async function loadInventorySnapshot() {
  const inventory = await readJsonFile(INVENTORY_FILE, null);

  if (!inventory) {
    return {
      ...EMPTY_INVENTORY,
      loadError: EMPTY_INVENTORY.loadError
    };
  }

  return inventory;
}
