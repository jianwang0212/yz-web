import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

const i18n = readFileSync(new URL('../i18n.js', import.meta.url), 'utf8');
const codexMonthly = readFileSync(new URL('../projects/codex-monthly-2026-06.html', import.meta.url), 'utf8');
const whyJazz = readFileSync(new URL('../essays/why-jazz.html', import.meta.url), 'utf8');
const sublet = readFileSync(new URL('../papers/apartment-sublet.html', import.meta.url), 'utf8');
const essaysIndex = readFileSync(new URL('../essays/index.html', import.meta.url), 'utf8');
const whyMpe = readFileSync(new URL('../essays/why-mpe.html', import.meta.url), 'utf8');
const whyBerklee = readFileSync(new URL('../essays/why-berklee.html', import.meta.url), 'utf8');
const vocal = readFileSync(new URL('../essays/vocal-training-system.html', import.meta.url), 'utf8');
const trading = readFileSync(new URL('../essays/trading-emotions-and-risk.html', import.meta.url), 'utf8');
const ai = readFileSync(new URL('../essays/personal-ai-evolution.html', import.meta.url), 'utf8');
const freedom = readFileSync(new URL('../essays/financial-freedom-and-work.html', import.meta.url), 'utf8');
const career = readFileSync(new URL('../essays/career-and-long-termism.html', import.meta.url), 'utf8');
const happiness = readFileSync(new URL('../essays/happiness.html', import.meta.url), 'utf8');

test('public pages do not expose migration or maintainer notes', () => {
  const publicCopy = [
    i18n,
    codexMonthly,
    whyJazz,
    essaysIndex,
    whyMpe,
    whyBerklee,
    vocal,
    trading,
    ai,
    freedom,
    career,
    happiness,
  ].join('\n');

  for (const phrase of [
    '图文喂给 AI 版',
    '本机归档不放可点击路径',
    'Confluence 临时 blob 链接',
    '网页增加了总述',
    '网页整理于',
    '默认折叠。点击展开查看',
    '这里不是按发布日期堆叠的博客',
    '经过重写、匿名化和时间检验',
    'This is not a chronological blog',
    'rewritten, anonymized, and tested by time',
    'Draft for thisisyz',
    'migrationStatus=draft-for-site',
    '网页整理说明',
    '版本与公开边界',
    '这页怎样处理原始记录',
    '公开版删减',
    '公开改写版',
    '本地路径',
  ]) {
    assert.equal(publicCopy.includes(phrase), false, `Public copy should not include: ${phrase}`);
  }
});

test('Essays uses concise reader-facing titles in both languages', () => {
  for (const phrase of [
    '一些长期思考。',
    '关于市场、系统、音乐与生活。',
    '交易情绪与风险',
    '个人 AI 三年演化',
    '工作、伙伴与长期主义',
    '为什么想学爵士乐',
    '为什么去 Berklee',
    '为什么是 MPE',
    '声乐训练',
    '财务自由以后',
    '幸福、平和与选择权',
    '长期计划',
  ]) assert.match(`${essaysIndex}\n${i18n}`, new RegExp(phrase));

  for (const phrase of [
    'Long-term notes.',
    'On markets, systems, music, and life.',
    'Trading Emotions & Risk',
    'Three Years of Personal AI',
    'Work, Partners & Long-termism',
    'Why Jazz',
    'Why Berklee',
    'Why MPE',
    'Vocal Training',
    'After Financial Freedom',
    'Happiness, Peace & Choice',
    'Long-term Plans',
  ]) assert.ok(i18n.includes(phrase), `Missing concise English title: ${phrase}`);

  assert.match(essaysIndex, /i18n\.js\?v=20260721-essays-copy1/);
});

test('sublet page versions the shared translation bundle when its copy changes', () => {
  assert.match(sublet, /i18n\.js\?v=20260720-english-coverage1/);
});
