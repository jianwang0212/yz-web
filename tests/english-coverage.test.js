import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const root = new URL('..', import.meta.url);
const read = (path) => readFileSync(new URL(path, root), 'utf8');
const indexHtml = read('index.html');
const worksHtml = read('works.html');
const onePersonHtml = read('one-person.html');
const reviewData = read('2026-h1-review-data.js');
const i18n = read('i18n.js');

test('language runtime keeps site navigation listeners and clamps unsupported pages to Chinese', () => {
  assert.doesNotMatch(i18n, /cloneNode\(/, 'Language setup must not replace site-nav buttons');
  assert.match(i18n, /window\.ziPageSupportsEnglish !== false/);
  assert.match(i18n, /const effectiveLang/);
  assert.match(i18n, /window\.setSiteLanguage = setLanguage/);
  assert.match(read('site-nav.js'), /setPageLanguage !== setSiteLanguage/);
  for (const script of ['one-person.js', 'mirror.js', 'snow-white.js']) {
    assert.match(read(script), /window\.ziPageSupportsEnglish === false/, `${script} must respect page language availability`);
  }
});

test('One Person uses the requested bilingual release title in every title slot', () => {
  const title = "I can't / 一个人做不好";
  assert.match(indexHtml, new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(worksHtml, new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(onePersonHtml, new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(reviewData, new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(i18n, /'entry\.works\.onePerson': 'I can\\'t \/ 一个人做不好'/);
  assert.doesNotMatch(i18n, /No One Can Do It Alone/);
  assert.doesNotMatch(onePersonHtml, /"alternateName": "No One Does It Alone"/);
});

test('small verified-English pages have no known untranslated controls', () => {
  assert.match(read('essays/index.html'), /data-i18n-aria-label="essaysIndex\.categories\.aria"/);
  assert.match(read('essays/why-berklee.html'), /data-i18n="whyBerklee\.related\.whyJazz"/);
  for (const page of [
    'papers/interval-quiz.html',
    'papers/degree-quiz.html',
    'papers/chord-quiz.html',
  ]) {
    assert.match(read(page), /data-i18n="projects\.back"/);
  }
});
