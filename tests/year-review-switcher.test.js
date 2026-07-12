import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

const read = (name) => readFileSync(new URL(`../${name}`, import.meta.url), 'utf8');
const year2025 = read('year-review.html');
const h12026 = read('2026-h1-review.html');
const script = read('year-review-switcher.js');
const styles = read('year-review-switcher.css');

for (const [label, html] of [['2025', year2025], ['2026 H1', h12026]]) {
  test(`${label} review exposes the same year switcher`, () => {
    assert.match(html, /data-review-switcher/);
    assert.match(html, /class="review-switcher-link" href="year-review\.html"/);
    assert.match(html, /aria-label="选择总结时间"/);
    assert.match(html, />2025 年度总结<\/a>/);
    assert.match(html, />2026 上半年<\/a>/);
    assert.match(html, /year-review-switcher\.css\?v=20260712/);
    assert.match(html, /year-review-switcher\.js\?v=20260712/);
  });
}

test('main year-review label remains a real 2025 link', () => {
  assert.doesNotMatch(year2025, /review-switcher-link" href="#"/);
  assert.doesNotMatch(h12026, /review-switcher-link" href="#"/);
  assert.doesNotMatch(script, /preventDefault\(\).*review-switcher-link/);
});

test('switcher supports pointer, keyboard, mobile, and reduced motion', () => {
  assert.match(script, /event\.key === 'ArrowDown'/);
  assert.match(script, /event\.key === 'Escape'/);
  assert.match(script, /aria-expanded/);
  assert.match(script, /document\.addEventListener\('click'/);
  assert.match(styles, /@media \(max-width: 768px\)/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
});
