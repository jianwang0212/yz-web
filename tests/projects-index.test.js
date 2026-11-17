import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';

const read = (name) => readFileSync(new URL(`../${name}`, import.meta.url), 'utf8');
const html = read('projects.html');
const behavior = read('projects-index.js');
const copy = read('projects-copy.js');
const css = read('projects-hubs.css');
const translations = { zh: {}, en: {} };
vm.runInNewContext(copy, { translations });
const cards = html.match(/<a class="purpose-card"[\s\S]*?<\/a>/g) || [];

function group(id) {
  return html.match(new RegExp(`<section id="${id}"[\\s\\S]*?<\\/section>`))?.[0] || '';
}

test('selected A has the literal Projects title and reviewed copy', () => {
  assert.match(html, /<title>项目<\/title>/);
  assert.match(html, /<h1[^>]*>项目<\/h1>/);
  assert.equal(translations.zh['projects.page.title'], '项目');
  assert.equal(translations.en['projects.page.title'], 'Projects');
  assert.equal(translations.zh['projects.page.intro'], '健康记录、音乐练习和工作工具。');
  for (const phrase of ['项目。', '先看用途', '再打开工具', '不用点进去猜', '三版预览']) {
    assert.equal(html.includes(phrase), false);
    assert.equal(copy.includes(phrase), false);
  }
});

test('14 whole-card links describe purpose, use case and contents without JavaScript', () => {
  assert.equal(cards.length, 14);
  for (const card of cards) {
    assert.match(card, /href="\/(?:health|projects)\//);
    assert.match(card, /aria-labelledby="project-[^"]+-title"/);
    for (const field of ['desc', 'when', 'outputs']) {
      assert.match(card, new RegExp(`data-i18n="projects.item.[^".]+.${field}"`));
    }
    assert.equal(card.includes('<button'), false);
  }
  assert.doesNotMatch(html, /bpm|4,644,325|2026-11-16|51\.4|14\.3/);
});

test('three topic groups preserve every existing active destination', () => {
  const routes = {
    health: ['/health/history/', '/health/weight/', '/projects/workout', '/projects/yoga-poses', '/health/environment/', '/health/records/'],
    music: ['/projects/interval-quiz', '/projects/degree-quiz', '/projects/chord-trainer', '/projects/left-hand-voicing-trainer', '/projects/stem-splitter', '/projects/song-leadsheet-database'],
    systems: ['/projects/dockingtech', '/projects/server-assets'],
  };
  for (const [id, paths] of Object.entries(routes)) {
    assert.equal((group(id).match(/class="purpose-card"/g) || []).length, paths.length);
    for (const path of paths) assert.ok(group(id).includes(`href="${path}"`));
    assert.ok(html.includes(`href="#${id}"`));
  }
  assert.ok(group('health').includes('href="/health/"'));
});

test('every page-local text and accessible label has Chinese and English copy', () => {
  const keys = [...html.matchAll(/data-i18n(?:-title|-description|-aria-label)?="(projects\.(?:page|item|archive)\.[^"]+)"/g)].map((m) => m[1]);
  assert.ok(keys.length > 90);
  for (const key of keys) {
    assert.ok(translations.zh[key]?.trim(), `Missing Chinese: ${key}`);
    assert.ok(translations.en[key]?.trim(), `Missing English: ${key}`);
  }
  assert.ok(html.indexOf('i18n.js?') < html.indexOf('/projects-copy.js?'));
  assert.ok(html.indexOf('/projects-copy.js?') < html.indexOf('/projects-index.js?'));
  assert.ok(copy.includes('人声与伴奏分离'));
  assert.ok(copy.includes('连接 MIDI 键盘'));
});

test('archive remains folded, with SocialPulse and three historical records', () => {
  const archive = html.match(/<details id="archive"[\s\S]*?<\/details>/)?.[0] || '';
  assert.match(archive, /data-project-group="archive"/);
  assert.doesNotMatch(archive, /<details[^>]*\bopen(?:\s|[=>])/);
  for (const path of ['/projects/socialpulse', '/projects/stock-research-dashboard', '/projects/codex-monthly-2026-06', '/projects/apartment-sublet']) {
    assert.ok(archive.includes(`href="${path}"`));
  }
  assert.equal((archive.match(/<a href=/g) || []).length, 4);
  assert.equal(html.includes('href="/projects/codex-monitor"'), false);
  assert.equal(html.includes('id="internal-tools"'), false);
  assert.equal(html.includes('href="/engineering"'), false);
});

function mount(hash = '') {
  const counts = [6, 6, 2];
  const groups = ['health', 'music', 'systems'].map((id, i) => ({
    dataset: { projectGroup: id }, hidden: false,
    querySelectorAll: () => Array(counts[i]).fill({}),
    scrollIntoView() { this.scrolled = true; },
  }));
  const filters = ['all', 'health', 'music', 'systems'].map((id) => ({
    dataset: { projectFilter: id }, attributes: {}, listeners: {},
    setAttribute(key, value) { this.attributes[key] = value; },
    addEventListener(key, fn) { this.listeners[key] = fn; },
  }));
  const count = { textContent: '' }, archive = { open: false }, listeners = {};
  const overviews = ['health', 'music', 'systems'].map((id) => ({
    listeners: {}, getAttribute: () => `#${id}`,
    addEventListener(key, fn) { this.listeners[key] = fn; },
  }));
  const document = {
    querySelectorAll: (s) => s.startsWith('.project-group') ? groups : s.startsWith('button') ? filters : overviews,
    querySelector: () => count,
    getElementById: (id) => id === 'archive' ? archive : groups.find((g) => g.dataset.projectGroup === id),
  };
  const window = { location: { hash }, addEventListener: (key, fn) => { listeners[key] = fn; } };
  window.history = { replaceState: (_state, _title, url) => { window.location.hash = url; } };
  vm.runInNewContext(behavior, { document, window });
  return { groups, filters, overviews, count, archive, listeners, window };
}

test('category filters update visibility, counts and pressed state', () => {
  const app = mount();
  assert.equal(app.count.textContent, '14');
  app.filters[3].listeners.click();
  assert.equal(app.count.textContent, '2');
  assert.deepEqual(app.groups.map((g) => g.hidden), [true, true, false]);
  assert.equal(app.filters[3].attributes['aria-pressed'], 'true');
  app.filters[0].listeners.click();
  assert.equal(app.count.textContent, '14');
});

test('legacy hash links reveal the selected topic and open the archive', () => {
  assert.equal(mount('#music').count.textContent, '6');
  const app = mount('#archive');
  assert.equal(app.archive.open, true);
  assert.equal(app.count.textContent, '14');
  app.window.location.hash = '#health';
  app.listeners.hashchange();
  assert.equal(app.count.textContent, '6');
});

test('overview links reveal a filtered-out topic before scrolling', () => {
  const app = mount();
  app.filters[3].listeners.click();
  app.overviews[1].listeners.click({ preventDefault() {}, stopImmediatePropagation() {} });
  assert.equal(app.count.textContent, '6');
  assert.equal(app.groups[1].hidden, false);
  assert.equal(app.groups[1].scrolled, true);
  assert.equal(app.window.location.hash, '#music');
});

test('production ships only A, with responsive and reduced-motion styles', () => {
  for (const source of [html, behavior, css]) assert.doesNotMatch(source, /VariantB|VariantC|prototype-switcher|data-variant|variant=/);
  assert.ok(css.includes('.purpose-card:hover'));
  assert.ok(css.includes('a:focus-visible'));
  assert.ok(css.includes('prefers-reduced-motion:reduce'));
  assert.ok(css.includes('@media print'));
  assert.ok(css.includes('.project-group[hidden]'));
  assert.ok(read('engineering.html').includes('GitHub Profile'));
  assert.equal(read('works.html').includes('href="/engineering"'), false);
  assert.ok(read('essays/index.html').includes('href="/projects/vipassana"'));
});
