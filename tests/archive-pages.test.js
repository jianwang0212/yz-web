import { existsSync, statSync, readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

const snowWhiteHtml = readFileSync(new URL('../snow-white.html', import.meta.url), 'utf8');
const berkleeHtml = readFileSync(new URL('../berklee.html', import.meta.url), 'utf8');
const worksHtml = readFileSync(new URL('../works.html', import.meta.url), 'utf8');
const indexHtml = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const resumeHtml = readFileSync(new URL('../resume.html', import.meta.url), 'utf8');
const dockingtechHtml = readFileSync(new URL('../projects/dockingtech.html', import.meta.url), 'utf8');
const yearReviewHtml = readFileSync(new URL('../year-review.html', import.meta.url), 'utf8');

function expectIncludes(source, value, message) {
  assert.ok(source.includes(value), message || `Expected source to include ${value}`);
}

test('snow white archive page and assets are tracked together', () => {
  expectIncludes(snowWhiteHtml, 'Snow White / 白雪公主');
  expectIncludes(snowWhiteHtml, 'assets/snow-white/snow-white-rough-mix.mp3');
  expectIncludes(snowWhiteHtml, 'snow-white.css');
  expectIncludes(snowWhiteHtml, 'snow-white.js');

  const audioFile = new URL('../assets/snow-white/snow-white-rough-mix.mp3', import.meta.url);
  const fullScorePreview = new URL('../assets/snow-white/thumbs/snow-white-full-score.pdf.png', import.meta.url);
  assert.equal(existsSync(audioFile), true);
  assert.equal(existsSync(fullScorePreview), true);
  assert.ok(statSync(audioFile).size > 1_000_000, 'Expected the Snow White audio file to be present');
});

test('berklee course page is restored with its scripts and stylesheet', () => {
  expectIncludes(berkleeHtml, 'Berklee 课程概览');
  expectIncludes(berkleeHtml, 'berklee.css');
  expectIncludes(berkleeHtml, 'berklee.js');
  assert.equal(existsSync(new URL('../site-nav.js', import.meta.url)), true);
});

test('public entry points link to recovered pages', () => {
  expectIncludes(worksHtml, 'class="works-snow-feature"');
  expectIncludes(worksHtml, 'href="/snow-white"');
  expectIncludes(indexHtml, 'href="/berklee"');
  expectIncludes(indexHtml, 'href="/projects/dockingtech"');
  expectIncludes(resumeHtml, 'href="/berklee"');
});

test('dockingtech page keeps BP-derived assets with the page', () => {
  expectIncludes(dockingtechHtml, '入坞科技 Dockingtech');
  expectIncludes(dockingtechHtml, '<a class="nav-brand site-title" href="/" aria-label="返回 Zi Yin 首页">');
  expectIncludes(dockingtechHtml, 'projects/dockingtech.css');
  expectIncludes(dockingtechHtml, '/assets/dockingtech/team-zi.webp');
  expectIncludes(dockingtechHtml, '/assets/dockingtech/team-karl.webp');
  assert.equal(dockingtechHtml.includes('id="product"'), false);
  assert.equal(dockingtechHtml.includes('id="traction"'), false);
  assert.equal(dockingtechHtml.includes('id="moat"'), false);
  assert.equal(dockingtechHtml.includes('id="next"'), false);
  assert.equal(dockingtechHtml.includes('内容根据《炼刀-BP'), false);
  assert.equal(existsSync(new URL('../assets/dockingtech/team-zi.webp', import.meta.url)), true);
  assert.equal(existsSync(new URL('../assets/dockingtech/team-karl.webp', import.meta.url)), true);
});

test('dockingtech finance modal requires its own password before rendering chart data', () => {
  expectIncludes(yearReviewHtml, 'id="docking-tech-password-form"');
  expectIncludes(yearReviewHtml, 'id="docking-tech-password-input"');
  expectIncludes(yearReviewHtml, 'id="docking-tech-password-submit"');
  expectIncludes(yearReviewHtml, 'id="docking-tech-financial-content" style="display: none;"');
  expectIncludes(yearReviewHtml, "const FINANCIAL_PASSWORD = '106106'");
  expectIncludes(yearReviewHtml, "dockingTechModal.dataset.financialUnlocked = 'false'");
  expectIncludes(yearReviewHtml, "modalTarget === 'docking-tech-modal'");
  expectIncludes(yearReviewHtml, "modal.dataset.financialUnlocked !== 'true'");
  expectIncludes(yearReviewHtml, "document.addEventListener('docking-tech-financial-unlocked', renderDockingTechChartIfUnlocked)");
  expectIncludes(yearReviewHtml, "document.addEventListener('docking-tech-financial-locked', destroyDockingTechChart)");
  assert.equal(yearReviewHtml.includes('docking-tech-financial-authenticated'), false);
});
