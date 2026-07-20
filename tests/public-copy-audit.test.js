import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

const i18n = readFileSync(new URL('../i18n.js', import.meta.url), 'utf8');
const codexMonthly = readFileSync(new URL('../projects/codex-monthly-2026-06.html', import.meta.url), 'utf8');
const whyJazz = readFileSync(new URL('../essays/why-jazz.html', import.meta.url), 'utf8');
const sublet = readFileSync(new URL('../papers/apartment-sublet.html', import.meta.url), 'utf8');

test('public pages do not expose migration or maintainer notes', () => {
  const publicCopy = `${i18n}\n${codexMonthly}\n${whyJazz}`;

  for (const phrase of [
    '图文喂给 AI 版',
    '本机归档不放可点击路径',
    'Confluence 临时 blob 链接',
    '网页增加了总述',
    '网页整理于',
    '默认折叠。点击展开查看',
  ]) {
    assert.equal(publicCopy.includes(phrase), false, `Public copy should not include: ${phrase}`);
  }
});

test('sublet page versions the shared translation bundle when its copy changes', () => {
  assert.match(sublet, /i18n\.js\?v=20260720-public-copy/);
});
