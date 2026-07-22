import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { routeAliases } from '../site-routes.mjs';

const root = new URL('../', import.meta.url);
const destinations = [...new Set(['index.html', ...routeAliases.map(([, destination]) => destination)])]
  .filter((destination) => destination.endsWith('.html'));
const pages = destinations.map((destination) => ({
  destination,
  html: readFileSync(new URL(destination, root), 'utf8'),
}));
const i18n = readFileSync(new URL('i18n.js', root), 'utf8');

function visibleText(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(?:ldquo|rdquo|quot);/g, '"')
    .replace(/&(?:middot|bull);/g, '·')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

test('public pages do not explain the editing or publication process to readers', () => {
  const forbidden = [
    /材料边界/,
    /关于这篇记录/,
    /版本与(?:公开)?边界/,
    /网页整理说明/,
    /公开(?:整理|改写)版/,
    /本机归档(?:不放可点击路径)?/,
    /本地预览入口/,
    /临时公开页/,
    /数据已脱敏处理/,
    /Data Anonymized/i,
    /public project note/i,
    /public summary/i,
    /编辑过程|文件路径|我替你做了什么/,
    /这篇文章不是项目完成清单/,
    /已实现、实验中和仍在构想的部分分开标注/,
    /健康记录的边界/,
    /这页笔记里有三类根本问题/,
    /(?:这篇文章|这页|这株植物).{0,40}(?:不是为了|不是一条时间线|会成为|旁边应该|旁边，应该)/,
    /这里不是(?:一条普通时间线|证明)/,
    /(?:本文|这篇文章|这份笔记|这个网页|公开版|公开页面|这个版本|原页|旧页|原笔记).{0,60}(?:整理自|改写|删减|未记录来源|没有记录来源|没有记下出处|不再转载|不再全文|已经删除|已经删掉|收录过|摘录过)/,
  ];

  for (const { destination, html } of pages) {
    const copy = `${visibleText(html)}\n${html}`;
    for (const pattern of forbidden) {
      assert.doesNotMatch(copy, pattern, `${destination} should not expose editorial process copy`);
    }
  }

  for (const pattern of forbidden) {
    assert.doesNotMatch(i18n, pattern, 'i18n.js should not expose editorial process copy');
  }
});

test('safety notes stay concise and article-specific', () => {
  const vipassana = readFileSync(new URL('papers/vipassana.html', root), 'utf8');
  const trading = readFileSync(new URL('essays/trading-emotions-and-risk.html', root), 'utf8');

  assert.match(vipassana, /不构成医疗建议/);
  assert.match(vipassana, /不是医学结论/);
  assert.match(vipassana, /最新安排请以/);
  assert.match(trading, /不构成投资建议/);
});

test('shared translation changes use one cache-busting version', () => {
  const i18nPages = pages.filter(({ html }) => /i18n\.js\?v=/.test(html));
  assert.ok(i18nPages.length > 0);

  for (const { destination, html } of i18nPages) {
    assert.match(html, /i18n\.js\?v=20260722-public-copy1/, `${destination} needs the current i18n version`);
  }
});
