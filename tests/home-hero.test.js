import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

const indexHtml = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const i18nJs = readFileSync(new URL('../i18n.js', import.meta.url), 'utf8');

function expectIncludes(source, value, message) {
  assert.ok(source.includes(value), message || `Expected source to include ${value}`);
}

test('home hero renders zh role tokens as structured units', () => {
  for (const token of ['quant', 'founder', 'musician']) {
    expectIncludes(indexHtml, `data-role-token="${token}"`);
  }

  expectIncludes(indexHtml, 'data-i18n="hero.role.quant"');
  expectIncludes(indexHtml, 'data-i18n="hero.role.founder"');
  expectIncludes(indexHtml, 'data-i18n="hero.role.musician"');
  expectIncludes(i18nJs, "'hero.role.quant': '量化研究员'");
  expectIncludes(i18nJs, "'hero.role.founder': '创业者'");
  expectIncludes(i18nJs, "'hero.role.musician': '音乐人'");
});

test('home hero renders en role tokens from the same structured keys', () => {
  expectIncludes(i18nJs, "'hero.role.quant': 'Quant Researcher'");
  expectIncludes(i18nJs, "'hero.role.founder': 'Founder'");
  expectIncludes(i18nJs, "'hero.role.musician': 'Musician'");
  expectIncludes(indexHtml, 'data-i18n-aria-label="hero.title.aria"');
  expectIncludes(i18nJs, "'hero.title.aria': 'Quant Researcher, Founder, Musician'");
});

test('primary CTA exists, has stable copy, is focusable, and targets email', () => {
  const ctaMatch = indexHtml.match(/<a href="mailto:silver\.ziyin@gmail\.com" class="cta-email cta-email-primary" data-i18n="hero\.cta">([^<]+)<\/a>/);
  assert.ok(ctaMatch, 'Expected primary mail CTA anchor');
  assert.equal(ctaMatch[1], '联系合作');
  expectIncludes(i18nJs, "'hero.cta': '联系合作'");
  expectIncludes(i18nJs, "'hero.cta': 'Start a Conversation'");
});

test('language controls expose accessible names and selected state', () => {
  expectIncludes(indexHtml, 'id="lang-zh" class="lang-btn active" type="button" aria-label="切换到中文" aria-pressed="true"');
  expectIncludes(indexHtml, 'id="lang-en" class="lang-btn" type="button" aria-label="Switch to English" aria-pressed="false"');
  expectIncludes(indexHtml, 'id="lang-zh-mobile" class="lang-btn-mobile active" type="button" aria-label="切换到中文" aria-pressed="true"');
  expectIncludes(indexHtml, 'id="lang-en-mobile" class="lang-btn-mobile" type="button" aria-label="Switch to English" aria-pressed="false"');
  expectIncludes(i18nJs, "btn.setAttribute('aria-pressed', 'false')");
  expectIncludes(i18nJs, "activeLangBtn.setAttribute('aria-pressed', 'true')");
});

test('home navigation has an active current-page state', () => {
  expectIncludes(indexHtml, '<ul class="nav-menu" id="primary-navigation">');
  expectIncludes(indexHtml, '<a href="index.html" class="nav-link active" aria-current="page" data-i18n="nav.home">首页</a>');
  expectIncludes(indexHtml, 'class="hamburger" role="button" tabindex="0" aria-label="打开导航菜单" aria-controls="primary-navigation"');
});

test('credential cards have expected content and explicit link semantics', () => {
  const credentialCards = indexHtml.match(/class="metric-row(?: hero-identity)? credential-card"/g) || [];
  assert.equal(credentialCards.length, 3);

  for (const href of ['https://www.a47g.com/', 'https://www.citadelsecurities.com/', 'https://www.berklee.edu/']) {
    expectIncludes(indexHtml, `href="${href}"`);
  }

  for (const key of [
    'hero.identity.left',
    'hero.identity.right',
    'hero.experience.left',
    'hero.experience.right',
    'hero.training.left',
    'hero.training.right',
  ]) {
    expectIncludes(indexHtml, `data-i18n="${key}"`);
  }
});
