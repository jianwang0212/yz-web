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
const projects = readFileSync(new URL('../projects.html', import.meta.url), 'utf8');
const intj = readFileSync(new URL('../essays/intj.html', import.meta.url), 'utf8');

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
    projects,
    intj,
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

  assert.match(essaysIndex, /i18n\.js\?v=20260721-project-categories1/);
  assert.match(`${essaysIndex}\n${i18n}`, /我的 INTJ/);
  assert.match(i18n, /My INTJ/);
});

test('Projects copy addresses readers without explaining the information architecture', () => {
  assert.match(projects, /一些正在使用、持续迭代的系统与工具。/);
  for (const phrase of [
    '方便访客快速理解每个入口的用途',
    '降低视觉优先级',
    '公开作品放在前面',
    'internal tools are grouped separately',
  ]) {
    assert.equal(`${projects}\n${i18n}`.includes(phrase), false, `Projects should not include: ${phrase}`);
  }
});

test('sublet page versions the shared translation bundle when its copy changes', () => {
  assert.match(sublet, /i18n\.js\?v=20260720-english-coverage1/);
});
