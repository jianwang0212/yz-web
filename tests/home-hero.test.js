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
  expectIncludes(indexHtml, '<a class="nav-brand site-title" href="/" aria-label="返回 Zi Yin 首页">');
  expectIncludes(indexHtml, '<ul class="nav-menu" id="primary-navigation">');
  expectIncludes(indexHtml, '<a href="index.html" class="nav-link active" aria-current="page" data-i18n="nav.home">首页</a>');
  expectIncludes(indexHtml, 'class="hamburger" role="button" tabindex="0" aria-label="打开导航菜单" aria-controls="primary-navigation"');
});

test('credential cards have expected content and explicit link semantics', () => {
  const credentialCards = indexHtml.match(/class="metric-row(?: hero-identity)? credential-card credential-card-link"/g) || [];
  assert.equal(credentialCards.length, 5);

  for (const href of ['https://www.a47g.com/', '/projects/dockingtech', 'https://www.citadelsecurities.com/', '/images/credentials/oxford-mphil.jpg', '/berklee']) {
    expectIncludes(indexHtml, `href="${href}"`);
  }

  const credentialCtas = indexHtml.match(/class="credential-card-cta"/g) || [];
  assert.equal(credentialCtas.length, 5);

  for (const key of [
    'hero.identity.left',
    'hero.identity.right',
    'hero.docking.left',
    'hero.docking.right',
    'hero.experience.left',
    'hero.experience.right',
    'hero.oxford.left',
    'hero.oxford.right',
    'hero.training.left',
    'hero.training.right',
  ]) {
    expectIncludes(indexHtml, `data-i18n="${key}"`);
  }

  expectIncludes(indexHtml, 'A47G私募基金');
  expectIncludes(i18nJs, "'hero.identity.left': 'A47G私募基金'");
  expectIncludes(i18nJs, "'hero.identity.left': 'A47G Private Fund'");
  expectIncludes(indexHtml, '前 Citadel Securities (London)');
  expectIncludes(indexHtml, '美股量化交易员');
  expectIncludes(indexHtml, '牛津大学');
  expectIncludes(indexHtml, '计量经济学研究生');
  expectIncludes(i18nJs, "'hero.experience.left': '前 Citadel Securities (London)'");
  expectIncludes(i18nJs, "'hero.experience.right': '美股量化交易员'");
  expectIncludes(i18nJs, "'hero.experience.right': 'U.S. Equities Quant Trader'");
  expectIncludes(i18nJs, "'hero.oxford.left': '牛津大学'");
  expectIncludes(i18nJs, "'hero.oxford.right': '计量经济学研究生'");
  expectIncludes(i18nJs, "'hero.oxford.right': 'Econometrics Graduate Student'");
});

test('home resume section appears before long-term records', () => {
  const resumeIndex = indexHtml.indexOf('<section id="home-resume" class="home-resume">');
  const entryIndex = indexHtml.indexOf('<section id="entry" class="entry">');
  assert.ok(resumeIndex > -1, 'Expected home resume section');
  assert.ok(entryIndex > -1, 'Expected entry section');
  assert.ok(resumeIndex < entryIndex, 'Expected resume section before entry records');

  expectIncludes(indexHtml, 'href="resume.html" class="home-resume-link" data-i18n="homeResume.link"');
  expectIncludes(indexHtml, 'data-i18n="homeResume.title"');
  expectIncludes(i18nJs, "'homeResume.title': '量化交易、创业与音乐创作的交叉履历'");
  expectIncludes(i18nJs, "'homeResume.link': 'View Full Resume'");
});

test('home page features music archives before resume records', () => {
  const snowIndex = indexHtml.indexOf('<section id="home-snow" class="home-snow-feature"');
  const resumeIndex = indexHtml.indexOf('<section id="home-resume" class="home-resume">');
  assert.ok(snowIndex > -1, 'Expected Snow White feature section');
  assert.ok(resumeIndex > snowIndex, 'Expected music archive feature before resume section');

  expectIncludes(indexHtml, 'Snow White / 白雪公主');
  expectIncludes(indexHtml, 'Mirror / 镜子');
  expectIncludes(indexHtml, '<section id="home-snow" class="home-snow-feature"');
  expectIncludes(indexHtml, '<article class="home-snow-card">');
  expectIncludes(indexHtml, 'href="/snow-white" class="home-snow-primary"');
  expectIncludes(indexHtml, '<article class="home-snow-card home-mirror-card">');
  expectIncludes(indexHtml, 'href="/mirror" class="home-snow-primary"');
  assert.equal(
    indexHtml.includes('class="home-snow-secondary"'),
    false,
    'Home music share cards should expose only primary open actions'
  );
  assert.equal(
    indexHtml.includes('class="home-snow-preview"'),
    false,
    'Home page should keep Snow White as a compact share card, not a full score preview'
  );
});
