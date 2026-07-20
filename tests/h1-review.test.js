import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

const html = readFileSync(new URL('../2026-h1-review.html', import.meta.url), 'utf8');
const data = readFileSync(new URL('../2026-h1-review-data.js', import.meta.url), 'utf8');
const script = readFileSync(new URL('../2026-h1-review.js', import.meta.url), 'utf8');
const styles = readFileSync(new URL('../2026-h1-review.css', import.meta.url), 'utf8');
const yearReview = readFileSync(new URL('../year-review.html', import.meta.url), 'utf8');
const index = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const i18n = readFileSync(new URL('../i18n.js', import.meta.url), 'utf8');
const sitemap = readFileSync(new URL('../sitemap.xml', import.meta.url), 'utf8');

test('2026 H1 review is public, titled, and discoverable', () => {
  assert.match(html, /<title>2026 上半年 - Zi Yin<\/title>/);
  assert.match(html, /<h1 class="section-title">2026 上半年<\/h1>/);
  assert.match(html, /content="index, follow"/);
  assert.match(html, /https:\/\/thisisyz\.com\/2026-h1-review/);
  assert.match(yearReview, /class="review-switcher review-switcher--inline"/);
  assert.match(yearReview, /href="2026-h1-review\.html"[^>]*>2026 上半年/);
  assert.match(index, /href="\/2026-h1-review"/);
  assert.match(i18n, /'entry\.review\.title': '2026 上半年'/);
  assert.match(i18n, /'entry\.review\.title': '2026 H1 Review'/);
  assert.match(sitemap, /https:\/\/thisisyz\.com\/2026-h1-review/);
});

test('public bundle contains the approved review without draft residue', () => {
  const bundle = [html, data, script, styles].join('\n');
  assert.doesNotMatch(bundle, /私有访谈草稿|私有草稿|Not indexed|下一轮反向访谈/);
  assert.doesNotMatch(bundle, /atlassian\.net|127\.0\.0\.1|localhost|\/Users\/|\/var\/folders\//);
  assert.doesNotMatch(script, /innerHTML/);
});

test('financial narrative keeps source scope and approved numbers', () => {
  assert.match(html, /上半年确认收入 32 万人民币/);
  assert.match(html, /BOA 退款后净支出为 2\.86 万美元/);
  assert.match(data, /total: 32639\.75/);
  assert.match(data, /refund: 4006\.83/);
  assert.match(data, /net: 28632\.92/);
});
