import { existsSync, statSync, readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

const snowWhiteHtml = readFileSync(new URL('../snow-white.html', import.meta.url), 'utf8');
const berkleeHtml = readFileSync(new URL('../berklee.html', import.meta.url), 'utf8');
const worksHtml = readFileSync(new URL('../works.html', import.meta.url), 'utf8');
const indexHtml = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const resumeHtml = readFileSync(new URL('../resume.html', import.meta.url), 'utf8');

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
  expectIncludes(worksHtml, 'href="/works/snow-white"');
  expectIncludes(indexHtml, 'href="/berklee"');
  expectIncludes(resumeHtml, 'href="/berklee"');
});
