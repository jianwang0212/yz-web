import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync(new URL('../projects/dockingtech/liandao/compute/index.html', import.meta.url), 'utf8');
const payload = html.match(/<script id="data" type="application\/json">(.*?)<\/script>/s)?.[1];
const data = JSON.parse(payload);
const total = (key) => data.customers.reduce((sum, row) => sum + row[key], 0);

test('cleaned snapshot reconciles accounts, total and feature consumption', () => {
  assert.equal(data.customers.length, 4450);
  assert.equal(new Set(data.customers.map(r => r.id)).size, 4450);
  assert.equal(total('total'), 31022237945);
  assert.equal(total('total'), data.total);
  assert.equal(total('parts'), data.parts);
  assert.equal(total('gap'), total('total') - total('parts'));
  for (const row of data.customers) {
    assert.equal(row.f.length, data.features.length);
    assert.equal(row.f.reduce((a, b) => a + b, 0), row.parts);
    assert.equal(row.total - row.parts, row.gap);
  }
});

test('industry provenance remains visible and unverified categories are honest', () => {
  const counts = {};
  for (const row of data.customers) counts[row.industry_basis] = (counts[row.industry_basis] || 0) + 1;
  assert.deepEqual(counts, {'原始': 1286, '名称推断': 858, '待补充': 2306});
  assert.ok(data.customers.filter(r => r.industry_basis === '待补充').every(r => r.industry === '待补充'));
  assert.match(html, /默认仅展示有分类账号/);
  assert.match(html, /推断项保留待核验标记/);
});

test('public snapshot omits original customer identities and private audit records', () => {
  for (const row of data.customers) {
    assert.match(row.id, /^DC\d{4}$/);
    assert.match(row.name, /^客户 \d{4}$/);
    assert.equal(row.industry_raw, undefined);
  }
  assert.equal(data.cleaning.excluded.records, undefined);
  assert.equal(data.cleaning.reconciliation, undefined);
});

test('project entry retains existing production sections and adds the report', () => {
  const entry = fs.readFileSync(new URL('../projects/dockingtech.html', import.meta.url), 'utf8');
  assert.match(entry, /href="\/projects\/dockingtech\/liandao\/compute\/"/);
  assert.match(entry, /\/projects\/dockingtech\/liandao\//);
  assert.match(entry, /\/projects\/dockingtech-photos\//);
  assert.match(entry, /不代表当前经营状况/);
});
