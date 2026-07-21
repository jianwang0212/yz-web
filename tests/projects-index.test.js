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

test('projects index groups tools by domain and keeps reading pages in a folded archive', () => {
  const systemsStart = projectsHtml.indexOf('data-project-group="systems"');
  const musicStart = projectsHtml.indexOf('data-project-group="music"');
  const healthStart = projectsHtml.indexOf('data-project-group="health"');
  const archiveStart = projectsHtml.indexOf('data-project-group="archive"');

  assert.ok(systemsStart > -1, 'Expected a systems and research group');
  assert.ok(musicStart > systemsStart, 'Expected music after systems');
  assert.ok(healthStart > musicStart, 'Expected health after music');
  assert.ok(archiveStart > healthStart, 'Expected Archive at the end');

  const systemsSection = projectsHtml.slice(systemsStart, musicStart);
  const musicSection = projectsHtml.slice(musicStart, healthStart);
  const healthSection = projectsHtml.slice(healthStart, archiveStart);
  const archiveSection = projectsHtml.slice(archiveStart);

  for (const href of [
    '/projects/stock-research-dashboard',
    '/engineering',
    '/projects/codex-monitor',
    '/projects/socialpulse',
  ]) {
    expectIncludes(systemsSection, `href="${href}"`);
  }
  expectIncludes(healthSection, 'href="/projects/workout"');
  for (const href of [
    '/projects/interval-quiz',
    '/projects/degree-quiz',
    '/projects/chord-trainer',
    '/projects/left-hand-voicing-trainer',
    '/projects/stem-splitter',
    '/projects/song-leadsheet-database',
  ]) {
    expectIncludes(musicSection, `href="${href}"`);
  }

  assert.match(projectsHtml, /<details[^>]*class="project-archive"[^>]*data-project-group="archive"/);
  expectIncludes(archiveSection, 'href="/projects/codex-monthly-2026-06"');
  expectIncludes(archiveSection, 'href="/projects/vipassana"');
  expectIncludes(archiveSection, 'href="/projects/apartment-sublet"');
  assert.equal(projectsHtml.includes('href="/projects/mbti"'), false);

  for (const href of projectsHtml.matchAll(/class="project-card"/g)) {
    assert.ok(href.index >= systemsStart);
  }
  assert.equal((projectsHtml.match(/href="\/projects\/vipassana"/g) || []).length, 1);
  assert.equal((projectsHtml.match(/href="\/projects\/apartment-sublet"/g) || []).length, 1);
});

test('projects index offers direct category anchors', () => {
  for (const anchor of ['systems', 'health', 'music', 'archive']) {
    expectIncludes(projectsHtml, `href="#${anchor}"`);
  }
  expectIncludes(projectsHtml, 'data-open-project-archive');
  expectIncludes(projectsJs, "archive.open = true");
  expectIncludes(projectsJs, "window.location.hash === '#archive'");
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
