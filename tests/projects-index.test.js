import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

const projectsHtml = readFileSync(new URL('../projects.html', import.meta.url), 'utf8');
const i18nJs = readFileSync(new URL('../i18n.js', import.meta.url), 'utf8');
const scriptJs = readFileSync(new URL('../script.js', import.meta.url), 'utf8');
const stylesCss = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');
const projectsJs = readFileSync(new URL('../projects-index.js', import.meta.url), 'utf8');

function expectIncludes(source, value, message) {
  assert.ok(source.includes(value), message || `Expected source to include ${value}`);
}

test('projects index has three daily hubs and a collapsed archive', () => {
  assert.equal((projectsHtml.match(/class="project-hub(?: project-hub-health)?"/g) || []).length, 3);
  const healthStart = projectsHtml.indexOf('data-project-group="health"');
  const musicStart = projectsHtml.indexOf('data-project-group="music"');
  const systemsStart = projectsHtml.indexOf('data-project-group="systems"');
  const archiveStart = projectsHtml.indexOf('data-project-group="archive"');
  assert.ok(healthStart < musicStart && musicStart < systemsStart && systemsStart < archiveStart);
  const health = projectsHtml.slice(healthStart, musicStart);
  const music = projectsHtml.slice(musicStart, systemsStart);
  const systems = projectsHtml.slice(systemsStart, archiveStart);
  const archiveSection = projectsHtml.slice(archiveStart);
  for (const href of ['/health/', '/health/history/', '/health/weight/', '/health/environment/', '/health/records/', '/projects/workout', '/projects/yoga-poses']) {
    expectIncludes(health, `href="${href}"`);
  }
  for (const href of ['/projects/interval-quiz','/projects/degree-quiz','/projects/chord-trainer','/projects/left-hand-voicing-trainer','/projects/stem-splitter','/projects/song-leadsheet-database']) {
    expectIncludes(music, `href="${href}"`);
  }
  for (const href of ['/projects/dockingtech','/projects/socialpulse','/projects/codex-monitor','/projects/server-assets']) {
    expectIncludes(systems, `href="${href}"`);
  }
  assert.match(projectsHtml, /<details id="archive" class="project-archive" data-project-group="archive">/);
  assert.doesNotMatch(projectsHtml, /<details[^>]*\bopen(?:\s|[=>])/);
  for (const href of ['/projects/stock-research-dashboard','/projects/codex-monthly-2026-06','/projects/apartment-sublet']) {
    expectIncludes(archiveSection, `href="${href}"`);
  }
  assert.equal(systems.includes('href="/projects/stock-research-dashboard"'), false);
  assert.equal(projectsHtml.includes('href="/engineering"'), false);
  assert.equal(projectsHtml.includes('href="/projects/vipassana"'), false);
  assert.doesNotMatch(projectsHtml, /bpm|4,644,325|2026-11-16|51\.4|14\.3/);
});

test('projects keeps old section anchors and translated page-local copy', () => {
  for (const anchor of ['systems', 'health', 'music', 'archive']) {
    expectIncludes(projectsHtml, `id="${anchor}"`);
  }
  expectIncludes(projectsJs, "archive.open = true");
  expectIncludes(projectsJs, "window.location.hash === '#archive'");
  expectIncludes(projectsJs, 'Object.assign(translations.zh');
  expectIncludes(projectsJs, 'Object.assign(translations.en');
  expectIncludes(projectsHtml, '/projects-hubs.css?v=20261117');
});

test('projects index copy describes its categories and current SocialPulse platforms', () => {
  expectIncludes(projectsHtml, 'data-i18n-title="projects.meta.title"');
  expectIncludes(i18nJs, "'projects.meta.title': 'Projects - Zi Yin'");
  expectIncludes(i18nJs, "'projects.systems.title': '系统与研究'");
  expectIncludes(i18nJs, "'projects.systems.title': 'Systems & Research'");
  expectIncludes(i18nJs, "'projects.health.title': '健康'");
  expectIncludes(i18nJs, "'projects.music.title': '音乐工具'");
  expectIncludes(i18nJs, "'projects.archive.title': 'Archive'");
  expectIncludes(i18nJs, "'projects.engineering_title': 'Engineering / GitHub'");
  expectIncludes(i18nJs, "'projects.stock_research_title': '金融研究工作台'");
  expectIncludes(i18nJs, "'projects.stock_research_title': 'Finance Research Workbench'");
  expectIncludes(
    i18nJs,
    "'projects.socialpulse_desc': '五个平台的发布状态、库存和最近标题'"
  );
  expectIncludes(
    i18nJs,
    "'projects.socialpulse_desc': 'Publish status, inventory, and recent titles across five platforms'"
  );
  assert.equal(
    i18nJs.includes('Instagram、知乎、Reddit、小红书、X 的实时检查面板'),
    false
  );
});

test('mobile navigation fills missing accessibility attributes', () => {
  expectIncludes(scriptJs, "navMenu.id = 'primary-navigation'");
  expectIncludes(scriptJs, "hamburger.setAttribute('role', 'button')");
  expectIncludes(scriptJs, "hamburger.setAttribute('tabindex', '0')");
  expectIncludes(scriptJs, "hamburger.setAttribute('aria-controls', navMenu.id)");
});

test('project cards keep whole-card links without visible text underlines', () => {
  expectIncludes(stylesCss, '.projects-page .project-card *');
  expectIncludes(stylesCss, 'text-decoration: none !important;');
  expectIncludes(stylesCss, 'box-shadow: var(--shadow-md);');
  expectIncludes(stylesCss, 'transform: translateY(-5px);');
});

test('showcase and reading entries move without changing their legacy URLs', () => {
  const works = readFileSync(new URL('../works.html', import.meta.url), 'utf8');
  const essays = readFileSync(new URL('../essays/index.html', import.meta.url), 'utf8');
  expectIncludes(works, 'href="/engineering"');
  expectIncludes(essays, 'href="/projects/vipassana"');
});
