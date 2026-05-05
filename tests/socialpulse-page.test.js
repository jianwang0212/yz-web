import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

const pageHtml = readFileSync(new URL('../projects/socialpulse.html', import.meta.url), 'utf8');
const latestApi = readFileSync(new URL('../api/socialpulse/latest.js', import.meta.url), 'utf8');
const platformConfig = readFileSync(new URL('../api/_lib/platform-config.js', import.meta.url), 'utf8');

test('socialpulse page keeps the inventory operations dashboard', () => {
  assert.match(pageHtml, /class="inventory-layout"/);
  assert.match(pageHtml, /id="platform-inventory-list"/);
  assert.match(pageHtml, /const platformOrder = \['instagram', 'x', 'reddit', 'xiaohongshu', 'douyin'\]/);
});

test('socialpulse latest api returns inventory with the shared response helpers', () => {
  assert.match(latestApi, /loadInventorySnapshot/);
  assert.match(latestApi, /inventory,/);
  assert.match(latestApi, /endOptions, requireMethod, sendJson, setCors/);
});

test('socialpulse public platform config includes douyin', () => {
  assert.match(platformConfig, /douyin/);
  assert.match(platformConfig, /抖音 \/ Douyin/);
});
